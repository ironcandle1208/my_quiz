id: 0002
修正日時: 2026/03/30 20:43:30

事象概要:

- `wrangler dev` 実行時に D1 バインディング解決エラーが発生し、DBアクセス処理が失敗した事象。

発生事象:

- D1 取得処理で `D1 バインディング \`DB\` が見つかりません。wrangler の d1_databases 設定を確認してください。` が発生した。
- 対象ファイルは `lib/d1.ts`。
- `lib/d1.ts` は `globalThis.DB` または `globalThis.__env.DB` を参照する実装になっていた。
  - `const db = globalWithD1.DB ?? globalWithD1.__env?.DB;`
- 一方で、修正前の `wrangler.jsonc` では `d1_databases[0].binding` が `my-quiz-db` であり、実行時に `DB` 名で注入されていなかった。

直接原因:

- `lib/d1.ts` が期待する D1 バインディング名（`DB`）と、`wrangler.jsonc` の `binding` 設定名が不一致だったこと。

根本原因:

- Cloudflare 実行時バインディング名をコード期待値と突き合わせる設定レビューが不足していた。
- 実行設定（`wrangler.jsonc`）変更時に、アプリ側参照名との整合性確認プロセスが定着していなかった。

対応方法:

- 恒久対応として、`wrangler.jsonc` の `d1_databases[0].binding` を `DB` に修正し、アプリ実装の参照名と一致させた。
- 一時対応ではなく、設定と実装の契約を一致させる恒久対応。

エスカレーション:

- Cloudflare バインディング（D1/R2/KV 等）は「設定名 = コード参照名」をレビュー項目として必須化する。
- `wrangler.jsonc` 更新時に、該当参照箇所（例: `lib/d1.ts`）の確認を PR チェックリストに追加する。
- ローカル起動前に `wrangler.jsonc` の主要バインディング名差分を確認する運用を導入する。
