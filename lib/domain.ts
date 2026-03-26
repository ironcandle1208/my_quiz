export type QuizCreateChoiceInput = {
  body: string;
  isCorrect: boolean;
};

export type QuizCreateQuestionInput = {
  body: string;
  choices: QuizCreateChoiceInput[];
};

export type CreateQuizInput = {
  title: string;
  description?: string;
  authorUserId: string;
  questions: QuizCreateQuestionInput[];
};

export type PublishedQuizChoice = {
  id: string;
  orderNo: number;
  body: string;
};

export type PublishedQuizQuestion = {
  id: string;
  orderNo: number;
  body: string;
  questionType: "single";
  choices: PublishedQuizChoice[];
};

export type PublishedQuiz = {
  quizId: string;
  title: string;
  description: string | null;
  quizVersionId: string;
  versionNo: number;
  questions: PublishedQuizQuestion[];
};

export type SubmitAttemptInput = {
  quizId: string;
  userId?: string;
  selectedChoiceIdsByQuestionId: Record<string, string>;
};

export type AttemptAnswerResult = {
  questionId: string;
  selectedChoiceId: string;
  isCorrect: boolean;
};

export type AttemptResult = {
  attemptId: string;
  score: number;
  correctCount: number;
  totalCount: number;
  answers: AttemptAnswerResult[];
};
