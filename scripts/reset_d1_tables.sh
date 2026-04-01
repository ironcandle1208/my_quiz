#!/usr/bin/env bash
set -euo pipefail

# wrangler コマンドの実体を解決する。
# グローバルインストールを優先し、見つからない場合はローカル依存を利用する。
resolve_wrangler() {
  if command -v wrangler >/dev/null 2>&1; then
    command -v wrangler
    return
  fi

  if [[ -x "./node_modules/.bin/wrangler" ]]; then
    echo "./node_modules/.bin/wrangler"
    return
  fi

  echo "wrangler コマンドが見つかりません。wrangler をインストールしてください。" >&2
  exit 1
}

# 指定されたモードに応じて d1 execute のフラグを返す。
# 対応モードは remote/local/preview の3種類。
resolve_mode_flag() {
  case "$1" in
    remote)
      echo "--remote"
      ;;
    local)
      echo "--local"
      ;;
    preview)
      echo "--preview"
      ;;
    *)
      echo "無効なモードです: $1 (remote/local/preview のいずれかを指定してください)" >&2
      exit 1
      ;;
  esac
}

# D1 を初期化するための SQL を返す。
# 外部キー制約の影響を避けるため、制約を一時的に無効化してから全テーブルを削除する。
build_reset_sql() {
  cat <<'SQL'
PRAGMA foreign_keys=OFF;
DROP TABLE IF EXISTS attempt_answers;
DROP TABLE IF EXISTS attempts;
DROP TABLE IF EXISTS choices;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS quiz_versions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS d1_migrations;
PRAGMA foreign_keys=ON;
SQL
}

MODE="${1:-remote}"
DB_NAME="${D1_DATABASE_NAME:-my-quiz-db}"
WRANGLER_BIN="$(resolve_wrangler)"
MODE_FLAG="$(resolve_mode_flag "$MODE")"
RESET_SQL="$(build_reset_sql)"

# 実行対象のDBとモードを表示してから初期化する。
echo "D1 テーブルを初期化します (database=${DB_NAME}, mode=${MODE})"
"${WRANGLER_BIN}" d1 execute "${DB_NAME}" "${MODE_FLAG}" --command "${RESET_SQL}"
