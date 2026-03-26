# Next.js クイズ作成アプリ 低コスト運用構成案（Cloudflare寄せ）

更新日: 2026-03-26

## 目的
- 自作クイズを作成・公開できる Web アプリを、Next.js を使って構築する
- プラットフォームを Cloudflare に寄せる
- 初期〜中規模運用でコスト最小化を優先する

## 推奨構成（最小コスト優先）
- フロント/API 実行基盤: Next.js（App Router）+ Cloudflare Workers（OpenNext）
- データベース: Cloudflare D1（クイズ、問題、選択肢、回答履歴）
- 画像や添付ファイル（必要時のみ）: Cloudflare R2
- Bot 対策: Cloudflare Turnstile
- キャッシュ: Next.js の SSG/ISR + Cloudflare CDN（最初は KV なし）

## この構成を推奨する理由
- Cloudflare 内で主要機能を完結でき、インフラ分散コストを抑えやすい
- クイズ作成アプリに必要な CRUD + 一覧/詳細配信は D1 で十分に実現しやすい
- 静的配信は CDN で安価、動的処理だけ Workers で実行できる
- R2/KV は「必要になってから」追加でき、初期コストを固定化しにくい

## 運用コスト最適化の要点
- Workers はまず Free プラン前提で開始する
- Free の CPU 10ms/リクエスト制限を考慮し、処理を軽量化しつつ、上限が見えた段階でのみ Paid へ移行する
- SSG 可能なページ（トップ、公開クイズ一覧、ヘルプ）は静的化を優先する
- API は読み取り中心の設計にして、書き込みは最小限にする
- 画像は R2 直配信に寄せ、Workers 経由レスポンスを減らす

## 認証方針（Auth.js）
- 認証基盤は Auth.js（next-auth v5 系）を採用する
- 永続化は Cloudflare D1 + `@auth/d1-adapter` を利用する
- Free 運用を優先するため、セッション戦略は `session.strategy = "jwt"` を基本とする
- 環境変数は最低限 `AUTH_SECRET` と `AUTH_TRUST_HOST=true` を設定する
- v5 は更新変化を考慮し、依存バージョンを固定して段階的にアップデートする

## 初期データモデル（D1 例）
- `users`
- `quizzes`（クイズ本体）
- `questions`（設問）
- `choices`（選択肢）
- `quiz_attempts`（回答セッション）
- `quiz_answers`（回答内容）

## DB 設計詳細（MVP: 作問・問題表示・正誤判定）
### 設計方針
- クイズ公開時に版（`quiz_versions`）を固定し、過去回答との不整合を防ぐ
- 判定は回答送信時に実行し、正誤結果を保存して読み取りを軽量化する
- 問題表示は `order_no` で安定ソートし、毎回同じ順序で出せるようにする

### テーブル構成
- `quizzes`: クイズ本体（作成者、タイトル、公開状態）
- `quiz_versions`: 公開版（公開ごとに1レコード追加）
- `questions`: 設問（版に紐づく、表示順を保持）
- `choices`: 選択肢（設問に紐づく、正解フラグを保持）
- `attempts`: 受験セッション（開始/提出時刻、スコア集計）
- `attempt_answers`: 回答内容（設問ごとの選択結果と正誤）

### MVP スキーマ（D1 / SQLite）
```sql
CREATE TABLE quizzes (
  id TEXT PRIMARY KEY,
  author_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quiz_versions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  version_no INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(quiz_id, version_no),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  quiz_version_id TEXT NOT NULL,
  order_no INTEGER NOT NULL,
  body TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'single',
  UNIQUE(quiz_version_id, order_no),
  FOREIGN KEY (quiz_version_id) REFERENCES quiz_versions(id) ON DELETE CASCADE
);

CREATE TABLE choices (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  order_no INTEGER NOT NULL,
  body TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  UNIQUE(question_id, order_no),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE attempts (
  id TEXT PRIMARY KEY,
  quiz_version_id TEXT NOT NULL,
  user_id TEXT,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (quiz_version_id) REFERENCES quiz_versions(id)
);

CREATE TABLE attempt_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_choice_id TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  UNIQUE(attempt_id, question_id),
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (selected_choice_id) REFERENCES choices(id)
);

CREATE INDEX idx_questions_version_order
  ON questions(quiz_version_id, order_no);
CREATE INDEX idx_choices_question_order
  ON choices(question_id, order_no);
CREATE INDEX idx_attempts_quiz_submitted
  ON attempts(quiz_version_id, submitted_at);
```

### 機能ごとの利用イメージ
- 作問: `quizzes` を `draft` で作成し、公開時に `quiz_versions` を採番して固定する
- 問題表示: `quiz_version_id` で `questions` と `choices` を `order_no` 順で取得する
- 正誤判定: 提出時に `choices.is_correct` と照合し、`attempt_answers.is_correct` と `attempts` 集計を保存する

## 段階的な拡張方針（コスト維持）
1. Phase 1: Next.js + Workers + D1 + Turnstile のみで開始
2. Phase 2: 画像要件が出たら R2 を追加
3. Phase 3: 高トラフィック時のみ KV/Durable Objects を部分導入

## 公式ドキュメント
- Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Next.js on Workers: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- Auth.js D1 Adapter: https://authjs.dev/getting-started/adapters/d1
- Auth.js Deployment: https://authjs.dev/getting-started/deployment
- Auth.js Edge Compatibility: https://authjs.dev/guides/edge-compatibility
- D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
- R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Turnstile plans: https://developers.cloudflare.com/turnstile/plans/
