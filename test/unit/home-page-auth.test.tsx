/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import HomePage from "@/app/page";
import { getAppSession } from "@/auth";

vi.mock("@/auth", () => ({
  getAppSession: vi.fn()
}));

const mockLogoutButton = vi.fn(() => {
  return <button type="button">ログアウト</button>;
});

vi.mock("@/app/logout-button", () => ({
  LogoutButton: () => mockLogoutButton()
}));

const mockedGetAppSession = vi.mocked(getAppSession);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("HomePage", () => {
  test("未ログイン時はログイン導線を表示する", async () => {
    mockedGetAppSession.mockResolvedValue(null);

    const pageElement = await HomePage();
    render(pageElement);

    const loginLink = screen.getByRole("link", { name: "ログイン" });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: "クイズを作成する" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ログアウト" })).not.toBeInTheDocument();
    expect(mockLogoutButton).not.toHaveBeenCalled();
  });

  test("ログイン時は作問導線とログアウトボタンを表示する", async () => {
    mockedGetAppSession.mockResolvedValue({
      user: {
        id: "user-1",
        name: "user-1",
        email: null,
        image: null
      },
      expires: "9999-12-31T23:59:59.999Z"
    });

    const pageElement = await HomePage();
    render(pageElement);

    const createLink = screen.getByRole("link", { name: "クイズを作成する" });
    expect(createLink).toBeInTheDocument();
    expect(createLink).toHaveAttribute("href", "/create");
    expect(screen.getByRole("button", { name: "ログアウト" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "ログイン" })).not.toBeInTheDocument();
    expect(mockLogoutButton).toHaveBeenCalledTimes(1);
  });
});
