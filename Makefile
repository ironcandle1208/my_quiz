SHELL := /bin/bash

D1_DATABASE_NAME ?= my-quiz-db

.PHONY: d1-migrate d1-migrate-local d1-migrate-preview d1-reset d1-reset-local d1-reset-preview d1-reinit d1-reinit-local d1-reinit-preview cf-build cf-dev cf-dev-build

# Cloudflare 上の D1 に未適用マイグレーションを適用する。
d1-migrate:
	D1_DATABASE_NAME=$(D1_DATABASE_NAME) ./scripts/apply_d1_migrations.sh remote

# ローカル D1 (wrangler dev 用) に未適用マイグレーションを適用する。
d1-migrate-local:
	D1_DATABASE_NAME=$(D1_DATABASE_NAME) ./scripts/apply_d1_migrations.sh local

# Preview D1 に未適用マイグレーションを適用する。
d1-migrate-preview:
	D1_DATABASE_NAME=$(D1_DATABASE_NAME) ./scripts/apply_d1_migrations.sh preview

# Cloudflare 上の D1 テーブルを初期化する（データ削除）。
d1-reset:
	D1_DATABASE_NAME=$(D1_DATABASE_NAME) ./scripts/reset_d1_tables.sh remote

# ローカル D1 (wrangler dev 用) のテーブルを初期化する（データ削除）。
d1-reset-local:
	D1_DATABASE_NAME=$(D1_DATABASE_NAME) ./scripts/reset_d1_tables.sh local

# Preview D1 のテーブルを初期化する（データ削除）。
d1-reset-preview:
	D1_DATABASE_NAME=$(D1_DATABASE_NAME) ./scripts/reset_d1_tables.sh preview

# Cloudflare 上の D1 を初期化してからマイグレーションを再適用する。
d1-reinit: d1-reset d1-migrate

# ローカル D1 を初期化してからマイグレーションを再適用する。
d1-reinit-local: d1-reset-local d1-migrate-local

# Preview D1 を初期化してからマイグレーションを再適用する。
d1-reinit-preview: d1-reset-preview d1-migrate-preview

# Cloudflare Workers 向けの OpenNext ビルドを実行する。
cf-build:
	npm run build:cf

# Cloudflare Workers 互換でローカル開発サーバーを起動する。
cf-dev:
	npm run dev:cf

# OpenNext ビルド後に Cloudflare Workers 互換の開発サーバーを起動する。
cf-dev-build: cf-build
	npx wrangler dev
