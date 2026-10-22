import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, scores } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const userId = Number.parseInt(id, 10);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "不正なユーザーIDです" }, { status: 400 });
  }

  if (userId === session.userId) {
    return NextResponse.json(
      { error: "自分自身を削除することはできません" },
      { status: 400 },
    );
  }

  const db = getDb();

  // 外部キー制約があるため、先に関連するプレイ記録を削除する
  await db.delete(scores).where(eq(scores.userId, userId));

  const deleted = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
