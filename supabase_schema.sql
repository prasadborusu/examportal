-- ====================================================================
-- ANVESHANA ASSESSMENT PLATFORM - SUPABASE SCHEMA & MIGRATIONS
-- Run this script in Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. EXAMS TABLE
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    exam_type TEXT NOT NULL DEFAULT 'FULL' CHECK (exam_type IN ('FULL', 'MCQ', 'CODING', 'SECTIONAL')),
    passkey TEXT NOT NULL DEFAULT '4827',
    passkey_hash TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    total_marks INTEGER NOT NULL DEFAULT 100,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
    status TEXT NOT NULL DEFAULT 'LIVE' CHECK (status IN ('DRAFT', 'SCHEDULED', 'LIVE', 'ACTIVE', 'ENDED', 'ARCHIVED')),
    max_violations INTEGER NOT NULL DEFAULT 3,
    allowed_languages TEXT[] DEFAULT ARRAY['java', 'c++', 'python', 'c'],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backwards-compatibility column additions for existing exams table
ALTER TABLE exams ADD COLUMN IF NOT EXISTS exam_type TEXT NOT NULL DEFAULT 'FULL' CHECK (exam_type IN ('FULL', 'MCQ', 'CODING', 'SECTIONAL'));

-- 2. SECTIONS TABLE
CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    question_type TEXT NOT NULL CHECK (question_type IN ('MCQ', 'CODING', 'MIXED')),
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    total_marks INTEGER NOT NULL DEFAULT 30,
    question_limit INTEGER,
    navigation_mode TEXT NOT NULL DEFAULT 'FREE' CHECK (navigation_mode IN ('FREE', 'SEQUENTIAL')),
    lock_after_submission BOOLEAN NOT NULL DEFAULT false,
    allow_previous_section BOOLEAN NOT NULL DEFAULT true,
    order_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. QUESTIONS TABLE (MCQ & CODING)
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    section_id TEXT REFERENCES sections(id) ON DELETE SET NULL,
    question_type TEXT NOT NULL DEFAULT 'CODING' CHECK (question_type IN ('CODING', 'MCQ')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    marks INTEGER NOT NULL DEFAULT 10,
    time_limit INTEGER DEFAULT 3000,
    order_number INTEGER NOT NULL DEFAULT 1,
    starter_templates JSONB DEFAULT '{}'::jsonb,
    options JSONB DEFAULT '[]'::jsonb,
    correct_option_id TEXT,
    explanation TEXT,
    negative_marks NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backwards-compatibility column additions for existing questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS section_id TEXT REFERENCES sections(id) ON DELETE SET NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'CODING' CHECK (question_type IN ('CODING', 'MCQ'));
ALTER TABLE questions ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_option_id TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS negative_marks NUMERIC DEFAULT 0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS time_limit INTEGER DEFAULT 3000;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. TEST CASES TABLE (Hidden & Visible)
CREATE TABLE IF NOT EXISTS test_cases (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    type TEXT DEFAULT 'PUBLIC',
    marks INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PARTICIPANTS TABLE (Candidate exam sessions)
CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'CODING' CHECK (status IN ('REGISTERED', 'CODING', 'IDLE', 'WARNING', 'SUBMITTED', 'TERMINATED')),
    current_question_id TEXT REFERENCES questions(id) ON DELETE SET NULL,
    current_section_id TEXT REFERENCES sections(id) ON DELETE SET NULL,
    section_states JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    violations_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE participants ADD COLUMN IF NOT EXISTS current_section_id TEXT REFERENCES sections(id) ON DELETE SET NULL;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS section_states JSONB DEFAULT '{}'::jsonb;

-- 6. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    section_id TEXT REFERENCES sections(id) ON DELETE SET NULL,
    question_type TEXT DEFAULT 'CODING',
    language TEXT,
    code TEXT,
    selected_option_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('Accepted', 'Partial Score', 'Wrong Answer', 'Compilation Error', 'Runtime Error', 'Time Limit Exceeded')),
    score INTEGER NOT NULL DEFAULT 0,
    passed_test_cases INTEGER NOT NULL DEFAULT 0,
    total_test_cases INTEGER NOT NULL DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    memory_kb INTEGER DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS section_id TEXT REFERENCES sections(id) ON DELETE SET NULL;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'CODING';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS selected_option_id TEXT;

-- 7. SECURITY EVENTS TABLE
CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EXAM RESULTS TABLE
CREATE TABLE IF NOT EXISTS exam_results (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    participant_id TEXT UNIQUE NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_name TEXT,
    roll_number TEXT,
    email TEXT,
    total_score INTEGER NOT NULL DEFAULT 0,
    total_marks INTEGER NOT NULL DEFAULT 100,
    time_taken_seconds INTEGER NOT NULL DEFAULT 0,
    questions_answered INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    passed_test_cases INTEGER NOT NULL DEFAULT 0,
    total_test_cases INTEGER NOT NULL DEFAULT 0,
    violations_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'SUBMITTED',
    breakdown JSONB DEFAULT '[]'::jsonb,
    section_breakdown JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS section_breakdown JSONB DEFAULT '[]'::jsonb;

-- 9. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    day TEXT NOT NULL,
    month TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    attendees TEXT DEFAULT '0 Registered',
    description TEXT NOT NULL,
    "isAssessment" BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_sections_exam ON sections(exam_id, order_number);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id, order_number);
CREATE INDEX IF NOT EXISTS idx_questions_section ON questions(section_id, order_number);
CREATE INDEX IF NOT EXISTS idx_test_cases_question ON test_cases(question_id);
CREATE INDEX IF NOT EXISTS idx_participants_exam ON participants(exam_id, roll_number);
CREATE INDEX IF NOT EXISTS idx_submissions_participant ON submissions(participant_id, question_id);
CREATE INDEX IF NOT EXISTS idx_security_events_participant ON security_events(participant_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON exam_results(exam_id, total_score DESC);

-- DISABLE ROW LEVEL SECURITY FOR ALL ASSESSMENT TABLES
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
