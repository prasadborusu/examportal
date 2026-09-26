-- ====================================================================
-- ANVESHANA CODING ASSESSMENT PLATFORM - SUPABASE SCHEMA
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. EXAMS TABLE
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
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

-- 2. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    marks INTEGER NOT NULL DEFAULT 10,
    order_number INTEGER NOT NULL DEFAULT 1,
    starter_templates JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TEST CASES TABLE (Hidden & Visible)
CREATE TABLE IF NOT EXISTS test_cases (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    marks INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PARTICIPANTS TABLE (Candidate exam sessions)
CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'CODING' CHECK (status IN ('REGISTERED', 'CODING', 'IDLE', 'WARNING', 'SUBMITTED', 'TERMINATED')),
    current_question_id TEXT REFERENCES questions(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    violations_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    code TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Accepted', 'Partial Score', 'Wrong Answer', 'Compilation Error', 'Runtime Error', 'Time Limit Exceeded')),
    score INTEGER NOT NULL DEFAULT 0,
    passed_test_cases INTEGER NOT NULL DEFAULT 0,
    total_test_cases INTEGER NOT NULL DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    memory_kb INTEGER DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SECURITY EVENTS TABLE (Live telemetry violations)
CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EXAM RESULTS TABLE
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
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EVENTS TABLE
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
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id, order_number);
CREATE INDEX IF NOT EXISTS idx_test_cases_question ON test_cases(question_id);
CREATE INDEX IF NOT EXISTS idx_participants_exam ON participants(exam_id, roll_number);
CREATE INDEX IF NOT EXISTS idx_submissions_participant ON submissions(participant_id, question_id);
CREATE INDEX IF NOT EXISTS idx_security_events_participant ON security_events(participant_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON exam_results(exam_id, total_score DESC);

-- DISABLE ROW LEVEL SECURITY OR ALLOW ALL FOR BACKEND SERVICE ROLE & ANON
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
