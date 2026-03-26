import { notFound } from "next/navigation";
import { QuizPlayer } from "@/app/quiz/[quizId]/quiz-player";
import { getPublishedQuiz } from "@/lib/quiz-repository";

export const dynamic = "force-dynamic";

type QuizPageProps = {
  params: Promise<{
    quizId: string;
  }>;
};

/**
 * 公開済みクイズを表示し、回答UIへ接続する。
 */
export default async function QuizPage({ params }: QuizPageProps) {
  const { quizId } = await params;
  const quiz = await getPublishedQuiz(quizId);

  if (!quiz) {
    notFound();
  }

  return (
    <main className="stack">
      <section className="card stack">
        <h1>{quiz.title}</h1>
        <p className="muted">{quiz.description ?? "説明は未設定です。"}</p>
        <p className="muted">version: {quiz.versionNo}</p>
      </section>
      <QuizPlayer quiz={quiz} />
    </main>
  );
}
