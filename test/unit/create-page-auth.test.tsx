/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import CreatePage from "@/app/create/page";
import { getAppSession } from "@/auth";
import { redirect } from "next/navigation";

vi.mock("@/auth", () => ({
  getAppSession: vi.fn()
}));

const mockCreateQuizForm = vi.fn(() => {
  return <div data-testid="create-quiz-form">create-quiz-form</div>;
});

vi.mock("@/app/create/create-quiz-form", () => ({
  CreateQuizForm: () => mockCreateQuizForm()
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn()
}));

const mockedGetAppSession = vi.mocked(getAppSession);
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

describe("CreatePage", () => {
  test("未ログインの場合はログインページへリダイレクトする", async () => {
    mockedGetAppSession.mockResolvedValue(null);

    await expect(CreatePage()).rejects.toThrowError("REDIRECT");

    expect(mockedRedirect).toHaveBeenCalledWith("/login?callbackUrl=/create");
    expect(mockCreateQuizForm).not.toHaveBeenCalled();
  });

  test("ログイン済みの場合は作問画面を表示する", async () => {
    mockedGetAppSession.mockResolvedValue({
      user: {
        id: "user-1",
        name: "user-1",
        email: null,
        image: null
      },
      expires: "9999-12-31T23:59:59.999Z"
    });

    const pageElement = await CreatePage();
    render(pageElement);

    expect(mockedRedirect).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "クイズ作成" })).toBeInTheDocument();
    expect(screen.getByText("設問と選択肢を入力して公開済みクイズを作成します。")).toBeInTheDocument();
    expect(screen.getByTestId("create-quiz-form")).toBeInTheDocument();
    expect(mockCreateQuizForm).toHaveBeenCalledTimes(1);
  });
});
