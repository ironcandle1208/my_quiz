import Link from "next/link";
import { getAppSession } from "@/auth";
import { LogoutButton } from "@/app/logout-button";

/**
 * 全ページ共通で表示するヘッダーを描画する。
 */
export async function AppHeader() {
  const session = await getAppSession();
  const isLoggedIn = Boolean(session?.user?.id);

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link className="app-title" href="/">
          My Quiz
        </Link>
        <nav className="app-header-nav" aria-label="ヘッダーメニュー">
          {isLoggedIn ? (
            <>
              <div className="app-header-dropdown">
                <button
                  type="button"
                  className="app-header-dropdown-trigger"
                  aria-haspopup="true"
                  aria-label="マイクイズメニュー"
                >
                  マイクイズ
                </button>
                <div className="app-header-dropdown-menu" aria-label="マイクイズ">
                  <Link className="app-header-dropdown-item" href="/my-quizzes/list">
                    一覧
                  </Link>
                </div>
              </div>
              <LogoutButton />
            </>
          ) : (
            <Link className="button" href="/login">
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
