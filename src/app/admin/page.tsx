import { eq, sql, desc, avg, count, gte, max } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, scores } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { DIFFICULTY_LABELS, Difficulty } from "@/data/typing-words";
import AdminTrendChart from "@/components/AdminTrendChart";
import DeleteByDatePanel from "@/components/DeleteByDatePanel";
import DeleteUserButton from "@/components/DeleteUserButton";

function toNumber(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
}

const RECENT_PAGE_SIZE = 20;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { page } = await searchParams;
  const session = await getSession();
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
      lastPlayedAt: max(scores.playedAt),
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

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const todayByUserRaw = await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      username: users.username,
      playCount: count(scores.id),
    })
    .from(users)
    .innerJoin(scores, eq(scores.userId, users.id))
    .where(gte(scores.playedAt, startOfToday))
    .groupBy(users.id)
    .orderBy(desc(count(scores.id)));

  const totalPages = Math.max(Math.ceil(summary.totalPlays / RECENT_PAGE_SIZE), 1);
  const requestedPage = parseInt(typeof page === "string" ? page : "1", 10);
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1;
  const pageOffset = (currentPage - 1) * RECENT_PAGE_SIZE;

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
    .orderBy(desc(scores.playedAt), desc(scores.id))
    .limit(RECENT_PAGE_SIZE)
    .offset(pageOffset);

  const chartData = dailyTrendRaw.map((d) => ({
    date: d.date,
    accuracy: toNumber(d.avgAccuracy),
    playCount: d.playCount,
  }));

  const dateSummaries = [...dailyTrendRaw]
    .map((d) => ({ date: d.date, playCount: d.playCount }))
    .reverse();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">管理者ダッシュボード</h1>
          <p className="text-sm text-slate-500">全ユーザーのスコアデータ分析</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/sql"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            SQL実行ツール
          </a>
          <a
            href="/api/admin/scores/export"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            CSVエクスポート
          </a>
        </div>
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
          本日のユーザー別実行回数
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-2 font-medium">No.</th>
              <th className="px-4 py-2 font-medium">名前</th>
              <th className="px-4 py-2 font-medium">ユーザID</th>
              <th className="px-4 py-2 font-medium">本日の実行回数</th>
            </tr>
          </thead>
          <tbody>
            {todayByUserRaw.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  本日の記録はまだありません
                </td>
              </tr>
            )}
            {todayByUserRaw.map((u, i) => (
              <tr key={u.userId} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                <td className="px-4 py-2">{u.displayName}</td>
                <td className="px-4 py-2 text-slate-500">{u.username}</td>
                <td className="px-4 py-2 font-semibold">{u.playCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-600">
          日別データ削除
        </h2>
        <DeleteByDatePanel dateSummaries={dateSummaries} />
      </section>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
          難易度別 集計
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-2 font-medium">No.</th>
              <th className="px-4 py-2 font-medium">難易度</th>
              <th className="px-4 py-2 font-medium">プレイ回数</th>
              <th className="px-4 py-2 font-medium">平均正解率</th>
              <th className="px-4 py-2 font-medium">平均WPM</th>
            </tr>
          </thead>
          <tbody>
            {byDifficultyRaw.map((d, i) => (
              <tr key={d.difficulty} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 text-slate-400">{i + 1}</td>
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
              <th className="px-4 py-2 font-medium">No.</th>
              <th className="px-4 py-2 font-medium">名前</th>
              <th className="px-4 py-2 font-medium">ユーザID</th>
              <th className="px-4 py-2 font-medium">プレイ回数</th>
              <th className="px-4 py-2 font-medium">平均正解率</th>
              <th className="px-4 py-2 font-medium">平均WPM</th>
              <th className="px-4 py-2 font-medium">終了時間</th>
              <th className="px-4 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {byUserRaw.map((u, i) => (
              <tr key={u.userId} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                <td className="px-4 py-2">{u.displayName}</td>
                <td className="px-4 py-2 text-slate-500">{u.username}</td>
                <td className="px-4 py-2">{u.playCount}</td>
                <td className="px-4 py-2">{u.playCount > 0 ? `${toNumber(u.avgAccuracy)}%` : "-"}</td>
                <td className="px-4 py-2">{u.playCount > 0 ? toNumber(u.avgWpm) : "-"}</td>
                <td className="px-4 py-2 text-slate-500">
                  {u.lastPlayedAt
                    ? new Date(u.lastPlayedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
                    : "-"}
                </td>
                <td className="px-4 py-2">
                  <DeleteUserButton
                    userId={u.userId}
                    displayName={u.displayName}
                    isSelf={u.userId === session?.userId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section id="recent" className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
          直近の記録(全{summary.totalPlays}件)
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-2 font-medium">No.</th>
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
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  まだ記録がありません
                </td>
              </tr>
            )}
            {recentRows.map((r, i) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 text-slate-400">{pageOffset + i + 1}</td>
                <td className="px-4 py-2">{new Date(r.playedAt).toLocaleString("ja-JP")}</td>
                <td className="px-4 py-2">{r.displayName}</td>
                <td className="px-4 py-2">{DIFFICULTY_LABELS[r.difficulty as Difficulty]}</td>
                <td className="px-4 py-2">{r.accuracy}%</td>
                <td className="px-4 py-2">{r.wpm}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        )}
      </section>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  // 現在ページの前後2ページと先頭・末尾を表示し、間は「…」で省略する
  const pages: (number | "gap")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "gap") {
      pages.push("gap");
    }
  }

  const linkClass =
    "rounded border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-100";
  const disabledClass =
    "rounded border border-slate-200 px-3 py-1 text-slate-300";

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1 border-t border-slate-200 px-4 py-3 text-sm">
      {currentPage > 1 ? (
        <a href={`?page=${currentPage - 1}#recent`} className={linkClass}>
          前へ
        </a>
      ) : (
        <span className={disabledClass}>前へ</span>
      )}
      {pages.map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-2 text-slate-400">
            …
          </span>
        ) : p === currentPage ? (
          <span
            key={p}
            className="rounded bg-slate-800 px-3 py-1 font-semibold text-white"
          >
            {p}
          </span>
        ) : (
          <a key={p} href={`?page=${p}#recent`} className={linkClass}>
            {p}
          </a>
        ),
      )}
      {currentPage < totalPages ? (
        <a href={`?page=${currentPage + 1}#recent`} className={linkClass}>
          次へ
        </a>
      ) : (
        <span className={disabledClass}>次へ</span>
      )}
      <span className="ml-2 text-xs text-slate-400">
        {currentPage} / {totalPages} ページ
      </span>
    </nav>
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
