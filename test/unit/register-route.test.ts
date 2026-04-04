import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST as postRegister } from "@/app/api/register/route";
import { registerCredentialUser } from "@/lib/credential-user-store";

vi.mock("@/lib/credential-user-store", () => ({
  registerCredentialUser: vi.fn()
}));

const mockedRegisterCredentialUser = vi.mocked(registerCredentialUser);

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
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

/**
 * 不正なJSON本文を持つRequestを生成する。
 */
function createInvalidJsonRequest(url: string, method: string): Request {
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json"
    },
    body: "{"
  });
}

describe("POST /api/register", () => {
  test("登録成功時は201で作成ユーザーを返す", async () => {
    mockedRegisterCredentialUser.mockReturnValue({
      ok: true,
      user: {
        id: "user-new-user",
        username: "new-user",
        password: "new-pass"
      }
    });

    const response = await postRegister(
      createJsonRequest("http://localhost/api/register", "POST", {
        username: "new-user",
        password: "new-pass"
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: "user-new-user",
      username: "new-user"
    });
    expect(mockedRegisterCredentialUser).toHaveBeenCalledWith({
      username: "new-user",
      password: "new-pass"
    });
  });

  test("ユーザー名未指定時は400を返す", async () => {
    mockedRegisterCredentialUser.mockReturnValue({
      ok: false,
      reason: "empty_username"
    });

    const response = await postRegister(
      createJsonRequest("http://localhost/api/register", "POST", {
        username: "",
        password: "new-pass"
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "ユーザー名は必須です。"
    });
  });

  test("パスワード未指定時は400を返す", async () => {
    mockedRegisterCredentialUser.mockReturnValue({
      ok: false,
      reason: "empty_password"
    });

    const response = await postRegister(
      createJsonRequest("http://localhost/api/register", "POST", {
        username: "new-user",
        password: ""
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "パスワードは必須です。"
    });
  });

  test("重複ユーザー名時は409を返す", async () => {
    mockedRegisterCredentialUser.mockReturnValue({
      ok: false,
      reason: "duplicate_username"
    });

    const response = await postRegister(
      createJsonRequest("http://localhost/api/register", "POST", {
        username: "demo",
        password: "demo-pass"
      })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "同じユーザー名は既に登録されています。"
    });
  });

  test("不正なJSON本文時は500を返す", async () => {
    const response = await postRegister(createInvalidJsonRequest("http://localhost/api/register", "POST"));
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(500);
    expect(typeof body.error).toBe("string");
    expect(body.error && body.error.length > 0).toBe(true);
    expect(mockedRegisterCredentialUser).not.toHaveBeenCalled();
  });
});
