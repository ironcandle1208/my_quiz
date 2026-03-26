import { NextResponse } from "next/server";
import { getPublishedQuiz } from "@/lib/quiz-repository";

export const runtime = "edge";

type QuizRouteProps = {
  params: Promise<{
    quizId: string;
  }>;
};

/**
 * 公開中クイズの問題情報を返す。
 */
export async function GET(_: Request, { params }: QuizRouteProps) {
  const { quizId } = await params;

  try {
    const quiz = await getPublishedQuiz(quizId);
    if (!quiz) {
      return NextResponse.json({ error: "公開中クイズが見つかりません。" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "クイズ取得時にエラーが発生しました。"
      },
      { status: 500 }
    );
  }
}
