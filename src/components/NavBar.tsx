"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionPayload } from "@/lib/auth";

export default function NavBar({ session }: { session: SessionPayload | null }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!session) {
    return null;
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-bold text-slate-800">タイピングゲーム</span>
          <nav className="flex gap-4 text-sm">
            <Link href="/training" className="text-slate-600 hover:text-slate-900">
              トレーニング
            </Link>
            <Link href="/records" className="text-slate-600 hover:text-slate-900">
              レコード
            </Link>
            <Link href="/settings" className="text-slate-600 hover:text-slate-900">
              設定
            </Link>
            {session.role === "admin" && (
              <Link href="/admin" className="text-slate-600 hover:text-slate-900">
                管理者ダッシュボード
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">{session.displayName} さん</span>
          <button
            onClick={handleLogout}
            className="rounded border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-100"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
