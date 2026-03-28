import { describe, expect, test } from "vitest";
import {
  buildChoiceMaps,
  judgeAttemptAnswers,
  validateCreateQuizInput,
  type JudgeChoiceRow,
} from "@/lib/quiz-core";
import type { CreateQuizInput, PublishedQuizQuestion } from "@/lib/domain";

describe("validateCreateQuizInput", () => {
  test("正しい入力ならエラーにならない", () => {
    const input: CreateQuizInput = {
      title: "サンプルクイズ",
      description: "説明",
      authorUserId: "user-1",
      questions: [
        {
          body: "設問1",
          choices: [
            { body: "選択肢A", isCorrect: true },
            { body: "選択肢B", isCorrect: false },
          ],
        },
      ],
    };

    expect(() => validateCreateQuizInput(input)).not.toThrow();
  });

  test("タイトルが空ならエラー", () => {
    const input: CreateQuizInput = {
      title: "   ",
      authorUserId: "user-1",
      questions: [
        {
          body: "設問1",
          choices: [
            { body: "A", isCorrect: true },
            { body: "B", isCorrect: false },
          ],
        },
      ],
    };

    expect(() => validateCreateQuizInput(input)).toThrowError(
      "クイズタイトルは必須です。",
    );
  });

  test("正解が複数ある設問はエラー", () => {
    const input: CreateQuizInput = {
      title: "クイズ",
      authorUserId: "user-1",
      questions: [
        {
          body: "設問1",
          choices: [
            { body: "A", isCorrect: true },
            { body: "B", isCorrect: true },
          ],
        },
      ],
    };

    expect(() => validateCreateQuizInput(input)).toThrowError(
      "各設問の正解は1件だけ選択してください。",
    );
  });
});

describe("buildChoiceMaps", () => {
  test("選択肢行から正解マップと妥当選択肢集合を生成できる", () => {
    const rows: JudgeChoiceRow[] = [
      { question_id: "q1", choice_id: "c1", is_correct: 1 },
      { question_id: "q1", choice_id: "c2", is_correct: 0 },
      { question_id: "q2", choice_id: "c3", is_correct: 0 },
      { question_id: "q2", choice_id: "c4", is_correct: 1 },
    ];

    const { correctChoiceByQuestionId, validChoiceIdsByQuestionId } =
      buildChoiceMaps(rows);

    expect(correctChoiceByQuestionId.get("q1")).toBe("c1");
    expect(correctChoiceByQuestionId.get("q2")).toBe("c4");
    expect(validChoiceIdsByQuestionId.get("q1")?.has("c2")).toBe(true);
    expect(validChoiceIdsByQuestionId.get("q2")?.has("c3")).toBe(true);
  });
});

describe("judgeAttemptAnswers", () => {
  const questions: PublishedQuizQuestion[] = [
    {
      id: "q1",
      orderNo: 1,
      body: "設問1",
      questionType: "single",
      choices: [
        { id: "c1", orderNo: 1, body: "A" },
        { id: "c2", orderNo: 2, body: "B" },
      ],
    },
    {
      id: "q2",
      orderNo: 2,
      body: "設問2",
      questionType: "single",
      choices: [
        { id: "c3", orderNo: 1, body: "C" },
        { id: "c4", orderNo: 2, body: "D" },
      ],
    },
  ];

  const validChoiceIdsByQuestionId = new Map<string, Set<string>>([
    ["q1", new Set(["c1", "c2"])],
    ["q2", new Set(["c3", "c4"])],
  ]);
  const correctChoiceByQuestionId = new Map<string, string>([
    ["q1", "c1"],
    ["q2", "c4"],
  ]);

  test("回答を採点してスコアを返す", () => {
    const result = judgeAttemptAnswers(
      questions,
      {
        q1: "c1",
        q2: "c3",
      },
      validChoiceIdsByQuestionId,
      correctChoiceByQuestionId,
    );

    expect(result.correctCount).toBe(1);
    expect(result.totalCount).toBe(2);
    expect(result.score).toBe(50);
    expect(result.answers).toEqual([
      { questionId: "q1", selectedChoiceId: "c1", isCorrect: true },
      { questionId: "q2", selectedChoiceId: "c3", isCorrect: false },
    ]);
  });

  test("未回答があるとエラー", () => {
    expect(() =>
      judgeAttemptAnswers(
        questions,
        {
          q1: "c1",
        },
        validChoiceIdsByQuestionId,
        correctChoiceByQuestionId,
      ),
    ).toThrowError("未回答の設問があります。");
  });

  test("不正な選択肢IDがあるとエラー", () => {
    expect(() =>
      judgeAttemptAnswers(
        questions,
        {
          q1: "invalid",
          q2: "c4",
        },
        validChoiceIdsByQuestionId,
        correctChoiceByQuestionId,
      ),
    ).toThrowError("不正な選択肢が含まれています。");
  });
});
