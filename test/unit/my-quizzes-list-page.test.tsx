/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import MyQuizzesListPage from "@/app/my-quizzes/list/page";
import { getAppSession } from "@/auth";
import { getMyQuizzes } from "@/lib/quiz-repository";
import { redirect } from "next/navigation";

vi.mock("@/auth", () => ({
  getAppSession: vi.fn(),
}));

vi.mock("@/lib/quiz-repository", () => ({
  getMyQuizzes: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

const mockedGetAppSession = vi.mocked(getAppSession);
const mockedGetMyQuizzes = vi.mocked(getMyQuizzes);
const mockedRedirect = vi.mocked(redirect);

beforeEach(() => {
  vi.clearAllMocks();
  mockedRedirect.mockImplementation(() => {
    throw new Error("REDIRECT");
  });
});

afterEach(() => {
  cleanup();
});

describe("MyQuizzesListPage", () => {
  test("未ログインの場合はログインページへリダイレクトする", async () => {
    mockedGetAppSession.mockResolvedValue(null);

    await expect(MyQuizzesListPage()).rejects.toThrowError("REDIRECT");

    expect(mockedRedirect).toHaveBeenCalledWith("/login?callbackUrl=/my-quizzes/list");
    expect(mockedGetMyQuizzes).not.toHaveBeenCalled();
  });

  test("ログイン済みかつ作成クイズが0件の場合は空状態メッセージを表示する", async () => {
    mockedGetAppSession.mockResolvedValue({
      user: {
        id: "user-1",
        name: "user-1",
        email: null,
        image: null,
      },
      expires: "9999-12-31T23:59:59.999Z",
    });
    mockedGetMyQuizzes.mockResolvedValue([]);

    const pageElement = await MyQuizzesListPage();
    render(pageElement);

    expect(mockedRedirect).not.toHaveBeenCalled();
    expect(mockedGetMyQuizzes).toHaveBeenCalledWith("user-1");
    expect(screen.getByRole("heading", { name: "マイクイズ一覧" })).toBeInTheDocument();
    expect(screen.getByText("作成済みのクイズはまだありません。")).toBeInTheDocument();
  });

  test("ログイン済みで作成クイズがある場合は一覧と導線を表示する", async () => {
    mockedGetAppSession.mockResolvedValue({
      user: {
        id: "user-1",
        name: "user-1",
        email: null,
        image: null,
      },
      expires: "9999-12-31T23:59:59.999Z",
    });
    mockedGetMyQuizzes.mockResolvedValue([
      {
        quizId: "quiz-2",
        title: "都道府県クイズ",
        description: null,
        status: "published",
        latestVersionNo: 1,
        createdAt: "2026-04-01 12:34:56",
        updatedAt: "2026-04-01 12:34:56",
      },
      {
        quizId: "quiz-1",
        title: "歴史クイズ",
        description: "日本史の基礎",
        status: "published",
        latestVersionNo: 3,
        createdAt: "2026-03-20 12:34:56",
        updatedAt: "2026-03-20 12:34:56",
      },
    ]);

    const pageElement = await MyQuizzesListPage();
    render(pageElement);

    expect(screen.getByRole("heading", { name: "都道府県クイズ" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "歴史クイズ" })).toBeInTheDocument();

    const quizLinks = screen.getAllByRole("link", { name: "クイズを開く" });
    expect(quizLinks).toHaveLength(2);
    expect(quizLinks[0]).toHaveAttribute("href", "/quiz/quiz-2");
    expect(quizLinks[1]).toHaveAttribute("href", "/quiz/quiz-1");
  });
});
