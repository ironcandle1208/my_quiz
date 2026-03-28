# フォルダ構成

更新日: 2026-03-28

`node_modules` / `.next` / `.git` は除外しています。

```text
my_quiz/
├── .gitignore
├── AGENTS.md
├── README.md
├── app
│   ├── api
│   │   └── quizzes
│   │       ├── [quizId]
│   │       └── route.ts
│   ├── create
│   │   ├── create-quiz-form.tsx
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   ├── page.tsx
│   └── quiz
│       └── [quizId]
│           ├── page.tsx
│           └── quiz-player.tsx
├── db
│   └── migrations
│       └── 0001_init.sql
├── docs
│   ├── architecture.md
│   └── structure.md
├── lib
│   ├── d1.ts
│   ├── domain.ts
│   ├── id.ts
│   ├── quiz-core.ts
│   └── quiz-repository.ts
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── test
│   ├── api-routes.test.ts
│   ├── create-quiz-form.test.tsx
│   ├── d1.test.ts
│   ├── id.test.ts
│   ├── quiz-core.test.ts
│   └── quiz-repository.test.ts
├── tsconfig.json
├── types
│   └── cloudflare.d.ts
├── vitest.config.ts
└── wrangler.jsonc
```

## 各フォルダ・ファイルの説明

| パス | 説明 |
| --- | --- |
| `my_quiz/` | プロジェクトルート。アプリ本体と設定、ドキュメントを管理する。 |
| `.gitignore` | Git 管理対象から除外するファイル・ディレクトリ定義。 |
| `AGENTS.md` | エージェント実行時の作業ルールや指示をまとめたファイル。 |
| `README.md` | セットアップ手順、実行方法、API概要を記載した案内。 |
| `app/` | Next.js App Router の画面・API 実装を配置する。 |
| `app/api/` | API ルート群の配置ディレクトリ。 |
| `app/api/quizzes/` | クイズ関連 API のルートをまとめる。 |
| `app/api/quizzes/route.ts` | クイズ作成 API（`POST /api/quizzes`）を実装。 |
| `app/api/quizzes/[quizId]/` | クイズID単位の API ルートを配置。 |
| `app/create/` | 作問ページ関連の UI を配置。 |
| `app/create/create-quiz-form.tsx` | 作問フォーム本体（設問/選択肢入力、送信処理）。 |
| `app/create/page.tsx` | 作問画面のページエントリ。 |
| `app/globals.css` | アプリ全体の共通スタイル定義。 |
| `app/layout.tsx` | 全ページ共通レイアウト。 |
| `app/not-found.tsx` | 404 ページ表示。 |
| `app/page.tsx` | トップページ。 |
| `app/quiz/` | クイズ回答画面関連を配置。 |
| `app/quiz/[quizId]/` | クイズID単位の回答ページ実装。 |
| `app/quiz/[quizId]/page.tsx` | クイズ表示ページ（問題取得と描画）。 |
| `app/quiz/[quizId]/quiz-player.tsx` | 回答 UI と正誤判定結果表示のクライアントコンポーネント。 |
| `db/` | データベース関連ファイルを配置。 |
| `db/migrations/` | D1 向けマイグレーション SQL を配置。 |
| `db/migrations/0001_init.sql` | 初期テーブル作成 SQL（クイズ、問題、回答など）。 |
| `docs/` | 設計書や構成説明などドキュメントを管理。 |
| `docs/architecture.md` | アーキテクチャ方針、認証方針、DB設計を記載。 |
| `docs/structure.md` | フォルダ構成と各要素説明を記載。 |
| `lib/` | 共通ロジックやリポジトリ層を配置。 |
| `lib/d1.ts` | D1 バインディングを解決する共通関数。 |
| `lib/domain.ts` | ドメイン型定義（作問入力、公開クイズ、回答結果など）。 |
| `lib/id.ts` | UUID 生成ユーティリティ。 |
| `lib/quiz-core.ts` | 作問バリデーション、判定計算など共通ロジック。 |
| `lib/quiz-repository.ts` | D1 への永続化・取得処理（作問、取得、判定保存）。 |
| `next-env.d.ts` | Next.js が生成する型定義参照ファイル。 |
| `next.config.ts` | Next.js の基本設定。 |
| `package-lock.json` | npm 依存関係のロックファイル。 |
| `package.json` | npm スクリプトと依存関係定義。 |
| `test/` | 共通関数向けの単体テスト群。 |
| `test/api-routes.test.ts` | API ルート（作問・取得・回答送信）の単体テスト。 |
| `test/create-quiz-form.test.tsx` | 作問フォームの操作・送信処理に関する単体テスト。 |
| `test/d1.test.ts` | `lib/d1.ts` の単体テスト。 |
| `test/id.test.ts` | `lib/id.ts` の単体テスト。 |
| `test/quiz-core.test.ts` | `lib/quiz-core.ts` の単体テスト。 |
| `test/quiz-repository.test.ts` | `lib/quiz-repository.ts` の単体テスト。 |
| `tsconfig.json` | TypeScript コンパイル設定。 |
| `types/` | グローバル型宣言を配置。 |
| `types/cloudflare.d.ts` | D1 など Cloudflare 型の簡易宣言。 |
| `vitest.config.ts` | Vitest 実行設定（対象、エイリアスなど）。 |
| `wrangler.jsonc` | Cloudflare Workers / D1 のデプロイ設定。 |
