/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import RegisterPage from "@/app/register/page"
import { getAppSession } from "@/auth"
import { redirect } from "next/navigation"

vi.mock("@/auth", () => ({
  getAppSession: vi.fn()
}))

const mockRegisterForm = vi.fn(() => {
  return <div data-testid="register-form">register-form</div>
})

vi.mock("@/app/register/register-form", () => ({
  RegisterForm: () => mockRegisterForm()
}))

vi.mock("next/navigation", () => ({
  redirect: vi.fn()
}))

const mockedGetAppSession = vi.mocked(getAppSession)
const mockedRedirect = vi.mocked(redirect)

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetAppSession.mockResolvedValue(null)
  mockedRedirect.mockImplementation(() => {
    throw new Error("REDIRECT")
  })
})

afterEach(() => {
  cleanup()
})

describe("RegisterPage", () => {
  test("ログイン済みの場合はトップページへリダイレクトする", async () => {
    mockedGetAppSession.mockResolvedValue({
      user: {
        id: "user-1",
        name: "user-1",
        email: null,
        image: null
      },
      expires: "9999-12-31T23:59:59.999Z"
    })

    await expect(RegisterPage()).rejects.toThrowError("REDIRECT")
    expect(mockedRedirect).toHaveBeenCalledWith("/")
    expect(mockRegisterForm).not.toHaveBeenCalled()
  })

  test("未ログイン時は新規登録フォームを表示する", async () => {
    const pageElement = await RegisterPage()
    render(pageElement)

    expect(mockedRedirect).not.toHaveBeenCalled()
    expect(screen.getByTestId("register-form")).toBeInTheDocument()
    expect(mockRegisterForm).toHaveBeenCalledTimes(1)
  })
})
