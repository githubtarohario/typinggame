/**
 * X2.csv からユーザーを一括登録/更新するスクリプト
 *
 * CSV形式(ヘッダなし): 名前,ユーザID,パスワード
 *   1カラム目 = 表示名、2カラム目 = ユーザID、3カラム目 = パスワード
 *
 * - 管理者アカウント(ユーザID 0000 / パスワード 0000)を作成・更新し、他の admin は user に降格する
 * - CSVのユーザIDが既に存在 → 表示名とパスワードを更新
 * - 存在しないが同じ表示名の既存ユーザーがいる → そのユーザーのIDを付け替え(スコア履歴を保持)
 * - どちらもない → 新規作成
 * - CSVに無い既存ユーザーは変更しない(削除しない)
 *
 * 実行: npm run users:import  (別ファイル指定: npm run users:import -- path/to.csv)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "../src/lib/db";
import { users } from "../src/lib/db/schema";

const ADMIN_USERNAME = "0000";
const ADMIN_PASSWORD = "0000";
const ADMIN_DISPLAY_NAME = "管理者";

type Row = { displayName: string; username: string; password: string };

function parseCsv(path: string): Row[] {
  const text = readFileSync(path, "utf8").replace(/^﻿/, "");
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, i) => {
      const cols = line.split(",").map((c) => c.trim());
      const [displayName, username, password] = cols;
      if (!displayName || !username || !password) {
        throw new Error(`${i + 1}行目の形式が不正です: ${line}`);
      }
      return { displayName, username, password };
    });
}

async function main() {
  const csvPath = resolve(process.argv[2] ?? "X2.csv");
  const rows = parseCsv(csvPath);
  const db = getDb();

  // CSV内の重複チェック
  const ids = rows.map((r) => r.username);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) throw new Error(`CSV内でユーザIDが重複しています: ${dup.join(", ")}`);
  if (ids.includes(ADMIN_USERNAME)) {
    throw new Error(`CSVに管理者用ID(${ADMIN_USERNAME})が含まれています`);
  }

  // 管理者
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const [admin] = await db
    .select()
    .from(users)
    .where(eq(users.username, ADMIN_USERNAME))
    .limit(1);
  if (admin) {
    await db
      .update(users)
      .set({ passwordHash: adminHash, role: "admin" })
      .where(eq(users.id, admin.id));
    console.log(`管理者 ${ADMIN_USERNAME} を更新`);
  } else {
    await db.insert(users).values({
      username: ADMIN_USERNAME,
      displayName: ADMIN_DISPLAY_NAME,
      passwordHash: adminHash,
      role: "admin",
    });
    console.log(`管理者 ${ADMIN_USERNAME} を作成`);
  }
  const demoted = await db
    .update(users)
    .set({ role: "user" })
    .where(and(eq(users.role, "admin"), ne(users.username, ADMIN_USERNAME)))
    .returning({ username: users.username });
  for (const d of demoted) console.log(`  ${d.username} を admin → user に変更`);

  // 一般ユーザー
  let created = 0;
  let updated = 0;
  let renamed = 0;
  for (const row of rows) {
    const passwordHash = await bcrypt.hash(row.password, 10);
    const [byId] = await db
      .select()
      .from(users)
      .where(eq(users.username, row.username))
      .limit(1);
    if (byId) {
      await db
        .update(users)
        .set({ displayName: row.displayName, passwordHash })
        .where(eq(users.id, byId.id));
      updated++;
      continue;
    }

    const sameName = await db
      .select()
      .from(users)
      .where(eq(users.displayName, row.displayName));
    const candidates = sameName.filter(
      (u) => !ids.includes(u.username) && u.username !== ADMIN_USERNAME,
    );
    if (candidates.length === 1) {
      const old = candidates[0];
      await db
        .update(users)
        .set({ username: row.username, passwordHash })
        .where(eq(users.id, old.id));
      console.log(`  ${old.username} → ${row.username} (${row.displayName})`);
      renamed++;
      continue;
    }

    await db.insert(users).values({
      username: row.username,
      displayName: row.displayName,
      passwordHash,
      role: "user",
    });
    created++;
  }

  console.log(
    `完了: CSV ${rows.length}件 (新規 ${created} / 更新 ${updated} / ID付け替え ${renamed})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
