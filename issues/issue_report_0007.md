# 障害記録票

- id: 0007
- 修正日時: 2026/04/04 13:27:53

## 事象概要

- `wrangler dev` 実行時に `[next-auth][error][NO_SECRET]` が出力され、認証処理が継続できない状態になった。

## 発生事象

- 対象ファイル:
  - `auth.ts`
- `authOptions` に `secret` が未設定で、実行環境によっては `AUTH_SECRET` が next-auth v4 の既定解決対象にならず、`MissingSecretError` が発生していた。
- ログには以下が出力される。
  - `[next-auth][error][NO_SECRET]`
  - `Please define a secret in production.`

## 直接原因

- 認証設定で `secret` を明示設定しておらず、環境変数名の差異（`AUTH_SECRET` と `NEXTAUTH_SECRET`）を吸収できていなかった。

## 根本原因

- Auth.js/next-auth のバージョン差分における環境変数互換性を実装へ反映できておらず、環境依存の挙動を前提にしていた。

## 対応方法

- 恒久対応:
  - `auth.ts` に `resolveAuthSecret()` を追加し、`AUTH_SECRET` または `NEXTAUTH_SECRET` を解決して `authOptions.secret` へ明示設定するよう修正。
  - `README.md` の環境変数例へ `NEXTAUTH_SECRET` を追記し、設定漏れを防止。

## エスカレーション

- 認証設定の必須値（`secret` など）は「フレームワーク既定に依存せず明示設定する」方針をレビュー項目へ追加する。
- ライブラリのメジャー/マイナー差分で変わる環境変数名は、互換レイヤーを実装し、ドキュメントにも併記する。
