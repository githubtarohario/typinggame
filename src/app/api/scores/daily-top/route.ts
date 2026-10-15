import { NextResponse } from "next/server";
import { eq, gte, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, scores } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "認証されていません" }, { status: 401 });
  }

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const db = getDb();
  const rows = await db
    .select({
      displayName: users.displayName,
      difficulty: scores.difficulty,
      accuracy: scores.accuracy,
      wpm: scores.wpm,
      playedAt: scores.playedAt,
    })
    .from(scores)
    .innerJoin(users, eq(scores.userId, users.id))
    .where(gte(scores.playedAt, startOfToday))
    .orderBy(desc(scores.accuracy), desc(scores.wpm))
    .limit(20);

  return NextResponse.json({ scores: rows });
}
