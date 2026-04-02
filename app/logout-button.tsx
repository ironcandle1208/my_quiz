"use client";

import { signOut } from "next-auth/react";

/**
 * ログアウトを実行するボタンを表示する。
 */
export function LogoutButton() {
  /**
   * 現在のセッションを破棄してトップへ遷移する。
   */
  async function handleSignOut() {
    await signOut({ callbackUrl: "/" });
  }

  return (
    <button className="button secondary" type="button" onClick={handleSignOut}>
      ログアウト
    </button>
  );
}
