import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, gte, lt, count } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { scores } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付はYYYY-MM-DD形式で指定してください"),
});

function dayRange(date: string) {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return null;
  }
  return session;
}

// 指定日のスコア件数を取得(削除前の確認用)
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const date = request.nextUrl.searchParams.get("date") ?? "";
  const parsed = schema.safeParse({ date });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "日付が不正です" },
      { status: 400 },
    );
  }

  const { start, end } = dayRange(parsed.data.date);
  const db = getDb();
  const [{ value: targetCount }] = await db
    .select({ value: count() })
    .from(scores)
    .where(and(gte(scores.playedAt, start), lt(scores.playedAt, end)));

  return NextResponse.json({ count: targetCount });
}

// 指定日のスコアを全件削除する
export async function DELETE(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "日付が不正です" },
      { status: 400 },
    );
  }

  const { start, end } = dayRange(parsed.data.date);
  const db = getDb();
  const deleted = await db
    .delete(scores)
    .where(and(gte(scores.playedAt, start), lt(scores.playedAt, end)))
    .returning({ id: scores.id });

  return NextResponse.json({ ok: true, deletedCount: deleted.length });
}
