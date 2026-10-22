"use client";

import { useState } from "react";

const DANGEROUS_KEYWORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "TRUNCATE",
  "ALTER",
  "GRANT",
  "REVOKE",
];

type QueryResult = {
  rowCount: number;
  columns: string[];
  rows: Record<string, unknown>[];
};

function isDangerous(query: string): boolean {
  const upper = query.toUpperCase();
  return DANGEROUS_KEYWORDS.some((kw) => upper.includes(kw));
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function AdminSqlPage() {
  const [query, setQuery] = useState("SELECT * FROM users ORDER BY id LIMIT 20;");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExecute() {
    setError(null);
    setResult(null);

    if (isDangerous(query)) {
      const confirmed = window.confirm(
        "このSQLはデータを変更・削除する可能性があります(INSERT/UPDATE/DELETE/DROP等)。\n" +
          "元に戻せない操作です。本当に実行しますか?",
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "実行に失敗しました");
        return;
      }
      setResult(data);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-800">SQL実行ツール</h1>
      <p className="mb-6 text-sm text-slate-500">
        本番データベースに対して直接SQLを実行します。INSERT/UPDATE/DELETE/DROP等は実行前に確認が入りますが、誤操作でデータが壊れる可能性があるため十分注意してください。
      </p>

      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={8}
          spellCheck={false}
          className="w-full rounded border border-slate-300 bg-slate-50 p-3 font-mono text-sm focus:border-slate-500 focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            セミコロンで終わる1つの文のみ実行できます(複数文の一括実行は不可)
          </p>
          <button
            onClick={handleExecute}
            disabled={loading}
            className="rounded bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "実行中..." : "実行"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <p className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
            結果: {result.rowCount}行
          </p>
          {result.rowCount > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-4 py-2 font-medium">No.</th>
                    {result.columns.map((col) => (
                      <th key={col} className="whitespace-nowrap px-4 py-2 font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                      {result.columns.map((col) => (
                        <td key={col} className="whitespace-nowrap px-4 py-2">
                          {formatCell(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              結果はありません(更新・削除系クエリが正常に完了した場合も含む)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
