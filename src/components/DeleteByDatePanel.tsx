"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DeleteByDatePanel() {
  const router = useRouter();
  const [date, setDate] = useState(todayDateString());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const countRes = await fetch(
        `/api/admin/scores/by-date?date=${encodeURIComponent(date)}`,
      );
      const countData = await countRes.json();
      if (!countRes.ok) {
        setError(countData.error ?? "件数の取得に失敗しました");
        return;
      }

      const targetCount = countData.count as number;
      if (targetCount === 0) {
        setMessage(`${date} の記録は0件でした。削除対象はありません。`);
        return;
      }

      const confirmed = window.confirm(
        `${date} の記録を ${targetCount} 件削除します。この操作は元に戻せません。よろしいですか?`,
      );
      if (!confirmed) return;

      const deleteRes = await fetch("/api/admin/scores/by-date", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const deleteData = await deleteRes.json();
      if (!deleteRes.ok) {
        setError(deleteData.error ?? "削除に失敗しました");
        return;
      }

      setMessage(`${date} の記録を ${deleteData.deletedCount} 件削除しました。`);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-500">
        指定した日付のプレイ記録(scores)を全ユーザー分まとめて削除します。元に戻せないため、実行前に件数を確認してください。
      </p>
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={todayDateString()}
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
        >
          {loading ? "処理中..." : "この日のデータを削除"}
        </button>
      </div>
      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
