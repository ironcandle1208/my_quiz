import Link from "next/link";
import { getAppSession } from "@/auth";
import { LogoutButton } from "@/app/logout-button";

/**
 * アプリのトップページを表示する。
 */
export default async function HomePage() {
  const session = await getAppSession();

  return (
    <main className="stack">
      <section className="card stack">
        <h1>My Quiz</h1>
        <p className="muted">作問、問題表示、正誤判定までを最小構成で実装したクイズアプリです。</p>
        <div className="row">
          {session?.user?.id ? (
            <>
              <Link className="button" href="/create">
                クイズを作成する
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link className="button" href="/login">
              ログイン
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
