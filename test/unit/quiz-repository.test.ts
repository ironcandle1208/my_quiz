import { beforeEach, describe, expect, test, vi } from "vitest";
import { createQuiz, getPublishedQuiz, submitAttempt } from "@/lib/quiz-repository";
import { getD1Database } from "@/lib/d1";
import { createId } from "@/lib/id";
import type { CreateQuizInput } from "@/lib/domain";

vi.mock("@/lib/d1", () => ({
  getD1Database: vi.fn(),
}));

vi.mock("@/lib/id", () => ({
  createId: vi.fn(),
}));

type MockStatement = D1PreparedStatement & {
  query: string;
  boundValues: unknown[];
};

type MockDbOptions = {
  firstResolver?: (query: string, boundValues: unknown[]) => unknown;
  allResolver?: (query: string, boundValues: unknown[]) => unknown[];
  batchError?: Error;
};

/**
 * D1Database のモックを構築し、prepare/batch の呼び出し内容を追跡できるようにする。
 */
function createMockD1Database(options: MockDbOptions = {}): {
  db: D1Database;
  preparedStatements: MockStatement[];
  batchCalls: MockStatement[][];
} {
  const preparedStatements: MockStatement[] = [];
  const batchCalls: MockStatement[][] = [];
  const { firstResolver, allResolver, batchError } = options;

  const db: D1Database = {
    prepare(query: string): D1PreparedStatement {
      const statement: MockStatement = {
        query,
        boundValues: [],
        bind(...values: unknown[]) {
          statement.boundValues = values;
          return statement;
        },
        async first<T = Record<string, unknown>>() {
          const row = firstResolver ? firstResolver(query, statement.boundValues) : null;
          return (row ?? null) as T | null;
        },
        async run<T = Record<string, unknown>>() {
          return {
            results: [] as T[],
            success: true,
            meta: {},
          };
        },
        async all<T = Record<string, unknown>>() {
          const rows = allResolver ? allResolver(query, statement.boundValues) : [];
          return {
            results: rows as T[],
            success: true,
            meta: {},
          };
        },
      };

      preparedStatements.push(statement);
      return statement;
    },
    async batch<T = D1Result>(statements: D1PreparedStatement[]) {
      // batch には createQuiz/submitAttempt が組み立てたステートメント配列が渡される
      batchCalls.push(statements as MockStatement[]);
      if (batchError) {
        throw batchError;
      }
      return [] as T[];
    },
  };

  return { db, preparedStatements, batchCalls };
}

/**
 * 指定した SQL 断片を含むステートメントを 1 件取得する。
 */
function getStatementBySqlFragment(
  statements: MockStatement[],
  sqlFragment: string,
): MockStatement {
  const statement = statements.find((item) => item.query.includes(sqlFragment));
  if (!statement) {
    throw new Error(`SQL を含むステートメントが見つかりません: ${sqlFragment}`);
  }
  return statement;
}

const mockedGetD1Database = vi.mocked(getD1Database);
const mockedCreateId = vi.mocked(createId);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createQuiz", () => {
  test("公開済みクイズを作成し、trim済みの値でINSERTする", async () => {
    const { db, batchCalls } = createMockD1Database();
    mockedGetD1Database.mockReturnValue(db);
    mockedCreateId
      .mockReturnValueOnce("quiz-1")
      .mockReturnValueOnce("version-1")
      .mockReturnValueOnce("question-1")
      .mockReturnValueOnce("choice-1")
      .mockReturnValueOnce("choice-2")
      .mockReturnValueOnce("choice-3")
      .mockReturnValueOnce("choice-4");

    const input: CreateQuizInput = {
      title: "  サンプルクイズ  ",
      description: "  説明です  ",
      authorUserId: "user-1",
      questions: [
        {
          body: "  設問1  ",
          choices: [
            { body: "  選択肢A  ", isCorrect: true },
            { body: "  選択肢B  ", isCorrect: false },
            { body: "  選択肢C  ", isCorrect: false },
            { body: "  選択肢D  ", isCorrect: false },
          ],
        },
      ],
    };

    const result = await createQuiz(input);

    expect(result).toEqual({ quizId: "quiz-1", versionNo: 1 });
    expect(batchCalls).toHaveLength(1);
    expect(batchCalls[0]).toHaveLength(7);

    const quizStatement = getStatementBySqlFragment(batchCalls[0], "INSERT INTO quizzes");
    expect(quizStatement.boundValues).toEqual(["quiz-1", "user-1", "サンプルクイズ", "説明です"]);

    const versionStatement = getStatementBySqlFragment(batchCalls[0], "INSERT INTO quiz_versions");
    expect(versionStatement.boundValues).toEqual(["version-1", "quiz-1", 1]);

    const questionStatement = getStatementBySqlFragment(batchCalls[0], "INSERT INTO questions");
    expect(questionStatement.boundValues).toEqual(["question-1", "version-1", 1, "設問1"]);

    const choiceStatements = batchCalls[0].filter((statement) =>
      statement.query.includes("INSERT INTO choices"),
    );
    expect(choiceStatements).toHaveLength(4);
    expect(choiceStatements[0].boundValues).toEqual(["choice-1", "question-1", 1, "選択肢A", 1]);
    expect(choiceStatements[1].boundValues).toEqual(["choice-2", "question-1", 2, "選択肢B", 0]);
    expect(choiceStatements[2].boundValues).toEqual(["choice-3", "question-1", 3, "選択肢C", 0]);
    expect(choiceStatements[3].boundValues).toEqual(["choice-4", "question-1", 4, "選択肢D", 0]);
  });

  test("入力バリデーションエラー時は DB 書き込み処理を実行しない", async () => {
    const { db, batchCalls } = createMockD1Database();
    mockedGetD1Database.mockReturnValue(db);

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

    await expect(createQuiz(input)).rejects.toThrowError("クイズタイトルは必須です。");
    expect(mockedGetD1Database).not.toHaveBeenCalled();
    expect(mockedCreateId).not.toHaveBeenCalled();
    expect(batchCalls).toHaveLength(0);
  });

  test("DB の batch が失敗した場合は例外を送出する", async () => {
    const { db, batchCalls } = createMockD1Database({
      batchError: new Error("D1 書き込み失敗"),
    });
    mockedGetD1Database.mockReturnValue(db);
    mockedCreateId
      .mockReturnValueOnce("quiz-1")
      .mockReturnValueOnce("version-1")
      .mockReturnValueOnce("question-1")
      .mockReturnValueOnce("choice-1")
      .mockReturnValueOnce("choice-2")
      .mockReturnValueOnce("choice-3")
      .mockReturnValueOnce("choice-4");

    const input: CreateQuizInput = {
      title: "サンプルクイズ",
      description: "説明です",
      authorUserId: "user-1",
      questions: [
        {
          body: "設問1",
          choices: [
            { body: "選択肢A", isCorrect: true },
            { body: "選択肢B", isCorrect: false },
            { body: "選択肢C", isCorrect: false },
            { body: "選択肢D", isCorrect: false },
          ],
        },
      ],
    };

    await expect(createQuiz(input)).rejects.toThrowError("D1 書き込み失敗");
    expect(batchCalls).toHaveLength(1);
  });
});

describe("getPublishedQuiz", () => {
  test("公開中クイズが見つからない場合は null を返す", async () => {
    const { db } = createMockD1Database({
      firstResolver: () => null,
    });
    mockedGetD1Database.mockReturnValue(db);

    const result = await getPublishedQuiz("quiz-404");

    expect(result).toBeNull();
  });

  test("公開中クイズを取得して設問と選択肢を整形して返す", async () => {
    const { db } = createMockD1Database({
      firstResolver: (query) => {
        if (query.includes("FROM quizzes q")) {
          return {
            quiz_id: "quiz-1",
            title: "都道府県クイズ",
            description: null,
            quiz_version_id: "version-2",
            version_no: 2,
          };
        }
        return null;
      },
      allResolver: (query) => {
        if (query.includes("FROM questions")) {
          return [
            { question_id: "q1", order_no: 1, body: "北海道の県庁所在地は？", question_type: "single" },
            { question_id: "q2", order_no: 2, body: "沖縄県の県庁所在地は？", question_type: "single" },
          ];
        }

        if (query.includes("FROM choices c")) {
          return [
            { choice_id: "c2", question_id: "q1", order_no: 2, body: "函館市" },
            { choice_id: "c1", question_id: "q1", order_no: 1, body: "札幌市" },
            { choice_id: "c4", question_id: "q2", order_no: 2, body: "浦添市" },
            { choice_id: "c3", question_id: "q2", order_no: 1, body: "那覇市" },
          ];
        }

        return [];
      },
    });
    mockedGetD1Database.mockReturnValue(db);

    const result = await getPublishedQuiz("quiz-1");

    expect(result).toEqual({
      quizId: "quiz-1",
      title: "都道府県クイズ",
      description: null,
      quizVersionId: "version-2",
      versionNo: 2,
      questions: [
        {
          id: "q1",
          orderNo: 1,
          body: "北海道の県庁所在地は？",
          questionType: "single",
          choices: [
            { id: "c1", orderNo: 1, body: "札幌市" },
            { id: "c2", orderNo: 2, body: "函館市" },
          ],
        },
        {
          id: "q2",
          orderNo: 2,
          body: "沖縄県の県庁所在地は？",
          questionType: "single",
          choices: [
            { id: "c3", orderNo: 1, body: "那覇市" },
            { id: "c4", orderNo: 2, body: "浦添市" },
          ],
        },
      ],
    });
  });

  test("ヘッダ取得クエリで失敗した場合は例外を送出する", async () => {
    const { db } = createMockD1Database({
      firstResolver: () => {
        throw new Error("D1 読み取り失敗");
      },
    });
    mockedGetD1Database.mockReturnValue(db);

    await expect(getPublishedQuiz("quiz-1")).rejects.toThrowError("D1 読み取り失敗");
  });

  test("設問取得クエリで失敗した場合は例外を送出する", async () => {
    const { db } = createMockD1Database({
      firstResolver: (query) => {
        if (query.includes("FROM quizzes q")) {
          return {
            quiz_id: "quiz-1",
            title: "都道府県クイズ",
            description: null,
            quiz_version_id: "version-1",
            version_no: 1,
          };
        }
        return null;
      },
      allResolver: (query) => {
        if (query.includes("FROM questions")) {
          throw new Error("設問取得失敗");
        }
        return [];
      },
    });
    mockedGetD1Database.mockReturnValue(db);

    await expect(getPublishedQuiz("quiz-1")).rejects.toThrowError("設問取得失敗");
  });
});

describe("submitAttempt", () => {
  test("公開中クイズが見つからない場合はエラー", async () => {
    const { db, batchCalls } = createMockD1Database({
      firstResolver: () => null,
    });
    mockedGetD1Database.mockReturnValue(db);

    await expect(
      submitAttempt({
        quizId: "quiz-404",
        selectedChoiceIdsByQuestionId: {},
      }),
    ).rejects.toThrowError("公開中クイズが見つかりません。");
    expect(batchCalls).toHaveLength(0);
  });

  test("回答を採点し、attempt と attempt_answers を保存する", async () => {
    const { db, batchCalls } = createMockD1Database({
      firstResolver: (query) => {
        if (query.includes("FROM quizzes q")) {
          return {
            quiz_id: "quiz-1",
            title: "都道府県クイズ",
            description: "説明",
            quiz_version_id: "version-1",
            version_no: 1,
          };
        }
        return null;
      },
      allResolver: (query) => {
        if (query.includes("c.is_correct AS is_correct")) {
          return [
            { question_id: "q1", choice_id: "c1", is_correct: 1 },
            { question_id: "q1", choice_id: "c2", is_correct: 0 },
            { question_id: "q2", choice_id: "c3", is_correct: 0 },
            { question_id: "q2", choice_id: "c4", is_correct: 1 },
          ];
        }

        if (query.includes("FROM questions")) {
          return [
            { question_id: "q1", order_no: 1, body: "北海道の県庁所在地は？", question_type: "single" },
            { question_id: "q2", order_no: 2, body: "沖縄県の県庁所在地は？", question_type: "single" },
          ];
        }

        if (query.includes("FROM choices c")) {
          return [
            { choice_id: "c1", question_id: "q1", order_no: 1, body: "札幌市" },
            { choice_id: "c2", question_id: "q1", order_no: 2, body: "函館市" },
            { choice_id: "c3", question_id: "q2", order_no: 1, body: "那覇市" },
            { choice_id: "c4", question_id: "q2", order_no: 2, body: "浦添市" },
          ];
        }

        return [];
      },
    });
    mockedGetD1Database.mockReturnValue(db);
    mockedCreateId
      .mockReturnValueOnce("attempt-1")
      .mockReturnValueOnce("answer-1")
      .mockReturnValueOnce("answer-2");

    const result = await submitAttempt({
      quizId: "quiz-1",
      selectedChoiceIdsByQuestionId: {
        q1: "c1",
        q2: "c3",
      },
    });

    expect(result).toEqual({
      attemptId: "attempt-1",
      score: 50,
      correctCount: 1,
      totalCount: 2,
      answers: [
        { questionId: "q1", selectedChoiceId: "c1", isCorrect: true },
        { questionId: "q2", selectedChoiceId: "c3", isCorrect: false },
      ],
    });

    expect(batchCalls).toHaveLength(1);
    expect(batchCalls[0]).toHaveLength(3);

    const attemptStatement = getStatementBySqlFragment(batchCalls[0], "INSERT INTO attempts");
    expect(attemptStatement.boundValues).toEqual(["attempt-1", "version-1", null, 50, 1, 2]);

    const answerStatements = batchCalls[0].filter((statement) =>
      statement.query.includes("INSERT INTO attempt_answers"),
    );
    expect(answerStatements).toHaveLength(2);
    expect(answerStatements[0].boundValues).toEqual(["answer-1", "attempt-1", "q1", "c1", 1]);
    expect(answerStatements[1].boundValues).toEqual(["answer-2", "attempt-1", "q2", "c3", 0]);
  });

  test("採点前バリデーションで失敗した場合は保存処理を実行しない", async () => {
    const { db, batchCalls } = createMockD1Database({
      firstResolver: (query) => {
        if (query.includes("FROM quizzes q")) {
          return {
            quiz_id: "quiz-1",
            title: "都道府県クイズ",
            description: "説明",
            quiz_version_id: "version-1",
            version_no: 1,
          };
        }
        return null;
      },
      allResolver: (query) => {
        if (query.includes("c.is_correct AS is_correct")) {
          return [
            { question_id: "q1", choice_id: "c1", is_correct: 1 },
            { question_id: "q1", choice_id: "c2", is_correct: 0 },
            { question_id: "q2", choice_id: "c3", is_correct: 0 },
            { question_id: "q2", choice_id: "c4", is_correct: 1 },
          ];
        }

        if (query.includes("FROM questions")) {
          return [
            { question_id: "q1", order_no: 1, body: "北海道の県庁所在地は？", question_type: "single" },
            { question_id: "q2", order_no: 2, body: "沖縄県の県庁所在地は？", question_type: "single" },
          ];
        }

        if (query.includes("FROM choices c")) {
          return [
            { choice_id: "c1", question_id: "q1", order_no: 1, body: "札幌市" },
            { choice_id: "c2", question_id: "q1", order_no: 2, body: "函館市" },
            { choice_id: "c3", question_id: "q2", order_no: 1, body: "那覇市" },
            { choice_id: "c4", question_id: "q2", order_no: 2, body: "浦添市" },
          ];
        }

        return [];
      },
    });
    mockedGetD1Database.mockReturnValue(db);

    await expect(
      submitAttempt({
        quizId: "quiz-1",
        selectedChoiceIdsByQuestionId: {
          q1: "c1",
        },
      }),
    ).rejects.toThrowError("未回答の設問があります。");
    expect(batchCalls).toHaveLength(0);
  });

  test("attempt 保存時の batch が失敗した場合は例外を送出する", async () => {
    const { db, batchCalls } = createMockD1Database({
      batchError: new Error("attempt 保存失敗"),
      firstResolver: (query) => {
        if (query.includes("FROM quizzes q")) {
          return {
            quiz_id: "quiz-1",
            title: "都道府県クイズ",
            description: "説明",
            quiz_version_id: "version-1",
            version_no: 1,
          };
        }
        return null;
      },
      allResolver: (query) => {
        if (query.includes("c.is_correct AS is_correct")) {
          return [
            { question_id: "q1", choice_id: "c1", is_correct: 1 },
            { question_id: "q1", choice_id: "c2", is_correct: 0 },
            { question_id: "q2", choice_id: "c3", is_correct: 0 },
            { question_id: "q2", choice_id: "c4", is_correct: 1 },
          ];
        }

        if (query.includes("FROM questions")) {
          return [
            { question_id: "q1", order_no: 1, body: "北海道の県庁所在地は？", question_type: "single" },
            { question_id: "q2", order_no: 2, body: "沖縄県の県庁所在地は？", question_type: "single" },
          ];
        }

        if (query.includes("FROM choices c")) {
          return [
            { choice_id: "c1", question_id: "q1", order_no: 1, body: "札幌市" },
            { choice_id: "c2", question_id: "q1", order_no: 2, body: "函館市" },
            { choice_id: "c3", question_id: "q2", order_no: 1, body: "那覇市" },
            { choice_id: "c4", question_id: "q2", order_no: 2, body: "浦添市" },
          ];
        }

        return [];
      },
    });
    mockedGetD1Database.mockReturnValue(db);
    mockedCreateId
      .mockReturnValueOnce("attempt-1")
      .mockReturnValueOnce("answer-1")
      .mockReturnValueOnce("answer-2");

    await expect(
      submitAttempt({
        quizId: "quiz-1",
        selectedChoiceIdsByQuestionId: {
          q1: "c1",
          q2: "c4",
        },
      }),
    ).rejects.toThrowError("attempt 保存失敗");
    expect(batchCalls).toHaveLength(1);
  });
});
