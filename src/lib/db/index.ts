import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createRawSql() {
  return neon(process.env.DATABASE_URL!);
}

let _rawSql: ReturnType<typeof createRawSql> | null = null;

// 管理者用SQL実行ツールなど、スキーマを介さず生のSQLを直接実行する場合に使う
export function getRawSql() {
  if (!_rawSql) _rawSql = createRawSql();
  return _rawSql;
}

function createDb() {
  return drizzle(getRawSql(), { schema });
}

let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) _db = createDb();
  return _db;
}
