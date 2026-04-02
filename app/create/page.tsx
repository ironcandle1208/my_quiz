import { CreateQuizForm } from "@/app/create/create-quiz-form";
import { getAppSession } from "@/auth";
import { redirect } from "next/navigation";

/**
 * 作問画面を表示するページ。
 */
export default async function CreatePage() {
  const session = await getAppSession();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/create");
  }

  return (
    <main className="stack">
      <section className="card">
        <h1>クイズ作成</h1>
        <p className="muted">設問と選択肢を入力して公開済みクイズを作成します。</p>
      </section>
      <CreateQuizForm />
    </main>
  );
}
