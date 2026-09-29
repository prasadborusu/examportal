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
      exam_type,
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
      title: title || 'New Assessment',
      description: description || '',
      exam_type: exam_type || 'FULL',
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
  if (req.body.passkey !== undefined) {
    const cleanPasskey = String(req.body.passkey).trim();
    if (!/^\d{4}$/.test(cleanPasskey)) {
      res.status(400).json({ error: 'Passkey must be exactly 4 numeric digits.' });
      return;
    }
    const existing = await db.getActiveExamByPasskey(cleanPasskey);
    if (existing && existing.id !== id) {
      res.status(400).json({
        error: `Passkey "${cleanPasskey}" is already in use by active assessment "${existing.title}". Please choose a different 4-digit passkey.`
      });
      return;
    }
    req.body.passkey = cleanPasskey;
  }
  const updated = await db.updateExam(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Exam not found' });
    return;
  }
  res.json(updated);
});

router.put('/exams/:id/passkey', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { passkey } = req.body;
  const cleanPasskey = String(passkey || '').trim();
  if (!/^\d{4}$/.test(cleanPasskey)) {
    res.status(400).json({ error: 'Passkey must be exactly 4 numeric digits.' });
    return;
  }
  const existing = await db.getActiveExamByPasskey(cleanPasskey);
  if (existing && existing.id !== id) {
    res.status(400).json({
      error: `Passkey "${cleanPasskey}" is already in use by active assessment "${existing.title}". Please choose a different 4-digit passkey.`
    });
    return;
  }
  const updated = await db.updateExam(id, { passkey: cleanPasskey });
  if (!updated) {
    res.status(404).json({ error: 'Exam not found' });
    return;
  }
  res.json({ success: true, passkey: cleanPasskey, exam: updated });
});

router.delete('/exams/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const ok = await db.deleteExam(id);
  res.json({ success: ok });
});

// Section Management Routes
router.get('/exams/:id/sections', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const sections = await db.getSectionsByExam(id);
    res.json(sections);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

router.post('/exams/:id/sections', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const {
      name,
      description,
      question_type,
      duration_minutes,
      total_marks,
      question_limit,
      navigation_mode,
      lock_after_submission,
      allow_previous_section,
      order_number,
    } = req.body;

    const existing = await db.getSectionsByExam(id);
    const finalOrder = Number(order_number) || existing.length + 1;

    const newSection = await db.createSection({
      exam_id: id,
      name: name || `Section ${finalOrder}`,
      description: description || '',
      question_type: question_type || 'MIXED',
      duration_minutes: Number(duration_minutes) || 30,
      total_marks: Number(total_marks) || 30,
      question_limit: question_limit ? Number(question_limit) : undefined,
      navigation_mode: navigation_mode || 'FREE',
      lock_after_submission: Boolean(lock_after_submission),
      allow_previous_section: allow_previous_section !== undefined ? Boolean(allow_previous_section) : true,
      order_number: finalOrder,
    });

    res.status(201).json(newSection);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create section: ' + err.message });
  }
});

router.get('/sections/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const section = await db.getSectionById(id);
    if (!section) {
      res.status(404).json({ error: 'Section not found' });
      return;
    }
    res.json(section);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch section' });
  }
});

router.put('/sections/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updated = await db.updateSection(id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Section not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update section: ' + err.message });
  }
});

router.delete('/sections/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const ok = await db.deleteSection(id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

router.post('/exams/:id/sections/reorder', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { sectionIds } = req.body;
    if (!Array.isArray(sectionIds)) {
      res.status(400).json({ error: 'sectionIds array is required' });
      return;
    }
    const updated = await db.reorderSections(id, sectionIds);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reorder sections' });
  }
});

router.post('/sections/:id/duplicate', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const duplicated = await db.duplicateSection(id);
    if (!duplicated) {
      res.status(404).json({ error: 'Section not found' });
      return;
    }
    res.status(201).json(duplicated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to duplicate section' });
  }
});

// Questions Management
router.get('/exams/:id/questions', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const sectionId = req.query.sectionId as string | undefined;
    const questions = await db.getQuestionsByExam(id, sectionId || null);
    const questionsWithTestCases = await Promise.all(
      questions.map(async (q) => ({
        ...q,
        test_cases: q.question_type !== 'MCQ' ? await db.getAllTestCasesForExecution(q.id) : [],
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
      section_id,
      question_type,
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
      options,
      correct_option_id,
      explanation,
      negative_marks,
      test_cases,
    } = req.body;

    // Determine next order_number if not provided
    let finalOrder = Number(order_number);
    if (!finalOrder || isNaN(finalOrder)) {
      const existing = await db.getQuestionsByExam(id, section_id || null);
      finalOrder = existing.length + 1;
    }

    const newQ = await db.createQuestion({
      exam_id: id,
      section_id: section_id || null,
      question_type: question_type || 'CODING',
      title: title || (question_type === 'MCQ' ? 'Untitled MCQ Question' : 'Untitled Problem'),
      description: description || '',
      input_format: input_format || '',
      output_format: output_format || '',
      constraints: constraints || '',
      examples: Array.isArray(examples) ? examples : [],
      difficulty: difficulty || 'Easy',
      marks: Number(marks) || (question_type === 'MCQ' ? 2 : 10),
      time_limit: Number(time_limit) || 3000,
      order_number: finalOrder,
      starter_templates: starter_templates || {},
      options: Array.isArray(options) ? options : [],
      correct_option_id: correct_option_id || '',
      explanation: explanation || '',
      negative_marks: Number(negative_marks) || 0,
    });

    if (newQ.question_type !== 'MCQ' && Array.isArray(test_cases)) {
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
      test_cases: newQ.question_type !== 'MCQ' ? await db.getAllTestCasesForExecution(newQ.id) : [],
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
