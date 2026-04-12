import Link from "next/link";
import { getAppSession } from "@/auth";
import { getMyQuizzes } from "@/lib/quiz-repository";
import { redirect } from "next/navigation";

/**
 * ログインユーザーが作成したクイズ一覧を表示する。
 */
export default async function MyQuizzesListPage() {
  const session = await getAppSession();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/my-quizzes/list");
  }

  const myQuizzes = await getMyQuizzes(session.user.id);

  return (
    <main className="stack">
      <section className="card stack">
        <h1>マイクイズ一覧</h1>
        <p className="muted">自分が作成したクイズを確認できます。</p>
      </section>

      {myQuizzes.length === 0 ? (
        <section className="card">
          <p className="muted">作成済みのクイズはまだありません。</p>
        </section>
      ) : (
        <section className="stack" aria-label="マイクイズ一覧">
          {myQuizzes.map((quiz) => (
            <article className="card stack" key={quiz.quizId}>
              <h2>{quiz.title}</h2>
              <p className="muted">{quiz.description ?? "説明は未設定です。"}</p>
              <p className="muted">公開バージョン: {quiz.latestVersionNo}</p>
              <div className="row">
                <Link className="button" href={`/quiz/${quiz.quizId}`}>
                  クイズを開く
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
