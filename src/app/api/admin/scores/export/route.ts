import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, scores } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { DIFFICULTY_LABELS, Difficulty } from "@/data/typing-words";

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const db = getDb();
  const rows = await db
    .select({
      username: users.username,
      displayName: users.displayName,
      difficulty: scores.difficulty,
      accuracy: scores.accuracy,
      wpm: scores.wpm,
      correctCount: scores.correctCount,
      missCount: scores.missCount,
      playedAt: scores.playedAt,
    })
    .from(scores)
    .innerJoin(users, eq(scores.userId, users.id))
    .orderBy(desc(scores.playedAt));

  const header = [
    "日時",
    "ユーザID",
    "名前",
    "難易度",
    "正解率",
    "WPM",
    "正解数",
    "ミス数",
  ];

  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.playedAt,
        r.username,
        r.displayName,
        DIFFICULTY_LABELS[r.difficulty as Difficulty],
        r.accuracy,
        r.wpm,
        r.correctCount,
        r.missCount,
      ]
        .map((v) => escapeCsvField(String(v)))
        .join(","),
    );
  }

  const csv = "﻿" + lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="scores.csv"`,
    },
  });
}
