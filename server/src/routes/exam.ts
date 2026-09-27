import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { executeCodeOnPiston } from '../piston.js';
import { SubmissionStatus, ExamResult } from '../types.js';

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

    const rawQuestions = await db.getQuestionsByExam(exam.id);
    const questions = await Promise.all(
      rawQuestions.map(async (q) => {
        const sanitizedTestCases = await db.getTestCasesByQuestion(q.id, false);
        return {
          ...q,
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
      },
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

    const testCases = await db.getAllTestCasesForExecution(questionId);
    if (testCases.length === 0) {
      testCases.push({
        id: 'tc-dummy',
        question_id: questionId,
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
        // STRICT SECURITY: Never expose hidden test case input/output to frontend
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

    const submission = await db.createSubmission({
      participant_id: participant.id,
      question_id: question.id,
      language,
      code,
      status,
      score: totalMarksEarned,
      passed_test_cases: passedCount,
      total_test_cases: testCases.length,
      execution_time_ms: totalTimeMs,
      memory_kb: Math.round(maxMemoryMb * 1024),
    });

    res.json({
      success: true,
      submissionId: submission.id,
      status,
      score: totalMarksEarned,
      maxMarks: question.marks,
      passedTestCases: passedCount,
      totalTestCases: testCases.length,
      executionTimeMs: totalTimeMs,
      memoryMb: maxMemoryMb,
      testCases: testCaseResults,
      compilationError: compilationError ? compilationErrorOutput : null,
    });
  } catch (err: any) {
    console.error('Error in POST /:attemptId/submit:', err);
    res.status(500).json({ error: 'Failed to evaluate submission.' });
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

// 6. Final Exam Submission
router.post('/:attemptId/final-submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const attemptId = req.params.attemptId as string;
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

    const questions = await db.getQuestionsByExam(exam.id);
    const submissions = await db.getSubmissionsByParticipant(attemptId);

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

        const allTc = await db.getAllTestCasesForExecution(q.id);
        totalTestCases += allTc.length || 1;

        if (bestSub) {
          questionsAnswered++;
          totalScore += bestSub.score;
          passedTestCases += bestSub.passed_test_cases;
          return {
            question_id: q.id,
            question_title: q.title,
            score: bestSub.score,
            max_marks: q.marks,
            status: bestSub.status,
            passed_cases: bestSub.passed_test_cases,
            total_cases: bestSub.total_test_cases,
          };
        }

        return {
          question_id: q.id,
          question_title: q.title,
          score: 0,
          max_marks: q.marks,
          status: 'Not Answered' as any,
          passed_cases: 0,
          total_cases: allTc.length,
        };
      })
    );

    const startedTime = new Date(participant.started_at).getTime();
    const timeTakenSeconds = Math.round((Date.now() - startedTime) / 1000);

    const examResult: ExamResult = {
      id: `res-${Date.now()}`,
      participant_id: participant.id,
      exam_id: exam.id,
      student_name: participant.name,
      roll_number: participant.roll_number,
      email: participant.email,
      total_score: totalScore,
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
