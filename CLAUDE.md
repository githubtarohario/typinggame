---
name:typeinggame
description:以下の仕様に従いタイピングゲームプログラムを作る
---

# 概要
- タイピングソフトの仕様を作る


# 技術スタック
- typescript
- vercel
- sqlite3 → 実装ではNeon Postgres採用(Vercelのサーバーレス環境で永続化するため。当初SQLite互換のTursoを検討したが、Vercel Marketplaceの規約同意フローがCLIから安定して進められず、Neonに変更した)
- html,css



# パスワード画面
- ユーザID、パスワードを入力すして認証されるとトレーニング画面へ行く
- パスワードは後で変更できるようにする

# トレーニング画面
- 難易度は3段階
- キーボード表示する
- javascriptのキーワードをタイピングする
- タイピングデータは後で変えれるようにしてプログラムに埋め込む

# レコード画面
- 正解率、日付、名前を表示する
- グラフ機能（縦軸　日付　横軸　正解率)


# データベース機能 
- ユーザIDで日々の得点を管理する
- 自分でデータを見ることができる

# 完成後
- Vercelにアップできるようにする

# 管理者ダッシュボード(追加仕様)
- 最初に登録したユーザーが自動的に管理者(admin)になる
- 管理者は /admin で全ユーザーのscoreデータを横断分析できる
  - 全体サマリ(ユーザー数、総プレイ回数、全体平均正解率、平均WPM)
  - 難易度別の集計(プレイ回数、平均正解率、平均WPM)
  - ユーザー別ランキング(平均正解率順)
  - 日別の正解率推移グラフ(全ユーザー平均)
  - 直近の記録一覧、CSVエクスポート(/api/admin/scores/export)
- 管理者以外は /admin, /api/admin/* にアクセスするとリダイレクト/403になる




<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
