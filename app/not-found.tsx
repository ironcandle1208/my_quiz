import Link from "next/link";

/**
 * 404ページを表示する。
 */
export default function NotFoundPage() {
  return (
    <main className="stack">
      <section className="card stack">
        <h1>ページが見つかりません</h1>
        <p className="muted">指定されたクイズが存在しないか、公開されていません。</p>
        <Link className="button" href="/">
          トップへ戻る
        </Link>
      </section>
    </main>
  );
}
