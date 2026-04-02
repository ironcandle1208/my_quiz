/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { signOut } from "next-auth/react";
import { LogoutButton } from "@/app/logout-button";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn()
}));

const mockedSignOut = vi.mocked(signOut);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("LogoutButton", () => {
  test("クリック時に signOut を callbackUrl 付きで呼び出す", async () => {
    mockedSignOut.mockResolvedValue(undefined);

    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: "ログアウト" }));

    await waitFor(() => {
      expect(mockedSignOut).toHaveBeenCalledTimes(1);
    });
    expect(mockedSignOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });
});
