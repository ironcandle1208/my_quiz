import { NextResponse } from "next/server";
import type { SubmitAttemptInput } from "@/lib/domain";
import { submitAttempt } from "@/lib/quiz-repository";

export const runtime = "edge";

type AttemptRouteProps = {
  params: Promise<{
    quizId: string;
  }>;
};

/**
 * 回答を受け取り、正誤判定を実行して結果を返す。
 */
export async function POST(request: Request, { params }: AttemptRouteProps) {
  try {
    const { quizId } = await params;
    const body = (await request.json()) as Partial<SubmitAttemptInput>;

    if (!body.selectedChoiceIdsByQuestionId) {
      return NextResponse.json({ error: "selectedChoiceIdsByQuestionId は必須です。" }, { status: 400 });
    }

    const result = await submitAttempt({
      quizId,
      selectedChoiceIdsByQuestionId: body.selectedChoiceIdsByQuestionId,
      userId: body.userId
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "正誤判定時にエラーが発生しました。"
      },
      { status: 500 }
    );
  }
}
