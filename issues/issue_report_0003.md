id: 0003
修正日時: 2026/03/30 20:43:30

事象概要:

- `wrangler dev` 実行時に `/_next/static/chunks/*` が 404 となり、静的アセット配信に失敗した事象。

発生事象:

- アクセスログに `GET /_next/static/chunks/... 404 Not Found` が連続して出力された。
- 対象設定ファイルは `wrangler.jsonc`。
- OpenNext 生成コードでは `env.ASSETS` を利用して画像/アセット配信を行う実装が含まれていた。
  - 参照例: `.open-next/cloudflare/images.js` 内の `env.ASSETS.fetch(...)`
- 修正前の `wrangler.jsonc` には `assets` セクションがなく、`ASSETS` バインディングが未定義だった。

直接原因:

- `wrangler.jsonc` に OpenNext 用の静的アセットバインディング（`assets.binding = "ASSETS"`）が定義されていなかったこと。

根本原因:

- OpenNext for Cloudflare 前提の `wrangler` 設定テンプレート（`assets` 設定含む）を反映しないままローカル実行した。
- Worker 生成後に「静的アセット配信設定」の有無を確認する手順が不足していた。

対応方法:

- 恒久対応として、`wrangler.jsonc` に以下の `assets` 設定を追加した。
  - `directory: ".open-next/assets"`
  - `binding: "ASSETS"`
- 一時対応ではなく、OpenNext 構成の必須設定を恒久的に取り込む対応。

エスカレーション:

- OpenNext ビルド後の `wrangler.jsonc` 必須項目（`main` / `assets` / 必要バインディング）をチェックリスト化する。
- `wrangler dev` 実行直後に `/_next/static` へのアクセス確認を行う運用を追加する。
- 静的アセット404が発生した場合は、まず `assets.directory` と `assets.binding` を一次確認する手順を標準化する。
