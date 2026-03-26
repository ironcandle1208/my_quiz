"use client";

import { FormEvent, useState } from "react";
import type { AttemptResult, PublishedQuiz } from "@/lib/domain";

type QuizPlayerProps = {
  quiz: PublishedQuiz;
};

/**
 * クイズ回答UIを表示し、提出後に正誤結果を描画する。
 */
export function QuizPlayer({ quiz }: QuizPlayerProps) {
  const [selectedChoiceIdsByQuestionId, setSelectedChoiceIdsByQuestionId] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 設問ごとの選択状態を更新する。
   */
  function selectChoice(questionId: string, choiceId: string) {
    setSelectedChoiceIdsByQuestionId((prev) => ({
      ...prev,
      [questionId]: choiceId
    }));
  }

  /**
   * 現在の回答をAPIへ送信し、正誤判定結果を受け取る。
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/quizzes/${quiz.quizId}/attempts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          selectedChoiceIdsByQuestionId
        })
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "回答の送信に失敗しました。");
      }

      const body = (await response.json()) as AttemptResult;
      setResult(body);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "予期しないエラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card stack">
      <form className="stack" onSubmit={handleSubmit}>
        {quiz.questions.map((question, index) => (
          <article key={question.id} className="card stack">
            <h3 style={{ marginBottom: 8 }}>
              Q{index + 1}. {question.body}
            </h3>
            <div className="stack">
              {question.choices.map((choice) => (
                <label key={choice.id} className="row">
                  <input
                    type="radio"
                    name={question.id}
                    checked={selectedChoiceIdsByQuestionId[question.id] === choice.id}
                    onChange={() => selectChoice(question.id, choice.id)}
                  />
                  <span>{choice.body}</span>
                </label>
              ))}
            </div>
            {result ? (
              <p className={result.answers.find((answer) => answer.questionId === question.id)?.isCorrect ? "result-ok" : "result-ng"}>
                {result.answers.find((answer) => answer.questionId === question.id)?.isCorrect ? "正解" : "不正解"}
              </p>
            ) : null}
          </article>
        ))}
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "判定中..." : "回答を送信して判定"}
        </button>
        {error ? <p className="result-ng">{error}</p> : null}
      </form>

      {result ? (
        <section className="card stack">
          <h2>判定結果</h2>
          <p>
            {result.correctCount} / {result.totalCount} 問正解
          </p>
          <p>スコア: {result.score} 点</p>
        </section>
      ) : null}
    </section>
  );
}
