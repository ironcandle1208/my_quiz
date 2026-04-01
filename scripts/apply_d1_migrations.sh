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

# 指定されたモードに応じて d1 migrations apply のフラグを返す。
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

MODE="${1:-remote}"
DB_NAME="${D1_DATABASE_NAME:-my-quiz-db}"
WRANGLER_BIN="$(resolve_wrangler)"
MODE_FLAG="$(resolve_mode_flag "$MODE")"

# 実行対象のDBとモードを表示してから適用する。
echo "D1 マイグレーションを適用します (database=${DB_NAME}, mode=${MODE})"
"${WRANGLER_BIN}" d1 migrations apply "${DB_NAME}" "${MODE_FLAG}"
