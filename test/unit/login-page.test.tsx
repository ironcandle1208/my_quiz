/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import LoginPage from "@/app/login/page";
import { getAppSession } from "@/auth";
import { redirect } from "next/navigation";

vi.mock("@/auth", () => ({
  getAppSession: vi.fn()
}));

const mockLoginForm = vi.fn((props: { callbackUrl: string; initialErrorCode: string | null }) => {
  return (
    <div data-testid="login-form">
      callbackUrl: {props.callbackUrl}, error: {props.initialErrorCode ?? "none"}
    </div>
  );
});

vi.mock("@/app/login/login-form", () => ({
  LoginForm: (props: { callbackUrl: string; initialErrorCode: string | null }) => mockLoginForm(props)
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn()
}));

const mockedGetAppSession = vi.mocked(getAppSession);
const mockedRedirect = vi.mocked(redirect);

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetAppSession.mockResolvedValue(null);
  mockedRedirect.mockImplementation(() => {
    throw new Error("REDIRECT");
  });
});

afterEach(() => {
  cleanup();
});

/**
 * LoginPage の props 形式を生成する。
 */
function createLoginPageProps(params: { callbackUrl?: string; error?: string }): {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
} {
  return {
    searchParams: Promise.resolve(params)
  };
}

describe("LoginPage", () => {
  test("ログイン済みの場合は /create へリダイレクトする", async () => {
    mockedGetAppSession.mockResolvedValue({
      user: {
        id: "user-1",
        name: "user-1",
        email: null,
        image: null
      },
      expires: "9999-12-31T23:59:59.999Z"
    });

    await expect(LoginPage(createLoginPageProps({}))).rejects.toThrowError("REDIRECT");

    expect(mockedRedirect).toHaveBeenCalledWith("/create");
    expect(mockLoginForm).not.toHaveBeenCalled();
  });

  test("未ログインで有効な callbackUrl 指定時はそのままフォームへ渡す", async () => {
    const pageElement = await LoginPage(
      createLoginPageProps({
        callbackUrl: "/quiz/quiz-1",
        error: "CredentialsSignin"
      })
    );
    render(pageElement);

    expect(mockedRedirect).not.toHaveBeenCalled();
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(mockLoginForm).toHaveBeenCalledWith({
      callbackUrl: "/quiz/quiz-1",
      initialErrorCode: "CredentialsSignin"
    });
  });

  test("未ログインで外部 callbackUrl 指定時は /create をフォームへ渡す", async () => {
    const pageElement = await LoginPage(
      createLoginPageProps({
        callbackUrl: "https://example.com/evil"
      })
    );
    render(pageElement);

    expect(mockedRedirect).not.toHaveBeenCalled();
    expect(mockLoginForm).toHaveBeenCalledWith({
      callbackUrl: "/create",
      initialErrorCode: null
    });
  });
});
