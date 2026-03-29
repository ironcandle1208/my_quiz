id: 0001
修正日時: 2026/03/29 22:28:10

事象概要:

- 作問画面（`/create`）で Hydration 警告が発生し、SSR 出力とクライアント初期描画の属性不一致が検知された事象。

発生事象:

- 作問画面の初回表示時に、Hydration 警告「A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.」が発生した。
- 対象ファイルは `app/create/create-quiz-form.tsx`。
- 修正前コードでは `createEmptyChoice()` と `createEmptyQuestion()` が `crypto.randomUUID()` で ID を生成していた。
  - `id: crypto.randomUUID()`
- この ID が `questions` の初期 state 生成（`useState([createEmptyQuestion()])`）で使用され、さらに `name={\`correct-${question.id}\`}` に使われていたため、SSR 時とクライアント初期描画時で属性値が不一致になった。

直接原因:

- 初期レンダリング中に `crypto.randomUUID()` を実行し、サーバー側とクライアント側で異なる値を HTML 属性に埋め込んだこと。

根本原因:

- SSR + Hydration の前提（初期描画は決定的であること）に対する実装ルールが不足していた。
- 「初期レンダリング中に非決定的な値を使わない」観点のレビュー・検証プロセスが不十分だった。

対応方法:

- 恒久対応として、`app/create/create-quiz-form.tsx` の設問/選択肢ID生成を連番ベースの決定的生成に変更した。
  - `question-${questionSequenceNo}`
  - `question-${questionSequenceNo}-choice-${choiceOrderNo}`
- 追加設問は `useRef` で連番管理してIDを払い出す方式に変更し、初期描画の決定性を確保した。
- 一時対応ではなく、実装方針を変更する恒久対応。

エスカレーション:

- SSR される Client Component では、初期レンダリング中に `Math.random()` / `Date.now()` / `crypto.randomUUID()` を利用しないルールを開発規約に明記する。
- PR レビュー時に「Hydration 不一致リスク（非決定値の使用有無）」を確認項目として追加する。
- 必要に応じて、作問画面の初期DOM属性が安定していることを確認するテストを追加する。
