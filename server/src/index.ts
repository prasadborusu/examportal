import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import examRouter from './routes/exam.js';
import adminRouter from './routes/admin.js';
import { db } from './db.js';
import axios from 'axios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../../client/dist');

const app = express();
const PORT = process.env.PORT || 5000;
const PISTON_URL = process.env.PISTON_URL || 'http://localhost:2000';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Public exam view
app.get('/api/exams/:id', async (req, res) => {
  const exam = await db.getExamById(req.params.id as string);
  if (!exam) {
    res.status(404).json({ error: 'Exam not found' });
    return;
  }
  res.json({
    id: exam.id,
    title: exam.title,
    description: exam.description,
    duration_minutes: exam.duration_minutes,
    total_marks: exam.total_marks,
    status: exam.status,
    allowed_languages: exam.allowed_languages,
  });
});

// Health check with Piston status
app.get('/api/health', async (_req, res) => {
  let pistonOnline = false;
  let runtimesCount = 0;
  try {
    const pistonRes = await axios.get(`${PISTON_URL}/api/v2/runtimes`, { timeout: 3000 });
    pistonOnline = true;
    runtimesCount = Array.isArray(pistonRes.data) ? pistonRes.data.length : 0;
  } catch (e) {
    pistonOnline = false;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    piston: {
      url: PISTON_URL,
      connected: pistonOnline,
      runtimesCount,
    },
  });
});

// Routes
app.use('/api/exam', examRouter);
app.use('/api/admin', adminRouter);

// Events API (Dynamic & Supabase-backed)
app.get('/api/events', async (_req, res) => {
  try {
    const events = await db.getEvents();
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const event = await db.createEvent(req.body);
    res.status(201).json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    await db.deleteEvent(req.params.id as string);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend static build in production if available
if (fs.existsSync(clientDist)) {
  console.log(`[ANVESHANA SERVER] Serving production frontend build from: ${clientDist}`);
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[ANVESHANA SERVER] Running on http://localhost:${PORT}`);
  console.log(`[ANVESHANA SERVER] Piston API target: ${PISTON_URL}`);
});
