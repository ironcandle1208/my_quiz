"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type LoginFormProps = {
  callbackUrl: string;
  initialErrorCode: string | null;
};

/**
 * Auth.js のエラーコードを画面表示向けメッセージへ変換する。
 */
function resolveLoginErrorMessage(errorCode: string | null): string {
  if (!errorCode) {
    return "";
  }

  if (errorCode === "CredentialsSignin") {
    return "ユーザー名またはパスワードが正しくありません。";
  }

  return "ログインに失敗しました。";
}

/**
 * 資格情報ログインフォームを表示し、Auth.js の signIn を実行する。
 */
export function LoginForm({ callbackUrl, initialErrorCode }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(resolveLoginErrorMessage(initialErrorCode));
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 入力値でログインを実行し、成功時は遷移する。
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result || result.error) {
        setErrorMessage(resolveLoginErrorMessage(result?.error ?? "Unknown"));
        return;
      }

      router.push(result.url ?? callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage("ログインに失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card stack">
      <h1>ログイン</h1>
      <p className="muted">作問機能の利用にはログインが必要です。</p>
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
            autoComplete="current-password"
            required
          />
        </label>
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "ログイン中..." : "ログイン"}
        </button>
        {errorMessage ? <p className="result-ng">{errorMessage}</p> : null}
      </form>
    </section>
  );
}
