import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword, createSession } from "@/lib/auth";

const schema = z.object({
  username: z.string().min(1, "ユーザIDを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
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
  const { username, password } = parsed.data;

  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      { error: "ユーザIDまたはパスワードが正しくありません" },
      { status: 401 },
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "ユーザIDまたはパスワードが正しくありません" },
      { status: 401 },
    );
  }

  await createSession({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  });

  return NextResponse.json({ ok: true });
}
