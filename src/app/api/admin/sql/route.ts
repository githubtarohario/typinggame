import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getRawSql } from "@/lib/db";

const schema = z.object({
  query: z.string().min(1, "SQLを入力してください"),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力が不正です" },
      { status: 400 },
    );
  }

  const sql = getRawSql();

  try {
    const result = await sql.query(parsed.data.query);
    const rows = Array.isArray(result) ? result : [];
    return NextResponse.json({
      ok: true,
      rowCount: rows.length,
      columns: rows.length > 0 ? Object.keys(rows[0]) : [],
      rows,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "SQLの実行に失敗しました" },
      { status: 400 },
    );
  }
}
