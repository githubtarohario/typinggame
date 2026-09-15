import { eq, sql, desc, avg, count } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, scores } from "@/lib/db/schema";
import { DIFFICULTY_LABELS, Difficulty } from "@/data/typing-words";
import AdminTrendChart from "@/components/AdminTrendChart";

function toNumber(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
}

export default async function AdminPage() {
  const db = getDb();

  const [summary] = await db
    .select({
      totalPlays: count(),
      avgAccuracy: avg(scores.accuracy),
      avgWpm: avg(scores.wpm),
    })
    .from(scores);

  const [{ value: userCount }] = await db
    .select({ value: count() })
    .from(users);

  const byDifficultyRaw = await db
    .select({
      difficulty: scores.difficulty,
      playCount: count(),
      avgAccuracy: avg(scores.accuracy),
      avgWpm: avg(scores.wpm),
    })
    .from(scores)
    .groupBy(scores.difficulty);

  const byUserRaw = await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      username: users.username,
      playCount: count(scores.id),
      avgAccuracy: avg(scores.accuracy),
      avgWpm: avg(scores.wpm),
    })
    .from(users)
    .leftJoin(scores, eq(scores.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(avg(scores.accuracy)));

  const dailyTrendRaw = await db
    .select({
      date: sql<string>`date(${scores.playedAt})`,
      avgAccuracy: avg(scores.accuracy),
      playCount: count(),
    })
    .from(scores)
    .groupBy(sql`date(${scores.playedAt})`)
    .orderBy(sql`date(${scores.playedAt})`);

  const recentRows = await db
    .select({
      id: scores.id,
      username: users.username,
      displayName: users.displayName,
      difficulty: scores.difficulty,
      accuracy: scores.accuracy,
      wpm: scores.wpm,
      playedAt: scores.playedAt,
    })
    .from(scores)
    .innerJoin(users, eq(scores.userId, users.id))
    .orderBy(desc(scores.playedAt))
    .limit(100);

  const chartData = dailyTrendRaw.map((d) => ({
    date: d.date,
    accuracy: toNumber(d.avgAccuracy),
    playCount: d.playCount,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">管理者ダッシュボード</h1>
          <p className="text-sm text-slate-500">全ユーザーのスコアデータ分析</p>
        </div>
        <a
          href="/api/admin/scores/export"
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          CSVエクスポート
        </a>
      </div>

      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="ユーザー数" value={`${userCount}`} />
        <StatCard label="総プレイ回数" value={`${summary.totalPlays}`} />
        <StatCard label="全体平均正解率" value={`${toNumber(summary.avgAccuracy)}%`} />
        <StatCard label="全体平均WPM" value={`${toNumber(summary.avgWpm)}`} />
      </section>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-600">
          日別 正解率推移(全ユーザー平均)
        </h2>
        <AdminTrendChart data={chartData} />
      </section>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
          難易度別 集計
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-2 font-medium">難易度</th>
              <th className="px-4 py-2 font-medium">プレイ回数</th>
              <th className="px-4 py-2 font-medium">平均正解率</th>
              <th className="px-4 py-2 font-medium">平均WPM</th>
            </tr>
          </thead>
          <tbody>
            {byDifficultyRaw.map((d) => (
              <tr key={d.difficulty} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">{DIFFICULTY_LABELS[d.difficulty as Difficulty]}</td>
                <td className="px-4 py-2">{d.playCount}</td>
                <td className="px-4 py-2">{toNumber(d.avgAccuracy)}%</td>
                <td className="px-4 py-2">{toNumber(d.avgWpm)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
          ユーザー別ランキング(平均正解率順)
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-2 font-medium">名前</th>
              <th className="px-4 py-2 font-medium">ユーザID</th>
              <th className="px-4 py-2 font-medium">プレイ回数</th>
              <th className="px-4 py-2 font-medium">平均正解率</th>
              <th className="px-4 py-2 font-medium">平均WPM</th>
            </tr>
          </thead>
          <tbody>
            {byUserRaw.map((u) => (
              <tr key={u.userId} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">{u.displayName}</td>
                <td className="px-4 py-2 text-slate-500">{u.username}</td>
                <td className="px-4 py-2">{u.playCount}</td>
                <td className="px-4 py-2">{u.playCount > 0 ? `${toNumber(u.avgAccuracy)}%` : "-"}</td>
                <td className="px-4 py-2">{u.playCount > 0 ? toNumber(u.avgWpm) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
          直近の記録(最新100件)
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-2 font-medium">日時</th>
              <th className="px-4 py-2 font-medium">名前</th>
              <th className="px-4 py-2 font-medium">難易度</th>
              <th className="px-4 py-2 font-medium">正解率</th>
              <th className="px-4 py-2 font-medium">WPM</th>
            </tr>
          </thead>
          <tbody>
            {recentRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  まだ記録がありません
                </td>
              </tr>
            )}
            {recentRows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">{new Date(r.playedAt).toLocaleString("ja-JP")}</td>
                <td className="px-4 py-2">{r.displayName}</td>
                <td className="px-4 py-2">{DIFFICULTY_LABELS[r.difficulty as Difficulty]}</td>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
