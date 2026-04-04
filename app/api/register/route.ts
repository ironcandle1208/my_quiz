import { NextResponse } from "next/server"
import { registerCredentialUser } from "@/lib/credential-user-store"

type RegisterRequestBody = {
  username?: unknown
  password?: unknown
}

/**
 * リクエスト値を文字列として安全に取り出す。
 */
function toRequestString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

/**
 * 新規アカウント登録を受け付ける。
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterRequestBody
    const username = toRequestString(body.username)
    const password = toRequestString(body.password)

    const result = registerCredentialUser({ username, password })
    if (!result.ok) {
      if (result.reason === "empty_username") {
        return NextResponse.json({ error: "ユーザー名は必須です。" }, { status: 400 })
      }
      if (result.reason === "empty_password") {
        return NextResponse.json({ error: "パスワードは必須です。" }, { status: 400 })
      }
      return NextResponse.json({ error: "同じユーザー名は既に登録されています。" }, { status: 409 })
    }

    return NextResponse.json(
      {
        id: result.user.id,
        username: result.user.username
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "新規登録時にエラーが発生しました。"
      },
      { status: 500 }
    )
  }
}
