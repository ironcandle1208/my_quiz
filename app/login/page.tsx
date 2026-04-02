import { getAppSession } from "@/auth";
import { LoginForm } from "@/app/login/login-form";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
};

/**
 * callbackUrl をアプリ内パスに制限して返す。
 */
function sanitizeCallbackUrl(rawCallbackUrl: string | undefined): string {
  if (!rawCallbackUrl || !rawCallbackUrl.startsWith("/")) {
    return "/create";
  }
  return rawCallbackUrl;
}

/**
 * ログインページを表示する。
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getAppSession();
  if (session?.user?.id) {
    redirect("/create");
  }

  const params = await searchParams;
  const callbackUrl = sanitizeCallbackUrl(params.callbackUrl);

  return (
    <main className="stack">
      <LoginForm callbackUrl={callbackUrl} initialErrorCode={params.error ?? null} />
    </main>
  );
}
