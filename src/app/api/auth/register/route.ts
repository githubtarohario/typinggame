import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, count } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword, createSession } from "@/lib/auth";

const schema = z.object({
  username: z.string().min(3, "ユーザIDは3文字以上で入力してください").max(50),
  displayName: z.string().min(1, "名前を入力してください").max(50),
  password: z.string().min(4, "パスワードは4文字以上で入力してください").max(100),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力が不正です" },
      { status: 400 },
    );
  }
  const { username, displayName, password } = parsed.data;

  const db = getDb();
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "そのユーザIDは既に使用されています" },
      { status: 409 },
    );
  }

  const [{ value: userCount }] = await db
    .select({ value: count() })
    .from(users);
  const role = userCount === 0 ? "admin" : "user";

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(users)
    .values({ username, displayName, passwordHash, role })
    .returning();

  await createSession({
    userId: created.id,
    username: created.username,
    displayName: created.displayName,
    role: created.role,
  });

  return NextResponse.json({ ok: true });
}
