import { Router, Request, Response } from 'express';
import { db } from '../db.js';

const router = Router();

function adminAuth(req: Request, res: Response, next: () => void) {
  next();
}

router.use(adminAuth);

// Admin Login
router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;
  if ((email === 'admin@anveshana.club' || email === 'admin') && (password === 'admin123' || password === 'anveshana2026')) {
    res.json({
      success: true,
      token: 'anveshana-admin-session-token-' + Date.now(),
      admin: {
        name: 'Administrator',
        email: 'admin@anveshana.club',
        role: 'SUPER_ADMIN',
      },
    });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials.' });
  }
});

// Admin Dashboard Overview Stats
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await db.getDashboardStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Exams Management
router.get('/exams', async (_req: Request, res: Response): Promise<void> => {
  try {
    const exams = await db.getExams();
    res.json(exams);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

router.post('/exams', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      passkey,
      duration_minutes,
      total_marks,
      start_time,
      end_time,
      status,
      max_violations,
      allowed_languages,
    } = req.body;

    const finalPasskey = passkey || String(Math.floor(1000 + Math.random() * 9000));

    const newExam = await db.createExam({
      title: title || 'New Coding Assessment',
      description: description || '',
      passkey: finalPasskey,
      duration_minutes: Number(duration_minutes) || 60,
      total_marks: Number(total_marks) || 100,
      start_time: start_time || new Date().toISOString(),
      end_time: end_time || new Date(Date.now() + 86400000).toISOString(),
      status: status || 'LIVE',
      max_violations: Number(max_violations) || 3,
      allowed_languages: allowed_languages || ['java', 'c++', 'python', 'c'],
    });

    res.status(201).json(newExam);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

router.get('/exams/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const exam = await db.getExamById(id);
  if (!exam) {
    res.status(404).json({ error: 'Exam not found' });
    return;
  }
  res.json(exam);
});

router.put('/exams/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const updated = await db.updateExam(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Exam not found' });
    return;
  }
  res.json(updated);
});

router.delete('/exams/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const ok = await db.deleteExam(id);
  res.json({ success: ok });
});

// Questions Management
router.get('/exams/:id/questions', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const questions = await db.getQuestionsByExam(id);
    const questionsWithTestCases = await Promise.all(
      questions.map(async (q) => ({
        ...q,
        test_cases: await db.getAllTestCasesForExecution(q.id),
      }))
    );
    res.json(questionsWithTestCases);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

router.post('/exams/:id/questions', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const {
      title,
      description,
      input_format,
      output_format,
      constraints,
      examples,
      difficulty,
      marks,
      time_limit,
      order_number,
      starter_templates,
      test_cases,
    } = req.body;

    // Determine next order_number if not provided
    let finalOrder = Number(order_number);
    if (!finalOrder || isNaN(finalOrder)) {
      const existing = await db.getQuestionsByExam(id);
      finalOrder = existing.length + 1;
    }

    const newQ = await db.createQuestion({
      exam_id: id,
      title: title || 'Untitled Problem',
      description: description || '',
      input_format: input_format || '',
      output_format: output_format || '',
      constraints: constraints || '',
      examples: Array.isArray(examples) ? examples : [],
      difficulty: difficulty || 'Easy',
      marks: Number(marks) || 10,
      time_limit: Number(time_limit) || 3000,
      order_number: finalOrder,
      starter_templates: starter_templates || {},
    });

    if (Array.isArray(test_cases)) {
      for (const tc of test_cases) {
        await db.createTestCase({
          question_id: newQ.id,
          input: tc.input || '',
          expected_output: tc.expected_output || '',
          is_hidden: tc.type === 'HIDDEN' || Boolean(tc.is_hidden),
          type: tc.type || (tc.is_hidden ? 'HIDDEN' : 'PUBLIC'),
          marks: Number(tc.marks) || 5,
        });
      }
    }

    const fullQ = {
      ...newQ,
      test_cases: await db.getAllTestCasesForExecution(newQ.id),
    };

    res.status(201).json(fullQ);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create question: ' + err.message });
  }
});

// Single Question Details
router.get('/questions/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const question = await db.getQuestionById(id);
    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }
    const testCases = await db.getAllTestCasesForExecution(id);
    res.json({
      ...question,
      test_cases: testCases,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

router.put('/questions/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { test_cases, ...updates } = req.body;
    const updated = await db.updateQuestion(id, updates);
    if (!updated) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    // If test cases provided in update, sync them
    if (Array.isArray(test_cases)) {
      const existingTcs = await db.getAllTestCasesForExecution(id);
      const incomingIds = new Set(test_cases.filter((tc: any) => tc.id).map((tc: any) => tc.id));

      // Remove deleted
      for (const tc of existingTcs) {
        if (!incomingIds.has(tc.id)) {
          await db.deleteTestCase(tc.id);
        }
      }

      // Upsert / create
      for (const tc of test_cases) {
        if (tc.id && existingTcs.some((x) => x.id === tc.id)) {
          await db.updateTestCase(tc.id, {
            input: tc.input,
            expected_output: tc.expected_output,
            is_hidden: tc.type === 'HIDDEN' || Boolean(tc.is_hidden),
            type: tc.type || (tc.is_hidden ? 'HIDDEN' : 'PUBLIC'),
            marks: Number(tc.marks) || 5,
          });
        } else {
          await db.createTestCase({
            question_id: id,
            input: tc.input || '',
            expected_output: tc.expected_output || '',
            is_hidden: tc.type === 'HIDDEN' || Boolean(tc.is_hidden),
            type: tc.type || (tc.is_hidden ? 'HIDDEN' : 'PUBLIC'),
            marks: Number(tc.marks) || 5,
          });
        }
      }
    }

    const testCases = await db.getAllTestCasesForExecution(id);
    res.json({ ...updated, test_cases: testCases });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update question: ' + err.message });
  }
});

router.delete('/questions/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const ok = await db.deleteQuestion(id);
  res.json({ success: ok });
});

// Reorder Questions
router.post('/exams/:id/questions/reorder', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds)) {
      res.status(400).json({ error: 'questionIds array is required' });
      return;
    }
    await db.reorderQuestions(id, questionIds);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reorder questions' });
  }
});

// Duplicate Question
router.post('/questions/:id/duplicate', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const cloned = await db.duplicateQuestion(id);
    if (!cloned) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }
    const testCases = await db.getAllTestCasesForExecution(cloned.id);
    res.status(201).json({ success: true, question: { ...cloned, test_cases: testCases }, ...cloned, test_cases: testCases });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to duplicate question' });
  }
});

// Activate Exam
router.post('/exams/:id/activate', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await db.activateExam(id);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ success: true, exam: result.exam });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to activate exam' });
  }
});

// Test Cases Management
router.post('/questions/:id/testcases', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { input, expected_output, is_hidden, type, marks } = req.body;
  const isHidden = type === 'HIDDEN' || Boolean(is_hidden);
  const newTc = await db.createTestCase({
    question_id: id,
    input: input || '',
    expected_output: expected_output || '',
    is_hidden: isHidden,
    type: isHidden ? 'HIDDEN' : 'PUBLIC',
    marks: Number(marks) || 5,
  });
  res.status(201).json(newTc);
});

router.put('/testcases/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const updated = await db.updateTestCase(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Test case not found' });
    return;
  }
  res.json(updated);
});

router.delete('/testcases/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const ok = await db.deleteTestCase(id);
  res.json({ success: ok });
});

// Participants (global & per-exam)
router.get('/participants', async (_req: Request, res: Response): Promise<void> => {
  const participants = await db.getParticipantsByExam('all');
  res.json(participants);
});

router.get('/exams/:id/participants', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const participants = await db.getParticipantsByExam(id);
  res.json(participants);
});

// Submissions (global & per-exam)
router.get('/submissions', async (_req: Request, res: Response): Promise<void> => {
  const submissions = await db.getSubmissionsByExam('all');
  res.json(submissions);
});

router.get('/exams/:id/submissions', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const submissions = await db.getSubmissionsByExam(id);
  res.json(submissions);
});

// Exam Results (global & per-exam)
router.get('/results', async (_req: Request, res: Response): Promise<void> => {
  const results = await db.getResultsByExam('all');
  res.json(results);
});

router.get('/exams/:id/results', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const results = await db.getResultsByExam(id);
  res.json(results);
});

// Security Events (global & per-exam)
router.get('/security', async (_req: Request, res: Response): Promise<void> => {
  const events = await db.getSecurityEventsByExam('all');
  res.json(events);
});

router.get('/exams/:id/security', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const events = await db.getSecurityEventsByExam(id);
  res.json(events);
});

// Live Exam Monitoring Helper
const handleLiveMonitor = async (examId: string, res: Response) => {
  try {
    const isAll = !examId || examId === 'all';
    const participants = await db.getParticipantsByExam(isAll ? 'all' : examId);
    const results = await db.getResultsByExam(isAll ? 'all' : examId);

    const studentsOnline = participants.filter((p) => p.status === 'CODING' || p.status === 'WARNING').length;
    const currentlyCoding = participants.filter((p) => p.status === 'CODING').length;
    const submitted = participants.filter((p) => p.status === 'SUBMITTED').length;
    const warnings = participants.filter((p) => p.status === 'WARNING' || p.violations_count > 0).length;
    const terminated = participants.filter((p) => p.status === 'TERMINATED').length;

    const liveTable = participants.map((p) => {
      const resItem = results.find((r) => r.participant_id === p.id);
      return {
        id: p.id,
        examId: p.exam_id,
        examTitle: p.exam_title || 'Assessment',
        name: p.name,
        rollNumber: p.roll_number,
        email: p.email,
        status: p.status,
        score: resItem?.total_score || 0,
        violations: p.violations_count || 0,
        startedAt: p.started_at,
        submittedAt: p.submitted_at,
      };
    });

    res.json({
      metrics: {
        studentsOnline,
        currentlyCoding,
        submitted,
        warnings,
        terminated,
      },
      participants: liveTable,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve live telemetry' });
  }
};

router.get('/live', async (_req: Request, res: Response): Promise<void> => {
  await handleLiveMonitor('all', res);
});

router.get('/exams/:id/live', async (req: Request, res: Response): Promise<void> => {
  const examId = req.params.id as string;
  await handleLiveMonitor(examId, res);
});

export default router;
