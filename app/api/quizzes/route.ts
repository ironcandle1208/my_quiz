import { NextResponse } from "next/server";
import type { CreateQuizInput } from "@/lib/domain";
import { createQuiz } from "@/lib/quiz-repository";
import { getAppSession } from "@/auth";

/**
 * 作問入力を受け取り、公開済みクイズを新規作成する。
 */
export async function POST(request: Request) {
  try {
    const session = await getAppSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }

    const body = (await request.json()) as Partial<Omit<CreateQuizInput, "authorUserId">>;

    if (!body.title || !body.questions) {
      return NextResponse.json({ error: "title, questions は必須です。" }, { status: 400 });
    }

    const result = await createQuiz({
      title: body.title,
      description: body.description,
      authorUserId: session.user.id,
      questions: body.questions
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "クイズ作成時にエラーが発生しました。"
      },
      { status: 500 }
    );
  }
}
