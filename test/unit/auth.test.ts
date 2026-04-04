import { beforeEach, describe, expect, test, vi } from "vitest";
import { getServerSession } from "next-auth";
import { authOptions, getAppSession } from "@/auth";

vi.mock("next-auth", async () => {
  const actual = await vi.importActual<typeof import("next-auth")>("next-auth");
  return {
    ...actual,
    getServerSession: vi.fn()
  };
});

const mockedGetServerSession = vi.mocked(getServerSession);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authOptions.callbacks", () => {
  test("jwt callback は user.id がある場合に token.userId へ保存する", async () => {
    const jwtCallback = authOptions.callbacks?.jwt;
    if (!jwtCallback) {
      throw new Error("jwt callback が未設定です。");
    }

    const token = { sub: "sub-1" };
    const result = await jwtCallback({
      token,
      user: { id: "user-1" }
    } as never);

    expect(result.userId).toBe("user-1");
  });

  test("jwt callback は user.id がない場合に既存 token.userId を維持する", async () => {
    const jwtCallback = authOptions.callbacks?.jwt;
    if (!jwtCallback) {
      throw new Error("jwt callback が未設定です。");
    }

    const token = { sub: "sub-1", userId: "persisted-user" };
    const result = await jwtCallback({
      token,
      user: undefined
    } as never);

    expect(result.userId).toBe("persisted-user");
  });

  test("session callback は token.userId を session.user.id へ復元する", async () => {
    const sessionCallback = authOptions.callbacks?.session;
    if (!sessionCallback) {
      throw new Error("session callback が未設定です。");
    }

    const session = {
      user: {
        name: "demo",
        email: null,
        image: null
      },
      expires: "9999-12-31T23:59:59.999Z"
    };
    const result = await sessionCallback({
      session,
      token: { userId: "user-2" }
    } as never);
    const userId = result.user && "id" in result.user ? result.user.id : undefined;

    expect(userId).toBe("user-2");
  });

  test("session callback は token.userId がない場合に session.user.id を変更しない", async () => {
    const sessionCallback = authOptions.callbacks?.session;
    if (!sessionCallback) {
      throw new Error("session callback が未設定です。");
    }

    const session = {
      user: {
        name: "demo",
        email: null,
        image: null
      },
      expires: "9999-12-31T23:59:59.999Z"
    };
    const result = await sessionCallback({
      session,
      token: {}
    } as never);
    const userId = result.user && "id" in result.user ? result.user.id : undefined;

    expect(userId).toBeUndefined();
  });
});

describe("getAppSession", () => {
  test("getServerSession が成功した場合は取得結果を返す", async () => {
    const session = {
      user: {
        id: "user-3",
        name: "demo-user",
        email: null,
        image: null
      },
      expires: "9999-12-31T23:59:59.999Z"
    };
    mockedGetServerSession.mockResolvedValue(session as never);

    await expect(getAppSession()).resolves.toEqual(session);
    expect(mockedGetServerSession).toHaveBeenCalledWith(authOptions);
  });

  test("getServerSession が失敗した場合は null を返す", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return;
    });
    mockedGetServerSession.mockRejectedValue(new Error("session-fetch-failed"));

    await expect(getAppSession()).resolves.toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });
});
