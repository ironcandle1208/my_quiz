-- クイズ本体
CREATE TABLE quizzes (
  id TEXT PRIMARY KEY,
  author_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 公開版
CREATE TABLE quiz_versions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  version_no INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(quiz_id, version_no),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- 設問
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  quiz_version_id TEXT NOT NULL,
  order_no INTEGER NOT NULL,
  body TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'single',
  UNIQUE(quiz_version_id, order_no),
  FOREIGN KEY (quiz_version_id) REFERENCES quiz_versions(id) ON DELETE CASCADE
);

-- 選択肢
CREATE TABLE choices (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  order_no INTEGER NOT NULL,
  body TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  UNIQUE(question_id, order_no),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 回答セッション
CREATE TABLE attempts (
  id TEXT PRIMARY KEY,
  quiz_version_id TEXT NOT NULL,
  user_id TEXT,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (quiz_version_id) REFERENCES quiz_versions(id)
);

-- 設問ごとの回答
CREATE TABLE attempt_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_choice_id TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  UNIQUE(attempt_id, question_id),
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (selected_choice_id) REFERENCES choices(id)
);

CREATE INDEX idx_questions_version_order ON questions(quiz_version_id, order_no);
CREATE INDEX idx_choices_question_order ON choices(question_id, order_no);
CREATE INDEX idx_attempts_quiz_submitted ON attempts(quiz_version_id, submitted_at);
