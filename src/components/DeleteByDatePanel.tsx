"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type DateSummary = {
  date: string;
  playCount: number;
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DeleteByDatePanel({
  dateSummaries,
}: {
  dateSummaries: DateSummary[];
}) {
  const router = useRouter();
  const [date, setDate] = useState(todayDateString());
  const [loadingDate, setLoadingDate] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deleteDate(targetDate: string) {
    setError(null);
    setMessage(null);
    setLoadingDate(targetDate);
    try {
      const countRes = await fetch(
        `/api/admin/scores/by-date?date=${encodeURIComponent(targetDate)}`,
      );
      const countData = await countRes.json();
      if (!countRes.ok) {
        setError(countData.error ?? "件数の取得に失敗しました");
        return;
      }

      const targetCount = countData.count as number;
      if (targetCount === 0) {
        setMessage(`${targetDate} の記録は0件でした。削除対象はありません。`);
        return;
      }

      const confirmed = window.confirm(
        `${targetDate} の記録を ${targetCount} 件削除します。この操作は元に戻せません。よろしいですか?`,
      );
      if (!confirmed) return;

      const deleteRes = await fetch("/api/admin/scores/by-date", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: targetDate }),
      });
      const deleteData = await deleteRes.json();
      if (!deleteRes.ok) {
        setError(deleteData.error ?? "削除に失敗しました");
        return;
      }

      setMessage(
        `${targetDate} の記録を ${deleteData.deletedCount} 件削除しました。`,
      );
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoadingDate(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-slate-500">
        記録が存在する日付の一覧です。日付ごとに全ユーザー分のプレイ記録(scores)をまとめて削除できます。元に戻せないため、件数をよく確認してから削除してください。
      </p>

      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <th className="px-4 py-2 font-medium">No.</th>
              <th className="px-4 py-2 font-medium">日付</th>
              <th className="px-4 py-2 font-medium">件数</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {dateSummaries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  記録がある日付はまだありません
                </td>
              </tr>
            )}
            {dateSummaries.map((d, i) => (
              <tr key={d.date} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                <td className="px-4 py-2">{d.date}</td>
                <td className="px-4 py-2">{d.playCount}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => deleteDate(d.date)}
                    disabled={loadingDate === d.date}
                    className="rounded border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {loadingDate === d.date ? "削除中..." : "削除"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <p className="mb-2 text-xs text-slate-500">
          一覧にない日付も指定して確認・削除できます(件数0件かどうかもここで確認できます)。
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
            onClick={() => deleteDate(date)}
            disabled={loadingDate === date}
            className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {loadingDate === date ? "処理中..." : "この日のデータを確認・削除"}
          </button>
        </div>
      </div>

      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
