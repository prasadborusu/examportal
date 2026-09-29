export type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ACTIVE' | 'ENDED' | 'ARCHIVED';
export type ParticipantStatus = 'REGISTERED' | 'CODING' | 'IDLE' | 'WARNING' | 'SUBMITTED' | 'TERMINATED';
export type SubmissionStatus = 'Accepted' | 'Partial Score' | 'Wrong Answer' | 'Compilation Error' | 'Runtime Error' | 'Time Limit Exceeded';
export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface Exam {
  id: string;
  title: string;
  description: string;
  passkey?: string;
  duration_minutes: number;
  total_marks: number;
  start_time: string;
  end_time: string;
  status: ExamStatus;
  max_violations: number;
  allowed_languages: string[];
  created_at: string;
}

export interface QuestionExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface Question {
  id: string;
  exam_id: string;
  title: string;
  description: string;
  input_format?: string;
  output_format?: string;
  constraints?: string;
  examples?: QuestionExample[];
  difficulty: QuestionDifficulty;
  marks: number;
  time_limit?: number;
  order_number: number;
  starter_templates: {
    java?: string;
    cpp?: string;
    python?: string;
    c?: string;
  };
  test_cases?: TestCase[];
  created_at?: string;
}

export interface TestCase {
  id: string;
  question_id: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
  type?: 'PUBLIC' | 'HIDDEN';
  marks: number;
}

export interface Participant {
  id: string;
  exam_id: string;
  exam_title?: string;
  name: string;
  roll_number: string;
  email: string;
  status: ParticipantStatus;
  current_question_id?: string;
  started_at: string;
  submitted_at?: string;
  violations_count: number;
}

export interface Submission {
  id: string;
  participant_id: string;
  student_name?: string;
  roll_number?: string;
  exam_id?: string;
  question_id: string;
  question_title?: string;
  language: string;
  code: string;
  status: SubmissionStatus;
  score: number;
  passed_test_cases: number;
  total_test_cases: number;
  execution_time_ms: number;
  memory_kb: number;
  submitted_at: string;
}

export interface SecurityEvent {
  id: string;
  participant_id: string;
  student_name?: string;
  roll_number?: string;
  exam_id?: string;
  exam_title?: string;
  event_type: 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'COPY_ATTEMPT' | 'PASTE_ATTEMPT' | 'CUT_ATTEMPT' | 'RIGHT_CLICK' | 'DEVTOOLS_ATTEMPT' | 'SHORTCUT_ATTEMPT' | 'PAGE_REFRESH_ATTEMPT';
  details: string;
  created_at: string;
}

export interface ExamResult {
  id: string;
  participant_id: string;
  exam_id: string;
  exam_title?: string;
  student_name: string;
  roll_number: string;
  email: string;
  total_score: number;
  total_marks: number;
  time_taken_seconds: number;
  questions_answered: number;
  total_questions: number;
  passed_test_cases: number;
  total_test_cases: number;
  violations_count: number;
  status: 'SUBMITTED' | 'TERMINATED';
  submitted_at: string;
  breakdown: Array<{
    question_id: string;
    question_title: string;
    score: number;
    max_marks: number;
    status: SubmissionStatus;
    passed_cases: number;
    total_cases: number;
  }>;
}

export interface EventItem {
  id: string;
  title: string;
  category: string;
  date: string;
  day: string;
  month: string;
  time: string;
  location: string;
  attendees: string;
  description: string;
  isAssessment?: boolean;
  created_at?: string;
}
