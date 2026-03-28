/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { QuizPlayer } from "@/app/quiz/[quizId]/quiz-player";
import type { PublishedQuiz } from "@/lib/domain";

const sampleQuiz: PublishedQuiz = {
  quizId: "quiz-1",
  title: "地理クイズ",
  description: "説明",
  quizVersionId: "version-1",
  versionNo: 1,
  questions: [
    {
      id: "q1",
      orderNo: 1,
      body: "日本の首都は？",
      questionType: "single",
      choices: [
        { id: "c1", orderNo: 1, body: "東京" },
        { id: "c2", orderNo: 2, body: "大阪" },
      ],
    },
    {
      id: "q2",
      orderNo: 2,
      body: "北海道の県庁所在地は？",
      questionType: "single",
      choices: [
        { id: "c3", orderNo: 1, body: "函館" },
        { id: "c4", orderNo: 2, body: "札幌" },
      ],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/**
 * fetchのモックレスポンスを生成する。
 */
function createFetchResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("QuizPlayer", () => {
  test("初期表示では判定結果を表示しない", () => {
    render(<QuizPlayer quiz={sampleQuiz} />);

    expect(screen.getByText("Q1. 日本の首都は？")).toBeInTheDocument();
    expect(screen.getByText("Q2. 北海道の県庁所在地は？")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "判定結果" })).not.toBeInTheDocument();
  });

  test("送信成功時は回答APIを呼び出して判定結果を表示する", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createFetchResponse(201, {
        attemptId: "attempt-1",
        score: 50,
        correctCount: 1,
        totalCount: 2,
        answers: [
          {
            questionId: "q1",
            selectedChoiceId: "c1",
            isCorrect: true,
          },
          {
            questionId: "q2",
            selectedChoiceId: "c4",
            isCorrect: false,
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<QuizPlayer quiz={sampleQuiz} />);

    fireEvent.click(screen.getByLabelText("東京"));
    fireEvent.click(screen.getByLabelText("札幌"));
    fireEvent.click(screen.getByRole("button", { name: "回答を送信して判定" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/quizzes/quiz-1/attempts");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
    });

    const requestBody = JSON.parse(String(init.body)) as {
      selectedChoiceIdsByQuestionId: Record<string, string>;
    };
    expect(requestBody).toEqual({
      selectedChoiceIdsByQuestionId: {
        q1: "c1",
        q2: "c4",
      },
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "判定結果" })).toBeInTheDocument();
    });

    expect(screen.getByText("1 / 2 問正解")).toBeInTheDocument();
    expect(screen.getByText("スコア: 50 点")).toBeInTheDocument();

    const firstQuestion = screen.getByText("Q1. 日本の首都は？").closest("article");
    if (!firstQuestion) {
      throw new Error("1問目の設問カードが見つかりません。");
    }

    const secondQuestion = screen.getByText("Q2. 北海道の県庁所在地は？").closest("article");
    if (!secondQuestion) {
      throw new Error("2問目の設問カードが見つかりません。");
    }

    expect(within(firstQuestion).getByText("正解")).toBeInTheDocument();
    expect(within(secondQuestion).getByText("不正解")).toBeInTheDocument();
  });

  test("APIエラー時はエラーメッセージを表示する", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(createFetchResponse(400, { error: "未回答の設問があります。" }));
    vi.stubGlobal("fetch", fetchMock);

    render(<QuizPlayer quiz={sampleQuiz} />);

    fireEvent.click(screen.getByRole("button", { name: "回答を送信して判定" }));

    await waitFor(() => {
      expect(screen.getByText("未回答の設問があります。")).toBeInTheDocument();
    });
    expect(screen.queryByRole("heading", { name: "判定結果" })).not.toBeInTheDocument();
  });

  test("APIエラーで本文にerrorがない場合は既定メッセージを表示する", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createFetchResponse(500, {}));
    vi.stubGlobal("fetch", fetchMock);

    render(<QuizPlayer quiz={sampleQuiz} />);

    fireEvent.click(screen.getByRole("button", { name: "回答を送信して判定" }));

    await waitFor(() => {
      expect(screen.getByText("回答の送信に失敗しました。")).toBeInTheDocument();
    });
  });

  test("送信中はボタン文言を切り替えて無効化する", async () => {
    let resolveFetch: ((value: Response) => void) | null = null;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<QuizPlayer quiz={sampleQuiz} />);

    fireEvent.click(screen.getByRole("button", { name: "回答を送信して判定" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "判定中..." })).toBeDisabled();
    });

    if (!resolveFetch) {
      throw new Error("fetchの完了関数が設定されていません。");
    }
    const completeFetch = resolveFetch as (value: Response) => void;
    completeFetch(
      createFetchResponse(201, {
        attemptId: "attempt-2",
        score: 0,
        correctCount: 0,
        totalCount: 2,
        answers: [
          {
            questionId: "q1",
            selectedChoiceId: "c2",
            isCorrect: false,
          },
          {
            questionId: "q2",
            selectedChoiceId: "c3",
            isCorrect: false,
          },
        ],
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "回答を送信して判定" })).not.toBeDisabled();
    });
  });
});
