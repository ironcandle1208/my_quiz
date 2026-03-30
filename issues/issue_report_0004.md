id: 0004
修正日時: 2026/03/30 20:48:03

事象概要:

- `wrangler dev` 実行時に Worker エントリファイルが見つからず、Cloudflare ローカル実行が開始できなかった事象。

発生事象:

- `wrangler dev` 実行時に `The entry-point file at ".open-next/worker.js" was not found.` が出力され、起動に失敗した。
- 対象設定ファイルは `wrangler.jsonc`。
- `wrangler.jsonc` の `main` は `.open-next/worker.js` を参照していた。
  - `main: ".open-next/worker.js"`
- 事象発生時点では `.open-next/worker.js` が未生成で、参照先ファイルが存在しなかった。

直接原因:

- `wrangler.jsonc` が参照する Worker エントリ（`.open-next/worker.js`）が事前に生成されていなかったこと。

根本原因:

- `wrangler dev` 実行前に OpenNext ビルド（Worker 生成）を必須手順として運用に組み込めていなかった。
- Cloudflare 実行に必要なファイル生成手順（`open-next.config.ts` 準備と OpenNext ビルド）の認識が不足していた。

対応方法:

- 恒久対応として `open-next.config.ts` を追加し、`opennextjs-cloudflare build` を実行して `.open-next/worker.js` を生成した。
- 一時対応ではなく、Cloudflare 実行経路に必要な生成手順を反映する恒久対応。

エスカレーション:

- `wrangler dev` 実行前チェックに「`.open-next/worker.js` の存在確認」を追加する。
- 開発手順に「OpenNext ビルド後に Wrangler で起動」の順序を明記する。
- `wrangler.jsonc` の `main` が生成物を参照する場合、生成コマンドを `README` と運用チェックリストに必ず併記する。
