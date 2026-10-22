import { eq, asc, gte, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, scores } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { DIFFICULTY_LABELS } from "@/data/typing-words";
import ScoreChart from "@/components/ScoreChart";

export default async function RecordsPage() {
  const session = await getSession();
  if (!session) return null;

  const db = getDb();
  const rows = await db
    .select()
    .from(scores)
    .where(eq(scores.userId, session.userId))
    .orderBy(asc(scores.playedAt));

  const chartData = rows.map((r) => ({
    date: new Date(r.playedAt).toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
    }),
    accuracy: r.accuracy,
  }));

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const dailyTop = await db
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

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-800">レコード</h1>
      <p className="mb-6 text-sm text-slate-500">{session.displayName} さんの記録</p>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-600">
          正解率の推移
        </h2>
        <ScoreChart data={chartData} />
      </section>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
          本日のベスト20(全ユーザー)
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-2 font-medium">順位</th>
              <th className="px-4 py-2 font-medium">名前</th>
              <th className="px-4 py-2 font-medium">難易度</th>
              <th className="px-4 py-2 font-medium">正解率</th>
              <th className="px-4 py-2 font-medium">WPM</th>
            </tr>
          </thead>
          <tbody>
            {dailyTop.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  本日の記録はまだありません
                </td>
              </tr>
            )}
            {dailyTop.map((r, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 font-semibold text-slate-500">
                  {i + 1}
                </td>
                <td className="px-4 py-2">
                  {r.displayName === session.displayName ? (
                    <span className="font-semibold text-emerald-600">
                      {r.displayName}(あなた)
                    </span>
                  ) : (
                    r.displayName
                  )}
                </td>
                <td className="px-4 py-2">{DIFFICULTY_LABELS[r.difficulty]}</td>
                <td className="px-4 py-2">{r.accuracy}%</td>
                <td className="px-4 py-2">{r.wpm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-2 font-medium">No.</th>
              <th className="px-4 py-2 font-medium">日付</th>
              <th className="px-4 py-2 font-medium">名前</th>
              <th className="px-4 py-2 font-medium">難易度</th>
              <th className="px-4 py-2 font-medium">正解率</th>
              <th className="px-4 py-2 font-medium">WPM</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  まだ記録がありません
                </td>
              </tr>
            )}
            {[...rows].reverse().map((r, i) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                <td className="px-4 py-2">
                  {new Date(r.playedAt).toLocaleString("ja-JP")}
                </td>
                <td className="px-4 py-2">{session.displayName}</td>
                <td className="px-4 py-2">{DIFFICULTY_LABELS[r.difficulty]}</td>
                <td className="px-4 py-2">{r.accuracy}%</td>
                <td className="px-4 py-2">{r.wpm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
