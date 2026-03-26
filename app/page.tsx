import Link from "next/link";

/**
 * アプリのトップページを表示する。
 */
export default function HomePage() {
  return (
    <main className="stack">
      <section className="card stack">
        <h1>My Quiz</h1>
        <p className="muted">作問、問題表示、正誤判定までを最小構成で実装したクイズアプリです。</p>
        <div className="row">
          <Link className="button" href="/create">
            クイズを作成する
          </Link>
        </div>
      </section>
    </main>
  );
}
