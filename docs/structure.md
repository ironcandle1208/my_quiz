# フォルダ構成

更新日: 2026-04-02

`node_modules` / `.next` / `.open-next` / `.git` は除外しています。

```text
my_quiz/
├── .gitignore
├── AGENTS.md
├── Makefile
├── README.md
├── auth.ts
├── app
│   ├── api
│   │   ├── auth
│   │   │   └── [...nextauth]
│   │   └── quizzes
│   │       ├── [quizId]
│   │       └── route.ts
│   ├── create
│   │   ├── create-quiz-form.tsx
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── login
│   │   ├── login-form.tsx
│   │   └── page.tsx
│   ├── not-found.tsx
│   ├── logout-button.tsx
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
├── issues
│   ├── issue_report_0001.md
│   ├── issue_report_0002.md
│   ├── issue_report_0003.md
│   ├── issue_report_0004.md
│   └── issue_report_0005.md
├── lib
│   ├── d1.ts
│   ├── domain.ts
│   ├── id.ts
│   ├── quiz-core.ts
│   └── quiz-repository.ts
├── next-env.d.ts
├── next.config.ts
├── open-next.config.ts
├── package-lock.json
├── package.json
├── scripts
│   ├── apply_d1_migrations.sh
│   └── reset_d1_tables.sh
├── test
│   └── unit
│       ├── api-routes.test.ts
│       ├── auth.test.ts
│       ├── create-page-auth.test.tsx
│       ├── create-quiz-form.test.tsx
│       ├── d1.test.ts
│       ├── home-page-auth.test.tsx
│       ├── id.test.ts
│       ├── login-form.test.tsx
│       ├── login-page.test.tsx
│       ├── logout-button.test.tsx
│       ├── quiz-page.test.tsx
│       ├── quiz-player.test.tsx
│       ├── quiz-core.test.ts
│       └── quiz-repository.test.ts
├── tsconfig.json
├── types
│   ├── cloudflare.d.ts
│   └── next-auth.d.ts
├── vitest.config.ts
└── wrangler.jsonc
```

## 各フォルダ・ファイルの説明

| パス                                  | 説明                                                           |
| ------------------------------------- | -------------------------------------------------------------- |
| `my_quiz/`                            | プロジェクトルート。アプリ本体と設定、ドキュメントを管理する。 |
| `.gitignore`                          | Git 管理対象から除外するファイル・ディレクトリ定義。           |
| `AGENTS.md`                           | エージェント実行時の作業ルールや指示をまとめたファイル。       |
| `Makefile`                            | D1 初期化やマイグレーション適用を実行するためのタスク定義。     |
| `README.md`                           | セットアップ手順、実行方法、API概要を記載した案内。            |
| `auth.ts`                             | Auth.js（next-auth）の設定と `getAppSession` を提供。           |
| `app/`                                | Next.js App Router の画面・API 実装を配置する。                |
| `app/api/`                            | API ルート群の配置ディレクトリ。                               |
| `app/api/auth/`                       | Auth.js の API ルートを配置。                                  |
| `app/api/auth/[...nextauth]/route.ts` | Auth.js のハンドラを公開する API ルート。                      |
| `app/api/quizzes/`                    | クイズ関連 API のルートをまとめる。                            |
| `app/api/quizzes/route.ts`            | クイズ作成 API（`POST /api/quizzes`）を実装。                  |
| `app/api/quizzes/[quizId]/`           | クイズID単位の API ルートを配置。                              |
| `app/create/`                         | 作問ページ関連の UI を配置。                                   |
| `app/create/create-quiz-form.tsx`     | 作問フォーム本体（設問/選択肢入力、送信処理）。                |
| `app/create/page.tsx`                 | 作問画面のページエントリ。                                     |
| `app/globals.css`                     | アプリ全体の共通スタイル定義。                                 |
| `app/layout.tsx`                      | 全ページ共通レイアウト。                                       |
| `app/login/`                          | ログイン画面関連の UI を配置。                                 |
| `app/login/login-form.tsx`            | 認証情報入力とログイン送信を担当するフォーム。                 |
| `app/login/page.tsx`                  | ログイン画面のページエントリ。                                 |
| `app/not-found.tsx`                   | 404 ページ表示。                                               |
| `app/logout-button.tsx`               | クライアント側でログアウトを実行するボタン。                   |
| `app/page.tsx`                        | トップページ。                                                 |
| `app/quiz/`                           | クイズ回答画面関連を配置。                                     |
| `app/quiz/[quizId]/`                  | クイズID単位の回答ページ実装。                                 |
| `app/quiz/[quizId]/page.tsx`          | クイズ表示ページ（問題取得と描画）。                           |
| `app/quiz/[quizId]/quiz-player.tsx`   | 回答 UI と正誤判定結果表示のクライアントコンポーネント。       |
| `db/`                                 | データベース関連ファイルを配置。                               |
| `db/migrations/`                      | D1 向けマイグレーション SQL を配置。                           |
| `db/migrations/0001_init.sql`         | 初期テーブル作成 SQL（クイズ、問題、回答など）。               |
| `docs/`                               | 設計書や構成説明などドキュメントを管理。                       |
| `docs/architecture.md`                | アーキテクチャ方針、認証方針、DB設計を記載。                   |
| `docs/structure.md`                   | フォルダ構成と各要素説明を記載。                               |
| `issues/`                             | 障害/不具合修正時の障害記録票を管理。                          |
| `issues/issue_report_0001.md`         | Hydration 警告の障害記録票（ID: 0001）。                       |
| `issues/issue_report_0002.md`         | D1 バインディング不一致の障害記録票（ID: 0002）。              |
| `issues/issue_report_0003.md`         | ASSETS バインディング不足の障害記録票（ID: 0003）。            |
| `issues/issue_report_0004.md`         | Worker エントリ未生成の障害記録票（ID: 0004）。                |
| `issues/issue_report_0005.md`         | API 500（Cloudflare Context参照不備）の障害記録票（ID: 0005）。|
| `lib/`                                | 共通ロジックやリポジトリ層を配置。                             |
| `lib/d1.ts`                           | D1 バインディングを解決する共通関数。                          |
| `lib/domain.ts`                       | ドメイン型定義（作問入力、公開クイズ、回答結果など）。         |
| `lib/id.ts`                           | UUID 生成ユーティリティ。                                      |
| `lib/quiz-core.ts`                    | 作問バリデーション、判定計算など共通ロジック。                 |
| `lib/quiz-repository.ts`              | D1 への永続化・取得処理（作問、取得、判定保存）。              |
| `next-env.d.ts`                       | Next.js が生成する型定義参照ファイル。                         |
| `next.config.ts`                      | Next.js の基本設定。                                           |
| `open-next.config.ts`                 | OpenNext の Cloudflare 向けビルド設定。                        |
| `package-lock.json`                   | npm 依存関係のロックファイル。                                 |
| `package.json`                        | npm スクリプトと依存関係定義。                                 |
| `scripts/`                            | 開発・運用で使う補助スクリプトを配置。                         |
| `scripts/apply_d1_migrations.sh`      | D1 の未適用マイグレーションを適用する実行スクリプト。          |
| `scripts/reset_d1_tables.sh`          | D1 テーブルと移行管理テーブルを初期化する実行スクリプト。      |
| `test/`                               | テスト関連ファイルのルートディレクトリ。                       |
| `test/unit/`                          | 単体テストを配置するディレクトリ。                             |
| `test/unit/api-routes.test.ts`        | API ルート（作問・取得・回答送信）の単体テスト。               |
| `test/unit/auth.test.ts`              | `auth.ts` の callback 挙動に関する単体テスト。                 |
| `test/unit/create-page-auth.test.tsx` | 作問ページの認証ガードに関する単体テスト。                     |
| `test/unit/create-quiz-form.test.tsx` | 作問フォームの操作・送信処理に関する単体テスト。               |
| `test/unit/d1.test.ts`                | `lib/d1.ts` の単体テスト。                                     |
| `test/unit/home-page-auth.test.tsx`   | トップページのログイン状態表示分岐に関する単体テスト。         |
| `test/unit/id.test.ts`                | `lib/id.ts` の単体テスト。                                     |
| `test/unit/login-form.test.tsx`       | ログインフォームの送信・エラー表示に関する単体テスト。         |
| `test/unit/login-page.test.tsx`       | ログインページのリダイレクト・入力値受け渡しの単体テスト。     |
| `test/unit/logout-button.test.tsx`    | ログアウトボタンの送信処理に関する単体テスト。                 |
| `test/unit/quiz-page.test.tsx`        | クイズ表示ページの取得成功・404分岐に関する単体テスト。        |
| `test/unit/quiz-player.test.tsx`      | 回答UIの選択・送信・判定結果表示に関する単体テスト。           |
| `test/unit/quiz-core.test.ts`         | `lib/quiz-core.ts` の単体テスト。                              |
| `test/unit/quiz-repository.test.ts`   | `lib/quiz-repository.ts` の単体テスト。                        |
| `tsconfig.json`                       | TypeScript コンパイル設定。                                    |
| `types/`                              | グローバル型宣言を配置。                                       |
| `types/cloudflare.d.ts`               | D1 など Cloudflare 型の簡易宣言。                              |
| `types/next-auth.d.ts`                | NextAuth の `Session.user.id` 拡張型定義。                     |
| `vitest.config.ts`                    | Vitest 実行設定（対象、エイリアスなど）。                      |
| `wrangler.jsonc`                      | Cloudflare Workers / D1 のデプロイ設定。                       |
