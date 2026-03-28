/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import QuizPage from "@/app/quiz/[quizId]/page";
import { getPublishedQuiz } from "@/lib/quiz-repository";
import { notFound } from "next/navigation";
import type { PublishedQuiz } from "@/lib/domain";

vi.mock("@/lib/quiz-repository", () => ({
  getPublishedQuiz: vi.fn(),
}));

const mockQuizPlayer = vi.fn((props: { quiz: PublishedQuiz }) => {
  return <div data-testid="quiz-player">quizId: {props.quiz.quizId}</div>;
});

vi.mock("@/app/quiz/[quizId]/quiz-player", () => ({
  QuizPlayer: (props: { quiz: PublishedQuiz }) => mockQuizPlayer(props),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

const mockedGetPublishedQuiz = vi.mocked(getPublishedQuiz);
const mockedNotFound = vi.mocked(notFound);

beforeEach(() => {
  vi.clearAllMocks();
  mockedNotFound.mockImplementation(() => {
    throw new Error("NOT_FOUND");
  });
});

afterEach(() => {
  cleanup();
});

/**
 * QuizPage の props 形式を作成する。
 */
function createQuizPageProps(quizId: string): { params: Promise<{ quizId: string }> } {
  return {
    params: Promise.resolve({ quizId }),
  };
}

describe("QuizPage", () => {
  test("公開中クイズが見つからない場合は notFound を呼び出す", async () => {
    mockedGetPublishedQuiz.mockResolvedValue(null);

    await expect(QuizPage(createQuizPageProps("quiz-404"))).rejects.toThrowError("NOT_FOUND");

    expect(mockedGetPublishedQuiz).toHaveBeenCalledWith("quiz-404");
    expect(mockedNotFound).toHaveBeenCalledTimes(1);
  });

  test("公開中クイズがある場合はページ情報と QuizPlayer を描画する", async () => {
    const quiz: PublishedQuiz = {
      quizId: "quiz-1",
      title: "地理クイズ",
      description: "都道府県に関するクイズです。",
      quizVersionId: "version-3",
      versionNo: 3,
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
      ],
    };
    mockedGetPublishedQuiz.mockResolvedValue(quiz);

    const pageElement = await QuizPage(createQuizPageProps("quiz-1"));
    render(pageElement);

    expect(mockedGetPublishedQuiz).toHaveBeenCalledWith("quiz-1");
    expect(mockedNotFound).not.toHaveBeenCalled();

    expect(screen.getByRole("heading", { name: "地理クイズ" })).toBeInTheDocument();
    expect(screen.getByText("都道府県に関するクイズです。")).toBeInTheDocument();
    expect(screen.getByText("version: 3")).toBeInTheDocument();

    expect(screen.getByTestId("quiz-player")).toHaveTextContent("quizId: quiz-1");
    expect(mockQuizPlayer).toHaveBeenCalled();
    expect(mockQuizPlayer.mock.calls[0]?.[0]).toEqual({ quiz });
  });

  test("description が null の場合は既定文言を表示する", async () => {
    const quiz: PublishedQuiz = {
      quizId: "quiz-2",
      title: "歴史クイズ",
      description: null,
      quizVersionId: "version-1",
      versionNo: 1,
      questions: [
        {
          id: "q1",
          orderNo: 1,
          body: "設問",
          questionType: "single",
          choices: [
            { id: "c1", orderNo: 1, body: "A" },
            { id: "c2", orderNo: 2, body: "B" },
          ],
        },
      ],
    };
    mockedGetPublishedQuiz.mockResolvedValue(quiz);

    const pageElement = await QuizPage(createQuizPageProps("quiz-2"));
    render(pageElement);

    expect(screen.getByText("説明は未設定です。")).toBeInTheDocument();
  });
});
