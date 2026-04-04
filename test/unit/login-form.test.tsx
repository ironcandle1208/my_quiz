/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LoginForm } from "@/app/login/login-form";
import { signIn } from "next-auth/react";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
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
});

afterEach(() => {
  cleanup();
});

/**
 * ログインフォームへ送信可能な最小入力を設定する。
 */
function fillMinimumLoginInput(): void {
  fireEvent.change(screen.getByLabelText("パスワード"), {
    target: { value: "demo-pass" }
  });
}

describe("LoginForm", () => {
  test("新規登録ページへのリンクを表示する", () => {
    render(<LoginForm callbackUrl="/create" initialErrorCode={null} />);

    const registerLink = screen.getByRole("link", { name: "新規登録" });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute("href", "/register");
  });

  test("初期エラーコードが CredentialsSignin の場合はエラーメッセージを表示する", () => {
    render(<LoginForm callbackUrl="/create" initialErrorCode="CredentialsSignin" />);

    expect(screen.getByText("ユーザー名またはパスワードが正しくありません。")).toBeInTheDocument();
  });

  test("ログイン成功時は signIn を呼び出して callbackUrl へ遷移する", async () => {
    mockedSignIn.mockResolvedValue({
      ok: true,
      error: null,
      status: 200,
      url: "/create"
    });

    render(<LoginForm callbackUrl="/create" initialErrorCode={null} />);
    fillMinimumLoginInput();

    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      expect(mockedSignIn).toHaveBeenCalledTimes(1);
    });
    expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
      username: "demo",
      password: "demo-pass",
      redirect: false,
      callbackUrl: "/create"
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/create");
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  test("ログイン失敗時はエラーメッセージを表示して遷移しない", async () => {
    mockedSignIn.mockResolvedValue({
      ok: false,
      error: "CredentialsSignin",
      status: 401,
      url: null
    });

    render(<LoginForm callbackUrl="/create" initialErrorCode={null} />);
    fillMinimumLoginInput();

    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      expect(screen.getByText("ユーザー名またはパスワードが正しくありません。")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  test("送信中はボタン文言を切り替えて無効化する", async () => {
    /**
     * signIn の完了をテスト側で制御するための完了関数。
     */
    let resolveSignIn: (value: SignInResult) => void = () => {
      throw new Error("signIn の完了関数が設定されていません。");
    };
    mockedSignIn.mockImplementation(
      () =>
        new Promise<SignInResult>((resolve) => {
          resolveSignIn = resolve;
        })
    );

    render(<LoginForm callbackUrl="/create" initialErrorCode={null} />);
    fillMinimumLoginInput();

    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "ログイン中..." })).toBeDisabled();
    });

    resolveSignIn({
      ok: true,
      error: null,
      status: 200,
      url: "/create"
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "ログイン" })).not.toBeDisabled();
    });
  });
});
