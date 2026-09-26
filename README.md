# ANVESHANA | Central University Club

> **EXPLORE • BUILD • BRING IDEAS TO LIFE**  
> *A community for curious minds, builders and innovators.*

A production-quality university club web application and secure coding assessment platform built strictly to mirror the aesthetic and functional specifications of the Anveshana design system.

---

## 🏛️ Platform Architecture

```
                          [ Client: React + Vite + TypeScript ]
                                            │
                             ┌──────────────┴──────────────┐
                             │                             │
                     Public Website & Pages        Student Exam & Admin
                     (Editorial, Artistic)         (Minimal, Secure, 3-Col)
                             │                             │
                             └──────────────┬──────────────┘
                                            │ (HTTP / JSON)
                                            ▼
                           [ Backend: Express + TypeScript ]
                                  (Port 5000 / Proxy)
                                            │
                 ┌──────────────────────────┴──────────────────────────┐
                 │                                                     │
                 ▼                                                     ▼
     [ Local Piston Engine ]                              [ Database Persistence ]
      http://localhost:2000                            • Supabase PostgreSQL (Production)
   (Java 15, C++ 10, Python 3, C)                      • High-Performance Local Store (Dev)
```

---

## 🎨 Visual Identity & Design System

The application faithfully implements the uploaded design reference:
- **Primary Navy**: `#0B2A5B`
- **Royal Blue**: `#2563EB`
- **Warm Golden Yellow**: `#F6B51B`
- **Soft Peach & Lavender Accents**: `#FFE5D1` & `#EDE9FE`
- **Subtle Background**: `#FAFBFF`
- **Typography**: Inter for high-density UI & Newsreader for editorial serif headlines
- **Official Brand Assets**: The official `Anveshana Shooting Star Logo.png` is integrated across all navigation headers, exam cards, and footers.

---

## 🚀 Running the Application

### 1. Requirements
- Node.js (v18+)
- Self-hosted Piston compiler engine running locally at `http://localhost:2000`

### 2. Start Backend Server
```bash
cd server
npm install
npm run dev
# Running on http://localhost:5000
```

### 3. Start Frontend Client
```bash
cd client
npm install
npm run dev
# Running on http://localhost:5173
```

*(Note: API requests to `/api` from Vite are automatically proxied to `http://localhost:5000`)*

---

## 🎯 Key Experiences & Routes

### 🌐 Public Website
- `/` - **Home / Landing Page**: Editorial headline, official logo, golden shooting star arc, architectural campus monument illustration, horizontal statistics row (10+ Events, 1000+ Members, 50+ Projects, ∞ Opportunities), "What We Do" cards, upcoming events, and footer.
- `/about` - **About Anveshana**: Club mission, vision, guiding principles.
- `/events` - **Events & Calendar**: Filterable catalog (Coding Challenges, Tech Talks, Workshops, Hackathons), search, RSVP.
- `/initiatives` - **Club Initiatives**: Competitive programming, open source guild, AI research circle, robotics lab.
- `/team` - **Leadership & Mentors**: Faculty advisor and student core leaders with bios and contact links.
- `/contact` - **Campus Office & Support**: Lab location (CSE Dept, Block B), office hours, validated inquiry form.

### 📝 Student Coding Assessment (No Passwords / No Accounts)
- `/coding-exam` or `/exam/entry` - **Student Entry**: Enter Full Name, Roll Number, and Email Address.
- `/exam/passkey` - **Passkey Entry**: 4 individual digit inputs `[ 4 ] [ 8 ] [ 2 ] [ 7 ]` with auto-focus advance, backspace navigation, paste handling, and backend verification.
- `/exam/instructions` - **Instructions & Rules**: Overview of duration, languages, marks, security rules, and user-gesture fullscreen initiation.
- `/exam/:attemptId` - **Secure Coding Assessment Interface**:
  - **Left**: Question Navigator with live status indicators (Current, Answered, Not Answered, Marked for Review).
  - **Center**: Problem statement, constraints, visible test cases.
  - **Right**: Monaco code editor, language selector (Java 15.0.2, C++ 10.2.0, Python 3.12.0, C 10.2.0), format code, reset code.
  - **Actions**: `▶ Run Code` (tests against custom stdin) & `✓ Submit Solution` (securely evaluated against hidden test cases on local Piston).
  - **Console**: Output, custom input, compilation errors, execution time in ms, memory in MB, exit code.
  - **Anti-Cheat Controls**: Fullscreen enforcement, tab switch detection, clipboard restriction, right-click disabling, and violation warning modal (Warning 1/3, 2/3, 3/3).
  - **Server-Authoritative Timer**: Automatic evaluation and submission upon timeout.
- `/exam/:attemptId/result` - **Assessment Complete**: Total score, accuracy percentage, time taken, question breakdown, and celebration confetti.

### 🛡️ Admin Portal
- `/admin` - **Overview Dashboard**: Metrics (Total Exams, Students, Submissions, Violations), Recent Exams table, Top Performers leaderboard, and "+ Create Exam" button.
- `/admin/exams` - **Exams Management**: Passkey management with one-click copy, status toggling (LIVE / SCHEDULED / ENDED), question management shortcuts.
- `/admin/exams/create` - **Create Assessment**: Form with title, duration, marks, rules, and 4-digit passkey generator/regenerator.
- `/admin/questions` - **Question Builder**: Create/delete problems, rich descriptions, and add visible or hidden test cases.
- `/admin/live` - **Live Monitor**: Real-time telemetry feed polling every 4 seconds (Online, Coding, Submitted, Warnings, Terminated, Force Submit).
- `/admin/results` - **Leaderboard & Export**: Student ranks, score filters, CSV export.
- `/admin/security` - **Security Audit Logs**: Chronological log of tab switches, fullscreen exits, and clipboard attempts.

---

## 🗄️ Database & Supabase Schema

The repository contains `supabase_schema.sql` ready to run in Supabase SQL Editor:
- `exams`
- `questions`
- `test_cases` (with hidden flag and RLS policies)
- `participants`
- `submissions`
- `security_events`
- `exam_results`
