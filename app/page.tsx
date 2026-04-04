import Link from "next/link";
import { getAppSession } from "@/auth";

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
        {session?.user?.id ? (
          <div className="row">
            <Link className="button" href="/create">
              クイズを作成する
            </Link>
          </div>
        ) : (
          <p className="muted">ヘッダーのログインボタンから作問機能を利用できます。</p>
        )}
      </section>
    </main>
  );
}
