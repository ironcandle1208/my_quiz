/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { CreateQuizForm } from "@/app/create/create-quiz-form";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

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

/**
 * 送信可能な最小限のフォーム入力値を設定する。
 */
function fillMinimumForm(): void {
  fireEvent.change(screen.getByLabelText("タイトル"), {
    target: { value: "都道府県クイズ" },
  });

  const questionCard = screen.getByText("設問 1").closest("article");
  if (!questionCard) {
    throw new Error("設問カードが見つかりません。");
  }

  const textboxes = within(questionCard).getAllByRole("textbox");
  fireEvent.change(textboxes[0], { target: { value: "設問本文" } });
  fireEvent.change(textboxes[1], { target: { value: "選択肢A" } });
  fireEvent.change(textboxes[2], { target: { value: "選択肢B" } });
  fireEvent.change(textboxes[3], { target: { value: "選択肢C" } });
  fireEvent.change(textboxes[4], { target: { value: "選択肢D" } });
}

describe("CreateQuizForm", () => {
  test("初期表示で設問1件・選択肢4件を表示し、正解を先頭に設定する", () => {
    render(<CreateQuizForm />);

    expect(screen.getByText("設問 1")).toBeInTheDocument();
    expect(screen.queryByText("設問 2")).not.toBeInTheDocument();

    const removeQuestionButton = screen.getByRole("button", {
      name: "設問を削除",
    });
    expect(removeQuestionButton).toBeDisabled();

    expect(screen.queryByRole("button", { name: "選択肢を追加" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "選択肢を削除" })).not.toBeInTheDocument();

    const correctChoiceRadios = screen.getAllByLabelText("この選択肢を正解にする");
    expect(correctChoiceRadios).toHaveLength(4);
    expect(correctChoiceRadios[0]).toBeChecked();
    expect(correctChoiceRadios[1]).not.toBeChecked();
    expect(correctChoiceRadios[2]).not.toBeChecked();
    expect(correctChoiceRadios[3]).not.toBeChecked();
  });

  test("正解選択肢を切り替えると他の選択肢は未選択になる", () => {
    render(<CreateQuizForm />);

    const correctChoiceRadios = screen.getAllByLabelText("この選択肢を正解にする");
    fireEvent.click(correctChoiceRadios[2]);

    expect(correctChoiceRadios).toHaveLength(4);
    expect(correctChoiceRadios[2]).toBeChecked();
    expect(correctChoiceRadios[0]).not.toBeChecked();
    expect(correctChoiceRadios[1]).not.toBeChecked();
    expect(correctChoiceRadios[3]).not.toBeChecked();
  });

  test("送信成功時はAPIを呼び出してクイズ詳細ページへ遷移する", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(createFetchResponse(201, { quizId: "quiz-1", versionNo: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<CreateQuizForm />);
    fillMinimumForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: "クイズを作成して公開",
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/quizzes");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
    });

    const requestBody = JSON.parse(String(init.body)) as {
      title: string;
      description: string;
      authorUserId: string;
      questions: Array<{
        body: string;
        choices: Array<{
          body: string;
          isCorrect: boolean;
        }>;
      }>;
    };
    expect(requestBody).toEqual({
      title: "都道府県クイズ",
      description: "",
      authorUserId: "demo-user",
      questions: [
        {
          body: "設問本文",
          choices: [
            { body: "選択肢A", isCorrect: true },
            { body: "選択肢B", isCorrect: false },
            { body: "選択肢C", isCorrect: false },
            { body: "選択肢D", isCorrect: false },
          ],
        },
      ],
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/quiz/quiz-1");
    });
  });

  test("APIエラー時はエラーメッセージを表示する", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(createFetchResponse(400, { error: "title は必須です。" }));
    vi.stubGlobal("fetch", fetchMock);

    render(<CreateQuizForm />);
    fillMinimumForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: "クイズを作成して公開",
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("title は必須です。")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
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

    render(<CreateQuizForm />);
    fillMinimumForm();

    const submitButton = screen.getByRole("button", {
      name: "クイズを作成して公開",
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "作成中..." })).toBeDisabled();
    });

    if (!resolveFetch) {
      throw new Error("fetchの完了関数が設定されていません。");
    }
    const completeFetch = resolveFetch as (value: Response) => void;
    completeFetch(createFetchResponse(201, { quizId: "quiz-2", versionNo: 1 }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "クイズを作成して公開",
        }),
      ).not.toBeDisabled();
    });
  });
});
