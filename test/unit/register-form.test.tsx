/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { RegisterForm } from "@/app/register/register-form";
import { signIn } from "next-auth/react";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockFetch = vi.fn();
type SignInResult = Awaited<ReturnType<typeof signIn>>;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh
  })
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn()
}));

const mockedSignIn = vi.mocked(signIn);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  cleanup();
});

/**
 * 指定内容のJSONレスポンスを生成する。
 */
function createJsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

/**
 * 登録フォームへ送信可能な最小入力を設定する。
 */
function fillMinimumRegisterInput(): void {
  fireEvent.change(screen.getByLabelText("ユーザー名"), {
    target: { value: "new-user" }
  });
  fireEvent.change(screen.getByLabelText("パスワード"), {
    target: { value: "new-pass" }
  });
}

describe("RegisterForm", () => {
  test("登録成功時は自動ログインしてトップページへ遷移する", async () => {
    mockFetch.mockResolvedValue(createJsonResponse(201, { id: "user-new-user", username: "new-user" }));
    mockedSignIn.mockResolvedValue({
      ok: true,
      error: null,
      status: 200,
      url: "/"
    });

    render(<RegisterForm />);
    fillMinimumRegisterInput();

    fireEvent.click(screen.getByRole("button", { name: "登録する" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    expect(mockFetch).toHaveBeenCalledWith("/api/register", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        username: "new-user",
        password: "new-pass"
      })
    });

    await waitFor(() => {
      expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
        username: "new-user",
        password: "new-pass",
        redirect: false,
        callbackUrl: "/"
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  test("重複ユーザー名の場合はエラーメッセージを表示する", async () => {
    mockFetch.mockResolvedValue(createJsonResponse(409, { error: "同じユーザー名は既に登録されています。" }));

    render(<RegisterForm />);
    fillMinimumRegisterInput();

    fireEvent.click(screen.getByRole("button", { name: "登録する" }));

    await waitFor(() => {
      expect(screen.getByText("同じユーザー名は既に登録されています。")).toBeInTheDocument();
    });
    expect(mockedSignIn).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  test("送信中はボタン文言を切り替えて無効化する", async () => {
    /**
     * register API の完了をテスト側で制御するための完了関数。
     */
    let resolveFetch: (value: Response) => void = () => {
      throw new Error("register API の完了関数が設定されていません。");
    };
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );
    mockedSignIn.mockResolvedValue({
      ok: true,
      error: null,
      status: 200,
      url: "/"
    });

    render(<RegisterForm />);
    fillMinimumRegisterInput();

    fireEvent.click(screen.getByRole("button", { name: "登録する" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "登録中..." })).toBeDisabled();
    });

    resolveFetch(createJsonResponse(201, { id: "user-new-user", username: "new-user" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "登録する" })).not.toBeDisabled();
    });
  });

  test("ログインページへのリンクを表示する", () => {
    render(<RegisterForm />);

    const loginLink = screen.getByRole("link", { name: "ログイン" });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
