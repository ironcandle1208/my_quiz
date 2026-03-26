import { getD1Database } from "@/lib/d1";
import { createId } from "@/lib/id";
import type {
  AttemptAnswerResult,
  AttemptResult,
  CreateQuizInput,
  PublishedQuiz,
  PublishedQuizChoice,
  PublishedQuizQuestion,
  SubmitAttemptInput
} from "@/lib/domain";

type QuizHeaderRow = {
  quiz_id: string;
  title: string;
  description: string | null;
  quiz_version_id: string;
  version_no: number;
};

type QuestionRow = {
  question_id: string;
  order_no: number;
  body: string;
  question_type: "single";
};

type ChoiceRow = {
  choice_id: string;
  question_id: string;
  order_no: number;
  body: string;
};

type JudgeChoiceRow = {
  choice_id: string;
  question_id: string;
  is_correct: number;
};

/**
 * 作問入力をバリデーションし、永続化前に早期エラーを返す。
 */
function validateCreateQuizInput(input: CreateQuizInput): void {
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
 * クイズを公開済み状態で新規作成する。
 * MVPでは作問完了時に version 1 を固定して保存する。
 */
export async function createQuiz(input: CreateQuizInput): Promise<{ quizId: string; versionNo: number }> {
  validateCreateQuizInput(input);

  const db = getD1Database();
  const quizId = createId();
  const quizVersionId = createId();
  const versionNo = 1;

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO quizzes (id, author_user_id, title, description, status)
         VALUES (?, ?, ?, ?, 'published')`
      )
      .bind(quizId, input.authorUserId, input.title.trim(), input.description?.trim() ?? null),
    db
      .prepare(
        `INSERT INTO quiz_versions (id, quiz_id, version_no)
         VALUES (?, ?, ?)`
      )
      .bind(quizVersionId, quizId, versionNo)
  ];

  input.questions.forEach((question, questionIndex) => {
    const questionId = createId();
    statements.push(
      db
        .prepare(
          `INSERT INTO questions (id, quiz_version_id, order_no, body, question_type)
           VALUES (?, ?, ?, ?, 'single')`
        )
        .bind(questionId, quizVersionId, questionIndex + 1, question.body.trim())
    );

    question.choices.forEach((choice, choiceIndex) => {
      const choiceId = createId();
      statements.push(
        db
          .prepare(
            `INSERT INTO choices (id, question_id, order_no, body, is_correct)
             VALUES (?, ?, ?, ?, ?)`
          )
          .bind(choiceId, questionId, choiceIndex + 1, choice.body.trim(), choice.isCorrect ? 1 : 0)
      );
    });
  });

  await db.batch(statements);
  return { quizId, versionNo };
}

/**
 * 公開中クイズのヘッダ情報（最新version）を取得する。
 */
async function getPublishedQuizHeader(quizId: string): Promise<QuizHeaderRow | null> {
  const db = getD1Database();
  return db
    .prepare(
      `SELECT
         q.id AS quiz_id,
         q.title AS title,
         q.description AS description,
         v.id AS quiz_version_id,
         v.version_no AS version_no
       FROM quizzes q
       INNER JOIN quiz_versions v ON q.id = v.quiz_id
       WHERE q.id = ? AND q.status = 'published'
       ORDER BY v.version_no DESC
       LIMIT 1`
    )
    .bind(quizId)
    .first<QuizHeaderRow>();
}

/**
 * 取得した設問・選択肢の行データを、APIレスポンス用のネスト構造へ整形する。
 */
function shapeQuestions(questionRows: QuestionRow[], choiceRows: ChoiceRow[]): PublishedQuizQuestion[] {
  const choicesByQuestionId = new Map<string, PublishedQuizChoice[]>();

  for (const row of choiceRows) {
    const current = choicesByQuestionId.get(row.question_id) ?? [];
    current.push({
      id: row.choice_id,
      orderNo: row.order_no,
      body: row.body
    });
    choicesByQuestionId.set(row.question_id, current);
  }

  return questionRows.map((row) => ({
    id: row.question_id,
    orderNo: row.order_no,
    body: row.body,
    questionType: row.question_type,
    choices: (choicesByQuestionId.get(row.question_id) ?? []).sort((a, b) => a.orderNo - b.orderNo)
  }));
}

/**
 * 公開中クイズ（最新version）を取得する。
 * 問題表示用途のため、正解フラグはレスポンスに含めない。
 */
export async function getPublishedQuiz(quizId: string): Promise<PublishedQuiz | null> {
  const header = await getPublishedQuizHeader(quizId);
  if (!header) {
    return null;
  }

  const db = getD1Database();
  const questionResult = await db
    .prepare(
      `SELECT
         id AS question_id,
         order_no,
         body,
         question_type
       FROM questions
       WHERE quiz_version_id = ?
       ORDER BY order_no ASC`
    )
    .bind(header.quiz_version_id)
    .all<QuestionRow>();

  const choiceResult = await db
    .prepare(
      `SELECT
         c.id AS choice_id,
         c.question_id AS question_id,
         c.order_no AS order_no,
         c.body AS body
       FROM choices c
       INNER JOIN questions q ON c.question_id = q.id
       WHERE q.quiz_version_id = ?
       ORDER BY c.order_no ASC`
    )
    .bind(header.quiz_version_id)
    .all<ChoiceRow>();

  return {
    quizId: header.quiz_id,
    title: header.title,
    description: header.description,
    quizVersionId: header.quiz_version_id,
    versionNo: header.version_no,
    questions: shapeQuestions(questionResult.results, choiceResult.results)
  };
}

/**
 * 回答内容を正誤判定し、attempt と answer を保存して結果を返す。
 */
export async function submitAttempt(input: SubmitAttemptInput): Promise<AttemptResult> {
  const quiz = await getPublishedQuiz(input.quizId);
  if (!quiz) {
    throw new Error("公開中クイズが見つかりません。");
  }

  const db = getD1Database();
  const judgeResult = await db
    .prepare(
      `SELECT
         c.id AS choice_id,
         c.question_id AS question_id,
         c.is_correct AS is_correct
       FROM choices c
       INNER JOIN questions q ON c.question_id = q.id
       WHERE q.quiz_version_id = ?`
    )
    .bind(quiz.quizVersionId)
    .all<JudgeChoiceRow>();

  const correctChoiceByQuestionId = new Map<string, string>();
  const validChoiceIdsByQuestionId = new Map<string, Set<string>>();

  for (const row of judgeResult.results) {
    const validSet = validChoiceIdsByQuestionId.get(row.question_id) ?? new Set<string>();
    validSet.add(row.choice_id);
    validChoiceIdsByQuestionId.set(row.question_id, validSet);

    if (row.is_correct === 1) {
      correctChoiceByQuestionId.set(row.question_id, row.choice_id);
    }
  }

  const answers: AttemptAnswerResult[] = [];
  for (const question of quiz.questions) {
    const selectedChoiceId = input.selectedChoiceIdsByQuestionId[question.id];
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
  const totalCount = quiz.questions.length;
  const score = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);

  const attemptId = createId();
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO attempts (
          id,
          quiz_version_id,
          user_id,
          submitted_at,
          score,
          correct_count,
          total_count
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)`
      )
      .bind(attemptId, quiz.quizVersionId, input.userId ?? null, score, correctCount, totalCount)
  ];

  for (const answer of answers) {
    statements.push(
      db
        .prepare(
          `INSERT INTO attempt_answers (
            id,
            attempt_id,
            question_id,
            selected_choice_id,
            is_correct
          ) VALUES (?, ?, ?, ?, ?)`
        )
        .bind(createId(), attemptId, answer.questionId, answer.selectedChoiceId, answer.isCorrect ? 1 : 0)
    );
  }

  await db.batch(statements);
  return {
    attemptId,
    score,
    correctCount,
    totalCount,
    answers
  };
}
