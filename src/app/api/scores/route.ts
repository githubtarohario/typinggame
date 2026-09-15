import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { scores } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

const schema = z.object({
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  accuracy: z.number().min(0).max(100),
  wpm: z.number().min(0),
  correctCount: z.number().int().min(0),
  missCount: z.number().int().min(0),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "認証されていません" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力が不正です" },
      { status: 400 },
    );
  }

  const db = getDb();
  const [created] = await db
    .insert(scores)
    .values({ userId: session.userId, ...parsed.data })
    .returning();

  return NextResponse.json({ ok: true, score: created });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "認証されていません" }, { status: 401 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(scores)
    .where(eq(scores.userId, session.userId))
    .orderBy(desc(scores.playedAt));

  return NextResponse.json({ scores: rows });
}
