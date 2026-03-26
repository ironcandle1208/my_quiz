import { NextResponse } from "next/server";
import type { CreateQuizInput } from "@/lib/domain";
import { createQuiz } from "@/lib/quiz-repository";

export const runtime = "edge";

/**
 * 作問入力を受け取り、公開済みクイズを新規作成する。
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CreateQuizInput>;

    if (!body.title || !body.authorUserId || !body.questions) {
      return NextResponse.json({ error: "title, authorUserId, questions は必須です。" }, { status: 400 });
    }

    const result = await createQuiz({
      title: body.title,
      description: body.description,
      authorUserId: body.authorUserId,
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
