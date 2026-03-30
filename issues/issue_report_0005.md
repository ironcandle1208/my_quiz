# 障害記録票

- id: 0005
- 修正日時: 2026/03/30 21:21:12

## 事象概要

- `wrangler dev` で起動した環境にてクイズ保存時（`POST /api/quizzes`）に 500 が発生し、`TypeError: Cannot read properties of undefined (reading 'default')` が出力される事象。

## 発生事象

- 対象ファイル:
  - `app/api/quizzes/route.ts`
  - `app/api/quizzes/[quizId]/route.ts`
  - `app/api/quizzes/[quizId]/attempts/route.ts`
  - `lib/d1.ts`
- API ルートで `export const runtime = "edge";` を指定していたため、OpenNext の default server function 実行時に API ルート解決が崩れ、`loadComponentsImpl` 内で `ComponentMod` が `undefined` となり `interopDefault` で例外が発生していた。
- `runtime` 指定を外すと API ルート自体は解決されるが、`lib/d1.ts` が `globalThis.DB` / `globalThis.__env.DB` のみを参照していたため、OpenNext が保持する Cloudflare コンテキストから `DB` を取得できず `D1 バインディング \`DB\` が見つかりません` で失敗していた。

## 直接原因

- API ルートの `runtime = "edge"` 指定と OpenNext のローカル実行形態が不整合だったこと。
- D1 バインディングの取得先が OpenNext の Cloudflare コンテキストを網羅していなかったこと。

## 根本原因

- Cloudflare/OpenNext 実行時のランタイム境界（Edge Runtime 指定の扱い）と、D1 バインディング注入経路の仕様理解が不十分だった。
- `wrangler dev` 実行で API 保存と画面遷移を通し確認する運用チェックが不足していた。

## 対応方法

- 恒久対応:
  - API ルート 3 ファイルから `runtime = "edge"` を削除し、OpenNext default server function で正しく処理できるようにした。
  - `lib/d1.ts` の D1 解決先に `globalThis[Symbol.for("__cloudflare-context__")].env.DB` を追加し、OpenNext の Cloudflare コンテキストから取得できるようにした。
  - `test/unit/d1.test.ts` に Cloudflare コンテキスト経由の取得ケースを追加した。

## エスカレーション

- Cloudflare/OpenNext 向けのランタイム指定（`runtime = "edge"`）は、実行基盤の対応状況を確認した上で適用するレビュー項目を追加する。
- `wrangler dev` 検証手順に「`POST /api/quizzes` が 201 を返すこと」「作成した `quizId` の表示ページが 200 を返すこと」を必須チェックとして追加する。
