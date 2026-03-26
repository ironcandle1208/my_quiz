import { CreateQuizForm } from "@/app/create/create-quiz-form";

/**
 * 作問画面を表示するページ。
 */
export default function CreatePage() {
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
