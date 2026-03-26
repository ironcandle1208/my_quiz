"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type DraftChoice = {
  id: string;
  body: string;
  isCorrect: boolean;
};

type DraftQuestion = {
  id: string;
  body: string;
  choices: DraftChoice[];
};

type CreateQuizResponse = {
  quizId: string;
  versionNo: number;
};

/**
 * 新規選択肢の初期値を生成する。
 */
function createEmptyChoice(): DraftChoice {
  return {
    id: crypto.randomUUID(),
    body: "",
    isCorrect: false
  };
}

/**
 * 新規設問の初期値を生成する。
 */
function createEmptyQuestion(): DraftQuestion {
  const choice1 = createEmptyChoice();
  const choice2 = createEmptyChoice();

  return {
    id: crypto.randomUUID(),
    body: "",
    choices: [
      { ...choice1, isCorrect: true },
      { ...choice2, isCorrect: false }
    ]
  };
}

/**
 * 作問フォームを描画し、作成APIへ送信する。
 */
export function CreateQuizForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([createEmptyQuestion()]);
  const [authorUserId, setAuthorUserId] = useState("demo-user");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 設問を1件追加する。
   */
  function addQuestion() {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  }

  /**
   * 指定設問を削除する。
   */
  function removeQuestion(questionId: string) {
    setQuestions((prev) => prev.filter((question) => question.id !== questionId));
  }

  /**
   * 設問本文を更新する。
   */
  function updateQuestionBody(questionId: string, body: string) {
    setQuestions((prev) =>
      prev.map((question) => (question.id === questionId ? { ...question, body } : question))
    );
  }

  /**
   * 選択肢を追加する。
   */
  function addChoice(questionId: string) {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              choices: [...question.choices, createEmptyChoice()]
            }
          : question
      )
    );
  }

  /**
   * 選択肢本文を更新する。
   */
  function updateChoiceBody(questionId: string, choiceId: string, body: string) {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              choices: question.choices.map((choice) => (choice.id === choiceId ? { ...choice, body } : choice))
            }
          : question
      )
    );
  }

  /**
   * 指定設問の正解選択肢を1件だけ有効化する。
   */
  function setCorrectChoice(questionId: string, choiceId: string) {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              choices: question.choices.map((choice) => ({ ...choice, isCorrect: choice.id === choiceId }))
            }
          : question
      )
    );
  }

  /**
   * 選択肢を削除する。
   */
  function removeChoice(questionId: string, choiceId: string) {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) {
          return question;
        }

        const nextChoices = question.choices.filter((choice) => choice.id !== choiceId);
        // 選択肢削除後に正解が未設定になるケースを避けるため、先頭を正解に戻す。
        if (!nextChoices.some((choice) => choice.isCorrect) && nextChoices[0]) {
          nextChoices[0] = { ...nextChoices[0], isCorrect: true };
        }

        return {
          ...question,
          choices: nextChoices
        };
      })
    );
  }

  /**
   * フォーム入力を作問APIへ送信する。
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          description,
          authorUserId,
          questions: questions.map((question) => ({
            body: question.body,
            choices: question.choices.map((choice) => ({
              body: choice.body,
              isCorrect: choice.isCorrect
            }))
          }))
        })
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "クイズ作成に失敗しました。");
      }

      const body = (await response.json()) as CreateQuizResponse;
      router.push(`/quiz/${body.quizId}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "予期しないエラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card stack">
      <form className="stack" onSubmit={handleSubmit}>
        <label className="stack">
          <span>タイトル</span>
          <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label className="stack">
          <span>説明</span>
          <textarea className="textarea" value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label className="stack">
          <span>作成者ID（Auth.js連携時はセッション値を使用）</span>
          <input className="input" value={authorUserId} onChange={(event) => setAuthorUserId(event.target.value)} required />
        </label>

        {questions.map((question, questionIndex) => (
          <article key={question.id} className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h3 style={{ marginBottom: 0 }}>設問 {questionIndex + 1}</h3>
              <button
                className="button danger"
                type="button"
                onClick={() => removeQuestion(question.id)}
                disabled={questions.length === 1}
              >
                設問を削除
              </button>
            </div>
            <label className="stack">
              <span>設問本文</span>
              <textarea
                className="textarea"
                value={question.body}
                onChange={(event) => updateQuestionBody(question.id, event.target.value)}
                required
              />
            </label>
            <div className="stack">
              {question.choices.map((choice, choiceIndex) => (
                <div className="card stack" key={choice.id}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <strong>選択肢 {choiceIndex + 1}</strong>
                    <button
                      className="button danger"
                      type="button"
                      onClick={() => removeChoice(question.id, choice.id)}
                      disabled={question.choices.length <= 2}
                    >
                      選択肢を削除
                    </button>
                  </div>
                  <input
                    className="input"
                    value={choice.body}
                    onChange={(event) => updateChoiceBody(question.id, choice.id, event.target.value)}
                    required
                  />
                  <label className="row">
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={choice.isCorrect}
                      onChange={() => setCorrectChoice(question.id, choice.id)}
                    />
                    <span>この選択肢を正解にする</span>
                  </label>
                </div>
              ))}
              <button className="button secondary" type="button" onClick={() => addChoice(question.id)}>
                選択肢を追加
              </button>
            </div>
          </article>
        ))}

        <div className="row">
          <button className="button secondary" type="button" onClick={addQuestion}>
            設問を追加
          </button>
          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "作成中..." : "クイズを作成して公開"}
          </button>
        </div>
        {error ? <p className="result-ng">{error}</p> : null}
      </form>
    </section>
  );
}
