"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

/**
 * 新規登録 API の失敗結果から画面表示用メッセージを生成する。
 */
function resolveRegisterErrorMessage(status: number, fallbackMessage: string): string {
  if (status === 409) {
    return "同じユーザー名は既に登録されています。"
  }
  if (status === 400) {
    return fallbackMessage || "ユーザー名とパスワードを入力してください。"
  }
  return fallbackMessage || "新規登録に失敗しました。"
}

/**
 * レスポンスJSONから error 文字列を取り出す。
 */
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown }
    return typeof body.error === "string" ? body.error : ""
  } catch {
    return ""
  }
}

/**
 * 新規登録フォームを表示し、登録成功時はトップページへ遷移する。
 */
export function RegisterForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * 入力された認証情報で新規登録し、成功時はトップページへ遷移する。
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      })

      if (!response.ok) {
        const error = await extractErrorMessage(response)
        setErrorMessage(resolveRegisterErrorMessage(response.status, error))
        return
      }

      const signInResult = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl: "/"
      })

      router.push(signInResult?.url ?? "/")
      router.refresh()
    } catch {
      setErrorMessage("新規登録に失敗しました。")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="card stack">
      <h1>新規登録</h1>
      <p className="muted">アカウントを作成してログインできます。</p>
      <form className="stack" onSubmit={handleSubmit}>
        <label className="stack">
          <span>ユーザー名</span>
          <input
            className="input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="stack">
          <span>パスワード</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "登録中..." : "登録する"}
        </button>
        {errorMessage ? <p className="result-ng">{errorMessage}</p> : null}
      </form>
      <p className="muted">
        既にアカウントをお持ちの場合は
        {" "}
        <Link className="text-link" href="/login">
          ログイン
        </Link>
      </p>
    </section>
  )
}
