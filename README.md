# My Quiz

設計書（`docs/architecture.md`）に基づき、以下の MVP を実装した Next.js アプリです。

- 作問（クイズ作成）
- 問題表示（公開クイズ表示）
- 正誤判定（回答送信とスコア保存）

## 技術スタック

- Next.js（App Router / TypeScript）
- Cloudflare Workers（Edge Runtime 想定）
- Cloudflare D1（SQLite）

## セットアップ

1. 依存関係をインストール

```bash
npm install -D wrangler@latest
```

2. D1 データベースを作成（未作成の場合）

```bash
npx wrangler d1 create my-quiz-db
```

3. `wrangler.jsonc` の `database_id` を実値に更新
   "d1_databases": [
   {
   "binding": "DB",
   "database_name": "my-quiz-db",
   "database_id": "実際のデータベースID",
   },
   ]
1. マイグレーション適用

```bash
npx wrangler d1 execute my-quiz-db --file=./db/migrations/0001_init.sql --local
```

1. 開発サーバー起動

```bash
npm run dev
```

## API

- `POST /api/quizzes`
  - クイズ作成（作成直後に公開済みとして version 1 を保存）
- `GET /api/quizzes/:quizId`
  - 公開中クイズ取得（正解情報は返さない）
- `POST /api/quizzes/:quizId/attempts`
  - 回答を受け取り、正誤判定と結果保存を実行

## テスト

```bash
npm run test
```

## 補足

- D1 バインディング名は `DB` 固定です。
- OpenNext で Cloudflare にデプロイする場合は、プロジェクトに合わせて build/deploy スクリプトを追加してください。
