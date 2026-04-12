# My Quiz

設計書（`docs/architecture.md`）に基づき、以下の MVP を実装した Next.js アプリです。

- 作問（クイズ作成）
- 問題表示（公開クイズ表示）
- 正誤判定（回答送信とスコア保存）
- ログイン（Auth.js / Credentials）
- 新規登録（Credentials アカウント作成）
- マイクイズ一覧（自分が作成したクイズ表示）

## 技術スタック

- Next.js（App Router / TypeScript）
- Auth.js（next-auth）
- Cloudflare Workers（Edge Runtime 想定）
- Cloudflare D1（SQLite）

## 認証（Auth.js）

- 認証方式は Credentials です。
- デフォルトのログイン情報は以下です。
  - ユーザー名: `demo`
  - パスワード: `demo-pass`
- 新規登録（`/register`）で作成したアカウントでもログインできます。
- 作問画面（`/create`）とマイクイズ一覧画面（`/my-quizzes/list`）、作問 API（`POST /api/quizzes`）はログイン必須です。

現行実装では新規登録ユーザーはアプリ実行中のメモリに保存されます。再起動後も保持したい場合は永続ストア導入が必要です。

必要に応じて以下の環境変数で認証情報を上書きできます。

```bash
AUTH_SECRET=十分に長いランダム文字列
NEXTAUTH_SECRET=AUTH_SECRET と同じ値（Auth.js v4 互換）
AUTH_TRUST_HOST=true
AUTH_DEMO_USERNAME=demo
AUTH_DEMO_PASSWORD=demo-pass
AUTH_DEMO_USER_ID=demo-user
```

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

1. 開発サーバー起動（Next.js）

```bash
npm run dev
```

1. Cloudflare Workers 互換で起動する場合

```bash
# OpenNext ビルド
npm run build:cf

# Wrangler 起動
npm run dev:cf
```

または build + dev をまとめて実行:

```bash
npm run dev:cf:build
```

## API

- `GET/POST /api/auth/*`
  - Auth.js の認証エンドポイント
- `POST /api/register`
  - 新規アカウント登録
- `POST /api/quizzes`
  - ログインユーザーとしてクイズ作成（作成直後に公開済みとして version 1 を保存）
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
- Cloudflare 向けビルドは `npm run build:cf`、ローカル実行は `npm run dev:cf` で実行できます。
