import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST as postQuizzes } from "@/app/api/quizzes/route";
import { GET as getQuizById } from "@/app/api/quizzes/[quizId]/route";
import { POST as postAttempt } from "@/app/api/quizzes/[quizId]/attempts/route";
import { createQuiz, getPublishedQuiz, submitAttempt } from "@/lib/quiz-repository";

vi.mock("@/lib/quiz-repository", () => ({
  createQuiz: vi.fn(),
  getPublishedQuiz: vi.fn(),
  submitAttempt: vi.fn(),
}));

const mockedCreateQuiz = vi.mocked(createQuiz);
const mockedGetPublishedQuiz = vi.mocked(getPublishedQuiz);
const mockedSubmitAttempt = vi.mocked(submitAttempt);

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * JSON本文を持つRequestを生成する。
 */
function createJsonRequest(url: string, method: string, body: unknown): Request {
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

/**
 * 動的ルートが受け取るparamsオブジェクトを生成する。
 */
function createRouteParams(quizId: string): { params: Promise<{ quizId: string }> } {
  return {
    params: Promise.resolve({ quizId }),
  };
}

describe("POST /api/quizzes", () => {
  test("必須項目が不足している場合は400を返す", async () => {
    const request = createJsonRequest("http://localhost/api/quizzes", "POST", {
      title: "クイズ",
      authorUserId: "user-1",
    });

    const response = await postQuizzes(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "title, authorUserId, questions は必須です。",
    });
    expect(mockedCreateQuiz).not.toHaveBeenCalled();
  });

  test("作問成功時は201と作成結果を返す", async () => {
    mockedCreateQuiz.mockResolvedValue({
      quizId: "quiz-1",
      versionNo: 1,
    });

    const request = createJsonRequest("http://localhost/api/quizzes", "POST", {
      title: "都道府県クイズ",
      description: "説明",
      authorUserId: "user-1",
      questions: [
        {
          body: "設問1",
          choices: [
            { body: "A", isCorrect: true },
            { body: "B", isCorrect: false },
          ],
        },
      ],
    });

    const response = await postQuizzes(request);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      quizId: "quiz-1",
      versionNo: 1,
    });
    expect(mockedCreateQuiz).toHaveBeenCalledWith({
      title: "都道府県クイズ",
      description: "説明",
      authorUserId: "user-1",
      questions: [
        {
          body: "設問1",
          choices: [
            { body: "A", isCorrect: true },
            { body: "B", isCorrect: false },
          ],
        },
      ],
    });
  });

  test("例外発生時は500とエラーメッセージを返す", async () => {
    mockedCreateQuiz.mockRejectedValue(new Error("DBエラー"));

    const request = createJsonRequest("http://localhost/api/quizzes", "POST", {
      title: "都道府県クイズ",
      authorUserId: "user-1",
      questions: [
        {
          body: "設問1",
          choices: [
            { body: "A", isCorrect: true },
            { body: "B", isCorrect: false },
          ],
        },
      ],
    });

    const response = await postQuizzes(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "DBエラー" });
  });

  test("Error以外の例外発生時は既定メッセージを返す", async () => {
    mockedCreateQuiz.mockRejectedValue("unexpected");

    const request = createJsonRequest("http://localhost/api/quizzes", "POST", {
      title: "都道府県クイズ",
      authorUserId: "user-1",
      questions: [
        {
          body: "設問1",
          choices: [
            { body: "A", isCorrect: true },
            { body: "B", isCorrect: false },
          ],
        },
      ],
    });

    const response = await postQuizzes(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "クイズ作成時にエラーが発生しました。",
    });
  });
});

describe("GET /api/quizzes/[quizId]", () => {
  test("公開中クイズが見つからない場合は404を返す", async () => {
    mockedGetPublishedQuiz.mockResolvedValue(null);

    const response = await getQuizById(new Request("http://localhost"), createRouteParams("quiz-404"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "公開中クイズが見つかりません。",
    });
    expect(mockedGetPublishedQuiz).toHaveBeenCalledWith("quiz-404");
  });

  test("公開中クイズ取得成功時は200でクイズ情報を返す", async () => {
    mockedGetPublishedQuiz.mockResolvedValue({
      quizId: "quiz-1",
      title: "都道府県クイズ",
      description: null,
      quizVersionId: "version-1",
      versionNo: 1,
      questions: [
        {
          id: "q1",
          orderNo: 1,
          body: "設問1",
          questionType: "single",
          choices: [
            { id: "c1", orderNo: 1, body: "A" },
            { id: "c2", orderNo: 2, body: "B" },
          ],
        },
      ],
    });

    const response = await getQuizById(new Request("http://localhost"), createRouteParams("quiz-1"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      quizId: "quiz-1",
      title: "都道府県クイズ",
      description: null,
      quizVersionId: "version-1",
      versionNo: 1,
      questions: [
        {
          id: "q1",
          orderNo: 1,
          body: "設問1",
          questionType: "single",
          choices: [
            { id: "c1", orderNo: 1, body: "A" },
            { id: "c2", orderNo: 2, body: "B" },
          ],
        },
      ],
    });
  });

  test("例外発生時は500とエラーメッセージを返す", async () => {
    mockedGetPublishedQuiz.mockRejectedValue(new Error("DB接続失敗"));

    const response = await getQuizById(new Request("http://localhost"), createRouteParams("quiz-1"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "DB接続失敗" });
  });
});

describe("POST /api/quizzes/[quizId]/attempts", () => {
  test("回答データが不足している場合は400を返す", async () => {
    const request = createJsonRequest("http://localhost/api/quizzes/quiz-1/attempts", "POST", {
      userId: "user-1",
    });

    const response = await postAttempt(request, createRouteParams("quiz-1"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "selectedChoiceIdsByQuestionId は必須です。",
    });
    expect(mockedSubmitAttempt).not.toHaveBeenCalled();
  });

  test("判定成功時は201と判定結果を返す", async () => {
    mockedSubmitAttempt.mockResolvedValue({
      attemptId: "attempt-1",
      score: 100,
      correctCount: 1,
      totalCount: 1,
      answers: [
        {
          questionId: "q1",
          selectedChoiceId: "c1",
          isCorrect: true,
        },
      ],
    });

    const request = createJsonRequest("http://localhost/api/quizzes/quiz-1/attempts", "POST", {
      selectedChoiceIdsByQuestionId: {
        q1: "c1",
      },
      userId: "user-1",
    });

    const response = await postAttempt(request, createRouteParams("quiz-1"));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      attemptId: "attempt-1",
      score: 100,
      correctCount: 1,
      totalCount: 1,
      answers: [
        {
          questionId: "q1",
          selectedChoiceId: "c1",
          isCorrect: true,
        },
      ],
    });
    expect(mockedSubmitAttempt).toHaveBeenCalledWith({
      quizId: "quiz-1",
      selectedChoiceIdsByQuestionId: {
        q1: "c1",
      },
      userId: "user-1",
    });
  });

  test("例外発生時は500とエラーメッセージを返す", async () => {
    mockedSubmitAttempt.mockRejectedValue(new Error("採点エラー"));

    const request = createJsonRequest("http://localhost/api/quizzes/quiz-1/attempts", "POST", {
      selectedChoiceIdsByQuestionId: {
        q1: "c1",
      },
    });

    const response = await postAttempt(request, createRouteParams("quiz-1"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "採点エラー" });
  });
});
