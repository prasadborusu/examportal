export type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ACTIVE' | 'ENDED' | 'ARCHIVED';
export type ParticipantStatus = 'REGISTERED' | 'CODING' | 'IDLE' | 'WARNING' | 'SUBMITTED' | 'TERMINATED';
export type SubmissionStatus = 'Accepted' | 'Partial Score' | 'Wrong Answer' | 'Compilation Error' | 'Runtime Error' | 'Time Limit Exceeded';
export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export type ExamType = 'FULL' | 'MCQ' | 'CODING' | 'SECTIONAL';
export type SectionQuestionType = 'MCQ' | 'CODING' | 'MIXED';
export type SectionNavigationMode = 'FREE' | 'SEQUENTIAL';

export interface Exam {
  id: string;
  title: string;
  description: string;
  exam_type?: ExamType;
  passkey?: string;
  duration_minutes: number;
  total_marks: number;
  start_time: string;
  end_time: string;
  status: ExamStatus;
  max_violations: number;
  allowed_languages: string[];
  created_at: string;
  updated_at?: string;
}

export interface Section {
  id: string;
  exam_id: string;
  name: string;
  description?: string;
  question_type: SectionQuestionType;
  duration_minutes: number;
  total_marks: number;
  question_limit?: number;
  navigation_mode: SectionNavigationMode;
  lock_after_submission: boolean;
  allow_previous_section: boolean;
  order_number: number;
  questions_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface QuestionExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface MCQOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  exam_id: string;
  section_id?: string | null;
  question_type?: 'CODING' | 'MCQ';
  title: string;
  description: string;
  difficulty: QuestionDifficulty;
  marks: number;
  time_limit?: number;
  order_number: number;
  // Coding fields
  input_format?: string;
  output_format?: string;
  constraints?: string;
  examples?: QuestionExample[];
  starter_templates?: {
    java?: string;
    cpp?: string;
    python?: string;
    c?: string;
  };
  test_cases?: TestCase[];
  // MCQ fields
  options?: MCQOption[];
  correct_option_id?: string;
  explanation?: string;
  negative_marks?: number;
  created_at?: string;
  updated_at?: string;
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
  current_section_id?: string;
  section_states?: Record<
    string,
    {
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';
      started_at?: string;
      submitted_at?: string;
      time_spent_seconds?: number;
    }
  >;
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
  section_id?: string;
  question_id: string;
  question_title?: string;
  question_type?: 'CODING' | 'MCQ';
  // Coding submission fields
  language?: string;
  code?: string;
  // MCQ submission fields
  selected_option_id?: string;
  // Common grading fields
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
    section_id?: string;
    question_title: string;
    question_type?: 'CODING' | 'MCQ';
    score: number;
    max_marks: number;
    status: SubmissionStatus;
    passed_cases: number;
    total_cases: number;
    selected_option_id?: string;
  }>;
  section_breakdown?: Array<{
    section_id?: string;
    section_name: string;
    question_type: string;
    score: number;
    max_marks: number;
    questions_answered: number;
    total_questions: number;
    passed_test_cases?: number;
    total_test_cases?: number;
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
