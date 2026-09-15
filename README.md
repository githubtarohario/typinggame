# タイピングゲーム

JavaScriptキーワード/コードのタイピング練習ゲーム。CLAUDE.md の仕様に基づく。

- ユーザID/パスワード認証(登録・ログイン・パスワード変更)
- トレーニング画面: 難易度3段階、キーボード表示、タイマー
- レコード画面: 正解率・日付・名前の一覧表示、正解率推移グラフ
- 管理者ダッシュボード(`/admin`): 最初の登録ユーザーが自動でadminになり、全ユーザーのscoreを横断分析・CSVエクスポートできる
- DB: Neon Postgres(Vercel Marketplace統合。当初はSQLite互換のTursoを想定していたが、規約同意の反映がうまくいかず、CLIから安定して導入できたNeonに変更)

## 技術スタック

- TypeScript / Next.js (App Router)
- Tailwind CSS
- Drizzle ORM + Neon Postgres(@neondatabase/serverless, drizzle-orm/neon-http)
- 認証: bcryptjs(パスワードハッシュ) + jose(JWTセッションCookie)
- グラフ: recharts

## セットアップ

```bash
npm install
vercel env pull .env.local --environment=development   # NeonのDATABASE_URLを取得
npm run db:push   # NeonにスキーマをPush
npm run dev
```

`.env.local` には以下が必要です:

```
DATABASE_URL=<Neonの接続文字列(vercel env pullで自動取得)>
AUTH_SECRET=<ランダムな秘密鍵>
```

## タイピングデータの変更

`src/data/typing-words.ts` を編集すると、難易度ごとの出題内容・制限時間を変更できます。

## 本番デプロイ済み

- Production: https://typinggame-lemon.vercel.app
- Vercelプロジェクト: `githubtaro-4269s-projects/typinggame`
- DB: Neon Postgres(リソース名 `neon-cobalt-canvas`、Production/Preview/Development全環境に接続済み)

再デプロイする場合:

```bash
npm run build   # ローカルで確認
vercel --prod
```

スキーマを変更した場合は先に本番DBへ反映してください:

```bash
npm run db:push
```
