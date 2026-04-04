import { getAppSession } from "@/auth"
import { RegisterForm } from "@/app/register/register-form"
import { redirect } from "next/navigation"

/**
 * 新規登録ページを表示する。
 */
export default async function RegisterPage() {
  const session = await getAppSession()
  if (session?.user?.id) {
    redirect("/")
  }

  return (
    <main className="stack">
      <RegisterForm />
    </main>
  )
}
