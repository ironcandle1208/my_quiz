import type { AttemptAnswerResult, CreateQuizInput, PublishedQuizQuestion } from "@/lib/domain";

export type JudgeChoiceRow = {
  choice_id: string;
  question_id: string;
  is_correct: number;
};

/**
 * 作問入力の妥当性を検証する。
 */
export function validateCreateQuizInput(input: CreateQuizInput): void {
  if (!input.title.trim()) {
    throw new Error("クイズタイトルは必須です。");
  }

  if (input.questions.length === 0) {
    throw new Error("設問を1件以上追加してください。");
  }

  for (const question of input.questions) {
    if (!question.body.trim()) {
      throw new Error("設問本文は必須です。");
    }

    if (question.choices.length < 2) {
      throw new Error("選択肢は各設問で2件以上必要です。");
    }

    const correctCount = question.choices.filter((choice) => choice.isCorrect).length;
    if (correctCount !== 1) {
      throw new Error("各設問の正解は1件だけ選択してください。");
    }

    for (const choice of question.choices) {
      if (!choice.body.trim()) {
        throw new Error("選択肢本文は必須です。");
      }
    }
  }
}

/**
 * 判定用の選択肢データから、妥当選択肢集合と正解選択肢マップを生成する。
 */
export function buildChoiceMaps(rows: JudgeChoiceRow[]): {
  correctChoiceByQuestionId: Map<string, string>;
  validChoiceIdsByQuestionId: Map<string, Set<string>>;
} {
  const correctChoiceByQuestionId = new Map<string, string>();
  const validChoiceIdsByQuestionId = new Map<string, Set<string>>();

  for (const row of rows) {
    const validSet = validChoiceIdsByQuestionId.get(row.question_id) ?? new Set<string>();
    validSet.add(row.choice_id);
    validChoiceIdsByQuestionId.set(row.question_id, validSet);

    if (row.is_correct === 1) {
      correctChoiceByQuestionId.set(row.question_id, row.choice_id);
    }
  }

  return { correctChoiceByQuestionId, validChoiceIdsByQuestionId };
}

/**
 * 回答内容を正誤判定し、採点結果を返す。
 */
export function judgeAttemptAnswers(
  questions: PublishedQuizQuestion[],
  selectedChoiceIdsByQuestionId: Record<string, string>,
  validChoiceIdsByQuestionId: Map<string, Set<string>>,
  correctChoiceByQuestionId: Map<string, string>
): {
  answers: AttemptAnswerResult[];
  correctCount: number;
  totalCount: number;
  score: number;
} {
  const answers: AttemptAnswerResult[] = [];

  for (const question of questions) {
    const selectedChoiceId = selectedChoiceIdsByQuestionId[question.id];
    if (!selectedChoiceId) {
      throw new Error("未回答の設問があります。");
    }

    if (!validChoiceIdsByQuestionId.get(question.id)?.has(selectedChoiceId)) {
      throw new Error("不正な選択肢が含まれています。");
    }

    const isCorrect = correctChoiceByQuestionId.get(question.id) === selectedChoiceId;
    answers.push({
      questionId: question.id,
      selectedChoiceId,
      isCorrect
    });
  }

  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const totalCount = questions.length;
  const score = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);

  return { answers, correctCount, totalCount, score };
}
