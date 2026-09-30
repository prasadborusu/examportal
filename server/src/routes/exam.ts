import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { executeCodeOnPiston } from '../piston.js';
import { SubmissionStatus, ExamResult, Submission } from '../types.js';

const router = Router();

// 1. Verify Passkey & Start/Join Attempt
router.post('/verify-passkey', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, roll_number, email, passkey } = req.body;

    if (!name || !roll_number || !email || !passkey) {
      res.status(400).json({ error: 'All fields (Name, Roll Number, Email, Passkey) are required.' });
      return;
    }

    const cleanPasskey = String(passkey).trim();
    const exam = await db.getActiveExamByPasskey(cleanPasskey);

    if (!exam) {
      res.status(404).json({
        error: 'Invalid exam passkey or this exam is currently not active. Please verify the 4-digit code with the coordinator.',
      });
      return;
    }

    const participant = await db.createOrGetParticipant(exam.id, name, roll_number, email);

    if (participant.status === 'TERMINATED') {
      res.status(403).json({
        error: 'This assessment attempt was terminated due to exceeding security violations.',
        attemptId: participant.id,
      });
      return;
    }

    const questionsList = await db.getQuestionsByExam(exam.id);

    res.json({
      success: true,
      attemptId: participant.id,
      exam: {
        id: exam.id,
        title: exam.title,
        duration_minutes: exam.duration_minutes,
        total_marks: exam.total_marks,
        allowed_languages: exam.allowed_languages,
        max_violations: exam.max_violations,
        total_questions: questionsList.length,
      },
      participant: {
        name: participant.name,
        roll_number: participant.roll_number,
        email: participant.email,
        status: participant.status,
      },
    });
  } catch (err: any) {
    console.error('Error in /verify-passkey:', err);
    res.status(500).json({ error: 'Internal server error validating passkey.' });
  }
});

// 2. Fetch Exam Session Data
router.get('/:attemptId', async (req: Request, res: Response): Promise<void> => {
  try {
    const attemptId = req.params.attemptId as string;
    const participant = await db.getParticipantById(attemptId);

    if (!participant) {
      res.status(404).json({ error: 'Assessment attempt session not found.' });
      return;
    }

    const exam = await db.getExamById(participant.exam_id);
    if (!exam) {
      res.status(404).json({ error: 'Exam not found.' });
      return;
    }

    const startedAt = new Date(participant.started_at).getTime();
    const durationMs = exam.duration_minutes * 60 * 1000;
    const now = Date.now();
    const elapsedMs = now - startedAt;
    const remainingMs = Math.max(0, durationMs - elapsedMs);
    const timeRemainingSeconds = Math.floor(remainingMs / 1000);

    const isExpired = timeRemainingSeconds <= 0 && participant.status !== 'SUBMITTED';

    // Fetch Sections
    const sections = await db.getSectionsByExam(exam.id);

    // Initialize or resolve section states for sectional exams
    let sectionStates = participant.section_states || {};
    let currentSectionId = participant.current_section_id;

    if (sections.length > 0) {
      if (!currentSectionId || !sections.some((s) => s.id === currentSectionId)) {
        currentSectionId = sections[0].id;
      }

      let statesChanged = false;
      sections.forEach((sec, idx) => {
        if (!sectionStates[sec.id]) {
          sectionStates[sec.id] = {
            status: idx === 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
            started_at: idx === 0 ? new Date().toISOString() : undefined,
          };
          statesChanged = true;
        }
      });

      if (statesChanged || participant.current_section_id !== currentSectionId) {
        await db.updateParticipant(participant.id, {
          current_section_id: currentSectionId,
          section_states: sectionStates,
        });
      }
    }

    // Calculate section-specific time remaining if current section has duration
    let sectionTimeRemainingSeconds = timeRemainingSeconds;
    if (currentSectionId) {
      const activeSection = sections.find((s) => s.id === currentSectionId);
      if (activeSection && activeSection.duration_minutes && activeSection.duration_minutes > 0) {
        const secStartedAtStr = sectionStates[activeSection.id]?.started_at || participant.started_at;
        const secStartedAt = new Date(secStartedAtStr).getTime();
        const secDurationMs = activeSection.duration_minutes * 60 * 1000;
        const secElapsed = now - secStartedAt;
        sectionTimeRemainingSeconds = Math.max(0, Math.floor((secDurationMs - secElapsed) / 1000));
      }
    }

    const rawQuestions = await db.getQuestionsByExam(exam.id);
    const questions = await Promise.all(
      rawQuestions.map(async (q) => {
        const sanitizedTestCases = await db.getTestCasesByQuestion(q.id, false);

        // Strip correct_option_id and is_correct for MCQ security
        const sanitizedOptions = (q.options || []).map((opt) => ({
          id: opt.id,
          text: opt.text,
        }));

        return {
          ...q,
          correct_option_id: undefined, // Never expose to student
          explanation: undefined, // Strip explanation during test
          options: sanitizedOptions,
          test_cases: sanitizedTestCases,
        };
      })
    );

    const submissions = await db.getSubmissionsByParticipant(participant.id);

    res.json({
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        exam_type: exam.exam_type || 'FULL',
        duration_minutes: exam.duration_minutes,
        total_marks: exam.total_marks,
        allowed_languages: exam.allowed_languages,
        max_violations: exam.max_violations,
        status: exam.status,
      },
      participant: {
        id: participant.id,
        name: participant.name,
        roll_number: participant.roll_number,
        email: participant.email,
        status: participant.status,
        violations_count: participant.violations_count || 0,
        current_section_id: currentSectionId,
        section_states: sectionStates,
      },
      sections,
      currentSectionId,
      sectionStates,
      sectionTimeRemainingSeconds,
      timeRemainingSeconds,
      isExpired,
      questions,
      submissions,
    });
  } catch (err: any) {
    console.error('Error in GET /:attemptId:', err);
    res.status(500).json({ error: 'Failed to load exam attempt.' });
  }
});

// 3. Run Code with Custom Input
// 3. Run Code with Custom Input or Public Test Cases
router.post('/:attemptId/run', async (req: Request, res: Response): Promise<void> => {
  try {
    const attemptId = req.params.attemptId as string;
    const { questionId, language, code, customInput } = req.body;

    const participant = await db.getParticipantById(attemptId);
    if (!participant) {
      res.status(404).json({ error: 'Invalid attempt session.' });
      return;
    }

    if (participant.status === 'SUBMITTED' || participant.status === 'TERMINATED') {
      res.status(403).json({ error: 'This exam has already ended.' });
      return;
    }

    // If custom input provided, execute once on that custom input
    if (typeof customInput === 'string' && customInput.trim().length > 0) {
      const result = await executeCodeOnPiston(language, code, customInput);
      res.json({
        ...result,
        mode: 'CUSTOM_INPUT',
      });
      return;
    }

    // Otherwise, execute against the question's PUBLIC test cases
    const publicTestCases = await db.getTestCasesByQuestion(questionId, false);
    if (publicTestCases.length === 0) {
      const result = await executeCodeOnPiston(language, code, '');
      res.json({
        ...result,
        mode: 'NO_TEST_CASES',
      });
      return;
    }

    const testCaseResults: any[] = [];
    let passedCount = 0;
    let totalTimeMs = 0;
    let maxMemoryMb = 0;
    let hasCompilationError = false;
    let compilationErrorOutput = '';

    for (let i = 0; i < publicTestCases.length; i++) {
      const tc = publicTestCases[i];
      const exec = await executeCodeOnPiston(language, code, tc.input);

      if (exec.compilationError) {
        hasCompilationError = true;
        compilationErrorOutput = exec.stderr || exec.output;
        testCaseResults.push({
          caseNumber: i + 1,
          type: 'PUBLIC',
          passed: false,
          status: 'Compilation Error',
          input: tc.input,
          expectedOutput: tc.expected_output,
          actualOutput: '',
          error: exec.stderr || exec.output,
          timeMs: exec.timeMs,
        });
        break;
      }

      totalTimeMs += exec.timeMs;
      maxMemoryMb = Math.max(maxMemoryMb, exec.memoryMb);

      const normalizedActual = normalizeOutput(exec.stdout);
      const normalizedExpected = normalizeOutput(tc.expected_output);
      const passed = normalizedActual === normalizedExpected && !exec.runtimeError;

      if (passed) passedCount++;

      testCaseResults.push({
        caseNumber: i + 1,
        type: 'PUBLIC',
        passed,
        status: passed ? 'Passed' : exec.runtimeError ? 'Runtime Error' : 'Wrong Answer',
        input: tc.input,
        expectedOutput: tc.expected_output,
        actualOutput: exec.stdout,
        error: exec.stderr,
        timeMs: exec.timeMs,
      });
    }

    res.json({
      mode: 'TEST_CASES',
      compilationError: hasCompilationError ? compilationErrorOutput : null,
      passedTestCases: passedCount,
      totalTestCases: publicTestCases.length,
      timeMs: totalTimeMs,
      memoryMb: maxMemoryMb,
      testCases: testCaseResults,
    });
  } catch (err: any) {
    console.error('Error in POST /:attemptId/run:', err);
    res.status(500).json({ error: 'Failed to run code.' });
  }
});

function normalizeOutput(str: string): string {
  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

// Helper: Evaluates a coding problem against all test cases and saves submission
async function evaluateAndSaveCodingSubmission(
  participantId: string,
  question: any,
  language: string,
  code: string
): Promise<{
  submission: Submission;
  testCaseResults: any[];
  compilationError: string | null;
}> {
  const testCases = await db.getAllTestCasesForExecution(question.id);
  if (testCases.length === 0) {
    testCases.push({
      id: 'tc-dummy',
      question_id: question.id,
      input: '',
      expected_output: '',
      is_hidden: false,
      marks: question.marks,
    });
  }

  let passedCount = 0;
  let totalMarksEarned = 0;
  let compilationError = false;
  let compilationErrorOutput = '';
  let runtimeError = false;
  let totalTimeMs = 0;
  let maxMemoryMb = 0;
  const testCaseResults: any[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const isHidden = tc.is_hidden || tc.type === 'HIDDEN';
    const exec = await executeCodeOnPiston(language, code, tc.input);

    if (exec.compilationError) {
      compilationError = true;
      compilationErrorOutput = exec.stderr || exec.output;
      testCaseResults.push({
        caseNumber: i + 1,
        type: isHidden ? 'HIDDEN' : 'PUBLIC',
        passed: false,
        status: 'Compilation Error',
        timeMs: exec.timeMs,
        error: exec.stderr || exec.output,
      });
      break;
    }

    if (exec.runtimeError) {
      runtimeError = true;
    }

    totalTimeMs += exec.timeMs;
    maxMemoryMb = Math.max(maxMemoryMb, exec.memoryMb);

    const normalizedActual = normalizeOutput(exec.stdout);
    const normalizedExpected = normalizeOutput(tc.expected_output);
    const passed = normalizedActual === normalizedExpected && !exec.runtimeError;

    if (passed) {
      passedCount++;
      totalMarksEarned += tc.marks || Math.round(question.marks / testCases.length);
    }

    testCaseResults.push({
      caseNumber: i + 1,
      type: isHidden ? 'HIDDEN' : 'PUBLIC',
      passed,
      status: passed ? 'Passed' : exec.runtimeError ? 'Runtime Error' : 'Wrong Answer',
      timeMs: exec.timeMs,
      memoryMb: exec.memoryMb,
      marks: tc.marks,
      input: isHidden ? undefined : tc.input,
      expectedOutput: isHidden ? undefined : tc.expected_output,
      actualOutput: isHidden ? undefined : exec.stdout,
      error: isHidden ? (exec.runtimeError ? 'Runtime Error' : undefined) : exec.stderr,
    });
  }

  let status: SubmissionStatus = 'Wrong Answer';
  if (compilationError) {
    status = 'Compilation Error';
    totalMarksEarned = 0;
  } else if (passedCount === testCases.length) {
    status = 'Accepted';
    totalMarksEarned = question.marks;
  } else if (passedCount > 0) {
    status = 'Partial Score';
  } else if (runtimeError) {
    status = 'Runtime Error';
  }

  totalMarksEarned = Math.min(totalMarksEarned, question.marks);

  const submission = await db.saveOrUpdateSubmission({
    participant_id: participantId,
    question_id: question.id,
    section_id: question.section_id || undefined,
    language,
    code,
    status,
    score: totalMarksEarned,
    passed_test_cases: passedCount,
    total_test_cases: testCases.length,
    execution_time_ms: totalTimeMs,
    memory_kb: Math.round(maxMemoryMb * 1024),
  });

  return {
    submission,
    testCaseResults,
    compilationError: compilationError ? compilationErrorOutput : null,
  };
}

// 4. Submit Solution (Evaluated server-side against public and hidden test cases)
router.post('/:attemptId/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const attemptId = req.params.attemptId as string;
    const { questionId, language, code } = req.body;

    const participant = await db.getParticipantById(attemptId);
    if (!participant) {
      res.status(404).json({ error: 'Invalid attempt session.' });
      return;
    }

    if (participant.status === 'SUBMITTED' || participant.status === 'TERMINATED') {
      res.status(403).json({ error: 'Exam is already closed.' });
      return;
    }

    const question = await db.getQuestionById(questionId);
    if (!question) {
      res.status(404).json({ error: 'Question not found.' });
      return;
    }

    const evalResult = await evaluateAndSaveCodingSubmission(participant.id, question, language, code);
    const sub = evalResult.submission;

    res.json({
      success: true,
      submissionId: sub.id,
      status: sub.status,
      score: sub.score,
      maxMarks: question.marks,
      passedTestCases: sub.passed_test_cases,
      totalTestCases: sub.total_test_cases,
      executionTimeMs: sub.execution_time_ms,
      memoryMb: sub.memory_kb ? Math.round(sub.memory_kb / 1024) : 0,
      testCases: evalResult.testCaseResults,
      compilationError: evalResult.compilationError,
    });
  } catch (err: any) {
    console.error('Error in POST /:attemptId/submit:', err);
    res.status(500).json({ error: 'Failed to evaluate submission.' });
  }
});

// 4b. MCQ Question Submission (Server-side grading, strictly concealed correct_option_id)
router.post('/:attemptId/mcq-submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const attemptId = req.params.attemptId as string;
    const { questionId, selectedOptionId } = req.body;

    const participant = await db.getParticipantById(attemptId);
    if (!participant) {
      res.status(404).json({ error: 'Invalid attempt session.' });
      return;
    }

    if (participant.status === 'SUBMITTED' || participant.status === 'TERMINATED') {
      res.status(403).json({ error: 'Exam is already closed.' });
      return;
    }

    const question = await db.getQuestionById(questionId);
    if (!question) {
      res.status(404).json({ error: 'Question not found.' });
      return;
    }

    // Check if the answer is correct strictly on backend
    const cleanSelected = typeof selectedOptionId === 'string' ? selectedOptionId.trim() : '';
    const isAnswered = cleanSelected.length > 0;
    const isCorrect = isAnswered && question.correct_option_id === cleanSelected;

    let score = 0;
    let status: SubmissionStatus = 'Not Answered' as any;

    if (isAnswered) {
      if (isCorrect) {
        score = question.marks;
        status = 'Accepted';
      } else {
        const neg = question.negative_marks ? Math.abs(question.negative_marks) : 0;
        score = -neg;
        status = 'Wrong Answer';
      }
    }

    const submission = await db.saveOrUpdateSubmission({
      participant_id: participant.id,
      question_id: question.id,
      section_id: question.section_id || undefined,
      question_type: 'MCQ',
      selected_option_id: isAnswered ? cleanSelected : undefined,
      language: 'mcq',
      code: isAnswered ? cleanSelected : '',
      status,
      score,
      passed_test_cases: isCorrect ? 1 : 0,
      total_test_cases: 1,
      execution_time_ms: 0,
      memory_kb: 0,
    });

    res.json({
      success: true,
      submissionId: submission.id,
      questionId: question.id,
      selectedOptionId: isAnswered ? cleanSelected : null,
      status: submission.status,
      score: submission.score,
      maxMarks: question.marks,
      // Note: correct_option_id is NEVER returned to the student
    });
  } catch (err: any) {
    console.error('Error in POST /:attemptId/mcq-submit:', err);
    res.status(500).json({ error: 'Failed to record MCQ answer.' });
  }
});

// 4c. Start Section (For timed sections or tracking start time)
router.post('/:attemptId/sections/:sectionId/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const attemptId = req.params.attemptId as string;
    const sectionId = req.params.sectionId as string;

    const participant = await db.getParticipantById(attemptId);
    if (!participant) {
      res.status(404).json({ error: 'Participant not found.' });
      return;
    }

    const sectionStates = participant.section_states || {};
    const existing = sectionStates[sectionId] || { status: 'NOT_STARTED' };

    if (existing.status === 'LOCKED') {
      res.status(403).json({ error: 'This section is locked and cannot be started.' });
      return;
    }

    if (existing.status === 'NOT_STARTED') {
      sectionStates[sectionId] = {
        status: 'IN_PROGRESS',
        started_at: new Date().toISOString(),
      };
    }

    await db.updateParticipant(attemptId, {
      current_section_id: sectionId,
      section_states: sectionStates,
    });

    res.json({
      success: true,
      currentSectionId: sectionId,
      sectionStates,
    });
  } catch (err: any) {
    console.error('Error in POST /:attemptId/sections/:sectionId/start:', err);
    res.status(500).json({ error: 'Failed to start section.' });
  }
});

// 4d. Submit Section (Lock section if configured, advance to next section)
router.post('/:attemptId/sections/:sectionId/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const attemptId = req.params.attemptId as string;
    const sectionId = req.params.sectionId as string;

    const participant = await db.getParticipantById(attemptId);
    if (!participant) {
      res.status(404).json({ error: 'Participant not found.' });
      return;
    }

    const exam = await db.getExamById(participant.exam_id);
    if (!exam) {
      res.status(404).json({ error: 'Exam not found.' });
      return;
    }

    const sections = await db.getSectionsByExam(exam.id);
    const currSection = sections.find((s) => s.id === sectionId);
    if (!currSection) {
      res.status(404).json({ error: 'Section not found.' });
      return;
    }

    const sectionStates = participant.section_states || {};
    const lockAfterSub = currSection.lock_after_submission ?? true;

    sectionStates[sectionId] = {
      ...(sectionStates[sectionId] || {}),
      status: lockAfterSub ? 'LOCKED' : 'COMPLETED',
      submitted_at: new Date().toISOString(),
    };

    // Find next section in order
    const currIdx = sections.findIndex((s) => s.id === sectionId);
    const nextSection = currIdx >= 0 && currIdx < sections.length - 1 ? sections[currIdx + 1] : null;

    let nextSectionId: string | null = null;
    if (nextSection) {
      nextSectionId = nextSection.id;
      if (!sectionStates[nextSection.id] || sectionStates[nextSection.id].status === 'NOT_STARTED') {
        sectionStates[nextSection.id] = {
          status: 'IN_PROGRESS',
          started_at: new Date().toISOString(),
        };
      }
    }

    await db.updateParticipant(attemptId, {
      current_section_id: nextSectionId || participant.current_section_id,
      section_states: sectionStates,
    });

    res.json({
      success: true,
      submittedSectionId: sectionId,
      locked: lockAfterSub,
      nextSectionId,
      isLastSection: !nextSection,
      sectionStates,
    });
  } catch (err: any) {
    console.error('Error in POST /:attemptId/sections/:sectionId/submit:', err);
    res.status(500).json({ error: 'Failed to submit section.' });
  }
});

// 5. Security Violation Recording
router.post('/:attemptId/security-event', async (req: Request, res: Response): Promise<void> => {
  try {
    const attemptId = req.params.attemptId as string;
    const { eventType, details } = req.body;

    const participant = await db.getParticipantById(attemptId);
    if (!participant) {
      res.status(404).json({ error: 'Attempt not found.' });
      return;
    }

    const exam = await db.getExamById(participant.exam_id);
    const maxViolations = exam?.max_violations || 3;

    const { event, totalViolations, participant: updatedPart } = await db.recordSecurityEvent(
      attemptId,
      eventType,
      details || 'Detected browser security violation'
    );

    const isTerminated = totalViolations >= maxViolations;
    if (isTerminated && updatedPart) {
      await db.updateParticipant(attemptId, {
        status: 'TERMINATED',
        submitted_at: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      eventId: event.id,
      totalViolations,
      maxViolations,
      warning: `Warning ${Math.min(totalViolations, maxViolations)}/${maxViolations}`,
      terminated: isTerminated,
    });
  } catch (err: any) {
    console.error('Error in POST /:attemptId/security-event:', err);
    res.status(500).json({ error: 'Failed to record security violation.' });
  }
});

// 6. Final Exam Submission (Computes Question Breakdown & Section Breakdown)
router.post('/:attemptId/final-submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const attemptId = req.params.attemptId as string;
    const { reason, draftCodes } = req.body;
    const participant = await db.getParticipantById(attemptId);
    if (!participant) {
      res.status(404).json({ error: 'Attempt not found.' });
      return;
    }

    const exam = await db.getExamById(participant.exam_id);
    if (!exam) {
      res.status(404).json({ error: 'Exam not found.' });
      return;
    }

    const sections = await db.getSectionsByExam(exam.id);
    const questions = await db.getQuestionsByExam(exam.id);
    const submissions = await db.getSubmissionsByParticipant(attemptId);

    // Auto-evaluate any unsubmitted coding problems if candidate wrote code
    if (draftCodes && typeof draftCodes === 'object') {
      for (const q of questions) {
        if (q.question_type === 'CODING') {
          const hasSubmission = submissions.some((s) => s.question_id === q.id);
          const draft = draftCodes[q.id];
          if (!hasSubmission && draft && draft.code && typeof draft.code === 'string' && draft.code.trim().length > 15) {
            try {
              const evalRes = await evaluateAndSaveCodingSubmission(
                participant.id,
                q,
                draft.language || 'java',
                draft.code
              );
              submissions.push(evalRes.submission);
            } catch (err) {
              console.error('Auto-evaluating draft submission error for question ' + q.id, err);
            }
          }
        }
      }
    }

    let totalScore = 0;
    let questionsAnswered = 0;
    let passedTestCases = 0;
    let totalTestCases = 0;

    const breakdown = await Promise.all(
      questions.map(async (q) => {
        const qSubmissions = submissions.filter((s) => s.question_id === q.id);
        const bestSub = qSubmissions.reduce<any>((best, curr) => {
          if (!best || curr.score > best.score) return curr;
          return best;
        }, null);

        const isCoding = q.question_type === 'CODING';
        const allTc = isCoding ? await db.getAllTestCasesForExecution(q.id) : [];
        const qTotalTestCases = isCoding ? (allTc.length || 1) : 1;
        totalTestCases += qTotalTestCases;

        if (bestSub) {
          questionsAnswered++;
          totalScore += bestSub.score;
          passedTestCases += bestSub.passed_test_cases;
          return {
            question_id: q.id,
            section_id: q.section_id || undefined,
            question_title: q.title,
            question_type: q.question_type,
            score: bestSub.score,
            max_marks: q.marks,
            status: bestSub.status,
            passed_cases: bestSub.passed_test_cases,
            total_cases: qTotalTestCases,
            selected_option_id: bestSub.selected_option_id,
          };
        }

        return {
          question_id: q.id,
          section_id: q.section_id || undefined,
          question_title: q.title,
          question_type: q.question_type,
          score: 0,
          max_marks: q.marks,
          status: 'Not Answered' as any,
          passed_cases: 0,
          total_cases: qTotalTestCases,
        };
      })
    );

    // Compute Section Breakdown if sections exist
    const sectionBreakdown = sections.map((sec) => {
      const secQuestions = questions.filter((q) => q.section_id === sec.id);
      let secScore = 0;
      let secMaxMarks = 0;
      let secAnswered = 0;
      let secPassedTcs = 0;
      let secTotalTcs = 0;

      secQuestions.forEach((q) => {
        secMaxMarks += q.marks;
        const b = breakdown.find((item) => item.question_id === q.id);
        if (b) {
          secScore += b.score;
          if (b.status !== 'Not Answered') secAnswered++;
          secPassedTcs += b.passed_cases;
          secTotalTcs += b.total_cases;
        }
      });

      return {
        section_id: sec.id,
        section_name: sec.name,
        question_type: sec.question_type,
        score: Math.max(0, secScore),
        max_marks: secMaxMarks || sec.total_marks || 0,
        questions_answered: secAnswered,
        total_questions: secQuestions.length,
        passed_test_cases: secPassedTcs,
        total_test_cases: secTotalTcs,
      };
    });

    const startedTime = new Date(participant.started_at).getTime();
    const timeTakenSeconds = Math.round((Date.now() - startedTime) / 1000);

    const examResult: ExamResult = {
      id: `res-${Date.now()}`,
      participant_id: participant.id,
      exam_id: exam.id,
      student_name: participant.name,
      roll_number: participant.roll_number,
      email: participant.email,
      total_score: Math.max(0, totalScore),
      total_marks: exam.total_marks,
      time_taken_seconds: timeTakenSeconds,
      questions_answered: questionsAnswered,
      total_questions: questions.length,
      passed_test_cases: passedTestCases,
      total_test_cases: totalTestCases,
      violations_count: participant.violations_count || 0,
      status: participant.status === 'TERMINATED' ? 'TERMINATED' : 'SUBMITTED',
      submitted_at: new Date().toISOString(),
      breakdown,
      section_breakdown: sectionBreakdown.length > 0 ? sectionBreakdown : undefined,
    };

    await db.saveExamResult(examResult);
    await db.updateParticipant(attemptId, {
      status: participant.status === 'TERMINATED' ? 'TERMINATED' : 'SUBMITTED',
      submitted_at: examResult.submitted_at,
    });

    res.json({
      success: true,
      result: examResult,
    });
  } catch (err: any) {
    console.error('Error in POST /:attemptId/final-submit:', err);
    res.status(500).json({ error: 'Failed to submit exam.' });
  }
});

// 7. Get Exam Result
router.get('/:attemptId/result', async (req: Request, res: Response): Promise<void> => {
  try {
    const attemptId = req.params.attemptId as string;
    const result = await db.getResultByParticipantId(attemptId);

    if (!result) {
      res.status(404).json({ error: 'Result not found or exam not yet submitted.' });
      return;
    }

    res.json(result);
  } catch (err: any) {
    console.error('Error in GET /:attemptId/result:', err);
    res.status(500).json({ error: 'Failed to get result.' });
  }
});

export default router;
