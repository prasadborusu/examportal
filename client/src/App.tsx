import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public Layout
import { PublicLayout } from './components/PublicLayout';

// Student Exam Flow
import { ExamEntry } from './pages/ExamEntry';
import { ExamPasskey } from './pages/ExamPasskey';
import { ExamInstructions } from './pages/ExamInstructions';
import { ExamInterface } from './pages/ExamInterface';
import { ExamResultView } from './pages/ExamResultView';

// Admin Portal
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminExams } from './pages/admin/AdminExams';
import { AdminCreateExam } from './pages/admin/AdminCreateExam';
import { AdminExamQuestions } from './pages/admin/AdminExamQuestions';
import { AdminQuestionEdit } from './pages/admin/AdminQuestionEdit';
import { AdminExamReview } from './pages/admin/AdminExamReview';
import { AdminQuestionBuilder } from './pages/admin/AdminQuestionBuilder';
import { AdminParticipants } from './pages/admin/AdminParticipants';
import { AdminSubmissions } from './pages/admin/AdminSubmissions';
import { AdminResults } from './pages/admin/AdminResults';
import { AdminLiveMonitor } from './pages/admin/AdminLiveMonitor';
import { AdminSecurityLogs } from './pages/admin/AdminSecurityLogs';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Exam Portal Shell (with Navbar & Footer) */}
        <Route element={<PublicLayout />}>
          {/* Main Landing is now the Exam Entry Portal directly */}
          <Route path="/" element={<ExamEntry />} />
          <Route path="/coding-exam" element={<ExamEntry />} />
          <Route path="/exam/entry" element={<ExamEntry />} />
          <Route path="/exam/passkey" element={<ExamPasskey />} />
          <Route path="/exam/instructions" element={<ExamInstructions />} />
          <Route path="/exam/:attemptId/result" element={<ExamResultView />} />
        </Route>

        {/* Secure Fullscreen Distraction-Free Coding Exam Interface */}
        <Route path="/exam/:attemptId" element={<ExamInterface />} />

        {/* Admin Coordinator & Proctoring Control Room */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="exams" element={<AdminExams />} />
          <Route path="exams/create" element={<AdminCreateExam />} />
          <Route path="exams/:examId" element={<AdminExamQuestions />} />
          <Route path="exams/:examId/questions" element={<AdminExamQuestions />} />
          <Route path="exams/:examId/questions/new" element={<AdminQuestionEdit />} />
          <Route path="exams/:examId/questions/:questionId/edit" element={<AdminQuestionEdit />} />
          <Route path="exams/:examId/review" element={<AdminExamReview />} />
          <Route path="questions" element={<AdminQuestionBuilder />} />
          <Route path="participants" element={<AdminParticipants />} />
          <Route path="submissions" element={<AdminSubmissions />} />
          <Route path="results" element={<AdminResults />} />
          <Route path="live" element={<AdminLiveMonitor />} />
          <Route path="security" element={<AdminSecurityLogs />} />
        </Route>

        {/* Redirect all other URLs to the Exam Portal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
