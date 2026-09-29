import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Copy,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Layers,
  HelpCircle,
  FileCode,
  X,
  Loader2,
  Check,
  FileText,
} from 'lucide-react';
import { QuestionDifficulty, Exam, Section, MCQOption } from '../../types';

interface ExampleItem {
  input: string;
  output: string;
  explanation: string;
}

interface TestCaseItem {
  id?: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
  type: 'PUBLIC' | 'HIDDEN';
  marks: number;
}

const defaultStarterTemplates = {
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
        
    }
}`,
  cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}`,
  python: `import sys

def main():
    # Read standard input
    input_data = sys.stdin.read().split()
    # Write your solution here
    
if __name__ == '__main__':
    main()`,
  c: `#include <stdio.h>

int main() {
    // Write your solution here
    
    return 0;
}`,
};

export const AdminQuestionEdit: React.FC = () => {
  const { examId, questionId } = useParams<{ examId: string; questionId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditing = Boolean(questionId);

  // Exam and Sections context
  const [exam, setExam] = useState<Exam | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<'CODING' | 'MCQ'>('CODING');

  // Form states
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('Easy');
  const [marks, setMarks] = useState<number>(10);
  const [timeLimit, setTimeLimit] = useState<number>(3000);
  const [description, setDescription] = useState('');

  // MCQ Form states
  const [mcqOptions, setMcqOptions] = useState<MCQOption[]>([
    { id: 'opt-1', text: '' },
    { id: 'opt-2', text: '' },
    { id: 'opt-3', text: '' },
    { id: 'opt-4', text: '' },
  ]);
  const [correctOptionId, setCorrectOptionId] = useState<string>('opt-1');
  const [negativeMarks, setNegativeMarks] = useState<number>(0);
  const [explanation, setExplanation] = useState<string>('');

  // Coding Form states
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraints, setConstraints] = useState('');

  // Examples
  const [examples, setExamples] = useState<ExampleItem[]>([
    { input: '', output: '', explanation: '' },
  ]);

  // Starter Code
  const [selectedLanguage, setSelectedLanguage] = useState<'java' | 'cpp' | 'python' | 'c'>('java');
  const [starterTemplates, setStarterTemplates] = useState<Record<string, string>>({
    ...defaultStarterTemplates,
  });

  // Test cases
  const [testCases, setTestCases] = useState<TestCaseItem[]>([
    { input: '', expected_output: '', is_hidden: false, type: 'PUBLIC', marks: 5 },
    { input: '', expected_output: '', is_hidden: true, type: 'HIDDEN', marks: 5 },
  ]);

  // Test case modal state
  const [editingTcIndex, setEditingTcIndex] = useState<number | null>(null);
  const [isTcModalOpen, setIsTcModalOpen] = useState(false);
  const [modalTcInput, setModalTcInput] = useState('');
  const [modalTcOutput, setModalTcOutput] = useState('');
  const [modalTcType, setModalTcType] = useState<'PUBLIC' | 'HIDDEN'>('PUBLIC');
  const [modalTcMarks, setModalTcMarks] = useState<number>(5);

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<number>(1);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load Exam and Section Info
  useEffect(() => {
    if (!examId) return;

    fetch(`/api/admin/exams/${examId}`)
      .then((res) => res.json())
      .then((ex: Exam) => {
        setExam(ex);
        if (!isEditing) {
          if (ex.exam_type === 'MCQ') {
            setQuestionType('MCQ');
            setMarks(2);
          } else if (ex.exam_type === 'CODING') {
            setQuestionType('CODING');
            setMarks(10);
          }
        }
      })
      .catch(console.error);

    fetch(`/api/admin/exams/${examId}/sections`)
      .then((res) => res.json())
      .then((secs: Section[]) => {
        if (Array.isArray(secs)) {
          setSections(secs);
          const paramSecId = searchParams.get('sectionId');
          if (!isEditing) {
            if (paramSecId && secs.some((s) => s.id === paramSecId)) {
              setSelectedSectionId(paramSecId);
              const foundSec = secs.find((s) => s.id === paramSecId);
              if (foundSec?.question_type === 'MCQ') {
                setQuestionType('MCQ');
                setMarks(2);
              } else if (foundSec?.question_type === 'CODING') {
                setQuestionType('CODING');
                setMarks(foundSec.total_marks > 20 ? 20 : 10);
              }
            } else if (secs.length > 0) {
              setSelectedSectionId(secs[0].id);
              if (secs[0].question_type === 'MCQ') {
                setQuestionType('MCQ');
                setMarks(2);
              } else if (secs[0].question_type === 'CODING') {
                setQuestionType('CODING');
                setMarks(secs[0].total_marks > 20 ? 20 : 10);
              }
            }
          }
        }
      })
      .catch(console.error);
  }, [examId, isEditing, searchParams]);

  // Load existing question if editing, or determine next order if new
  useEffect(() => {
    if (!examId) return;

    if (isEditing && questionId) {
      setLoading(true);
      fetch(`/api/admin/questions/${questionId}`)
        .then((res) => res.json())
        .then((q) => {
          setTitle(q.title || '');
          setDifficulty(q.difficulty || 'Easy');
          setMarks(Number(q.marks) || 10);
          setTimeLimit(Number(q.time_limit) || 3000);
          setDescription(q.description || '');
          setCurrentOrder(Number(q.order_number) || 1);

          if (q.question_type) {
            setQuestionType(q.question_type);
          }
          if (q.section_id) {
            setSelectedSectionId(q.section_id);
          }

          // MCQ data
          if (Array.isArray(q.options) && q.options.length > 0) {
            setMcqOptions(q.options);
          }
          if (q.correct_option_id) {
            setCorrectOptionId(q.correct_option_id);
          }
          if (q.negative_marks !== undefined) {
            setNegativeMarks(Number(q.negative_marks) || 0);
          }
          if (q.explanation) {
            setExplanation(q.explanation);
          }

          // Coding data
          setInputFormat(q.input_format || '');
          setOutputFormat(q.output_format || '');
          setConstraints(q.constraints || '');

          if (Array.isArray(q.examples) && q.examples.length > 0) {
            setExamples(q.examples);
          }
          if (q.starter_templates) {
            setStarterTemplates({
              java: q.starter_templates.java || defaultStarterTemplates.java,
              cpp: q.starter_templates.cpp || defaultStarterTemplates.cpp,
              python: q.starter_templates.python || defaultStarterTemplates.python,
              c: q.starter_templates.c || defaultStarterTemplates.c,
            });
          }
          if (Array.isArray(q.test_cases)) {
            setTestCases(
              q.test_cases.map((tc: any) => ({
                id: tc.id,
                input: tc.input || '',
                expected_output: tc.expected_output || '',
                is_hidden: Boolean(tc.is_hidden || tc.type === 'HIDDEN'),
                type: tc.type || (tc.is_hidden ? 'HIDDEN' : 'PUBLIC'),
                marks: Number(tc.marks) || 5,
              }))
            );
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      // Fetch existing questions to find next order_number
      fetch(`/api/admin/exams/${examId}/questions`)
        .then((r) => r.json())
        .then((list) => {
          if (Array.isArray(list)) {
            setCurrentOrder(list.length + 1);
          }
        })
        .catch(console.error);
    }
  }, [examId, questionId, isEditing]);

  // Example handlers
  const handleAddExample = () => {
    setExamples([...examples, { input: '', output: '', explanation: '' }]);
  };

  const handleRemoveExample = (idx: number) => {
    if (examples.length === 1) return;
    setExamples(examples.filter((_, i) => i !== idx));
  };

  const handleExampleChange = (idx: number, field: keyof ExampleItem, val: string) => {
    const updated = [...examples];
    updated[idx] = { ...updated[idx], [field]: val };
    setExamples(updated);
  };

  // Test Case Modal handlers
  const openNewTestCaseModal = () => {
    setEditingTcIndex(null);
    setModalTcInput('');
    setModalTcOutput('');
    setModalTcType('PUBLIC');
    setModalTcMarks(5);
    setIsTcModalOpen(true);
  };

  const openEditTestCaseModal = (index: number) => {
    const tc = testCases[index];
    setEditingTcIndex(index);
    setModalTcInput(tc.input);
    setModalTcOutput(tc.expected_output);
    setModalTcType(tc.type || (tc.is_hidden ? 'HIDDEN' : 'PUBLIC'));
    setModalTcMarks(tc.marks);
    setIsTcModalOpen(true);
  };

  const handleSaveTestCaseModal = () => {
    const newTc: TestCaseItem = {
      ...(editingTcIndex !== null ? { id: testCases[editingTcIndex].id } : {}),
      input: modalTcInput,
      expected_output: modalTcOutput,
      is_hidden: modalTcType === 'HIDDEN',
      type: modalTcType,
      marks: Number(modalTcMarks) || 5,
    };

    if (editingTcIndex !== null) {
      const updated = [...testCases];
      updated[editingTcIndex] = newTc;
      setTestCases(updated);
      showToast('Test case updated');
    } else {
      setTestCases([...testCases, newTc]);
      showToast('Test case added');
    }
    setIsTcModalOpen(false);
  };

  const handleDeleteTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
    showToast('Test case removed');
  };

  const handleDuplicateTestCase = (index: number) => {
    const tc = testCases[index];
    const cloned: TestCaseItem = {
      input: tc.input,
      expected_output: tc.expected_output,
      is_hidden: tc.is_hidden,
      type: tc.type,
      marks: tc.marks,
    };
    setTestCases([...testCases, cloned]);
    showToast('Test case duplicated');
  };

  // Submit Question
  const handleSave = async (andAddAnother = false) => {
    if (!title.trim()) {
      alert('Please enter a question title.');
      return;
    }
    if (!description.trim()) {
      alert('Please provide a problem statement or question description.');
      return;
    }

    if (questionType === 'MCQ') {
      const validOptions = mcqOptions.filter((o) => o.text.trim().length > 0);
      if (validOptions.length < 2) {
        alert('Multiple choice questions require at least 2 non-empty options.');
        return;
      }
      if (!correctOptionId || !mcqOptions.some((o) => o.id === correctOptionId && o.text.trim())) {
        alert('Please designate one valid option as the correct answer.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        difficulty,
        marks: Number(marks) || (questionType === 'MCQ' ? 2 : 10),
        order_number: currentOrder,
        section_id: selectedSectionId || null,
        question_type: questionType,
      };

      if (questionType === 'MCQ') {
        payload.options = mcqOptions.map((o) => ({ id: o.id, text: o.text.trim() }));
        payload.correct_option_id = correctOptionId;
        payload.negative_marks = Number(negativeMarks) || 0;
        payload.explanation = explanation.trim();
      } else {
        payload.time_limit = Number(timeLimit) || 3000;
        payload.input_format = inputFormat.trim();
        payload.output_format = outputFormat.trim();
        payload.constraints = constraints.trim();
        payload.examples = examples.filter((ex) => ex.input.trim() || ex.output.trim());
        payload.starter_templates = starterTemplates;
        payload.test_cases = testCases;
      }

      const url = isEditing
        ? `/api/admin/questions/${questionId}`
        : `/api/admin/exams/${examId}/questions`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save question');
      }

      if (andAddAnother) {
        showToast(`Question ${currentOrder} saved! Ready for Question ${currentOrder + 1}.`);
        // Reset form for next question
        setTitle('');
        setDescription('');
        if (questionType === 'MCQ') {
          setMcqOptions([
            { id: 'opt-1', text: '' },
            { id: 'opt-2', text: '' },
            { id: 'opt-3', text: '' },
            { id: 'opt-4', text: '' },
          ]);
          setCorrectOptionId('opt-1');
          setExplanation('');
        } else {
          setInputFormat('');
          setOutputFormat('');
          setConstraints('');
          setExamples([{ input: '', output: '', explanation: '' }]);
          setStarterTemplates({ ...defaultStarterTemplates });
          setTestCases([
            { input: '', expected_output: '', is_hidden: false, type: 'PUBLIC', marks: 5 },
            { input: '', expected_output: '', is_hidden: true, type: 'HIDDEN', marks: 5 },
          ]);
        }
        setCurrentOrder((prev) => prev + 1);
        if (isEditing) {
          navigate(`/admin/exams/${examId}/questions/new`);
        }
      } else {
        navigate(`/admin/exams/${examId}/questions`);
      }
    } catch (err: any) {
      alert(err.message || 'Error saving question');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 text-[#0B2A5B] animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading problem details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B2A5B] text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-blue-400/30 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/admin/exams/${examId}/questions`)}
            className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs"
            title="Back to Question List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                {isEditing ? 'Edit Coding Problem' : `Add Question #${String(currentOrder).padStart(2, '0')}`}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0B2A5B] border border-blue-200 uppercase">
                Step 2: Problem Builder
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Configure problem definition, input/output constraints, starter code, and grading test cases
            </p>
          </div>
        </div>
      </div>

      {/* Form Cards */}
      <div className="space-y-5">
        {/* CARD 0: Architecture & Section Assignment */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-2 h-2 rounded-full bg-[#0B2A5B]" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Assessment Section & Question Type
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Section Selection */}
            {sections.length > 0 && (
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Assign to Section *</label>
                <select
                  value={selectedSectionId || ''}
                  onChange={(e) => {
                    const secId = e.target.value;
                    setSelectedSectionId(secId);
                    const found = sections.find((s) => s.id === secId);
                    if (found?.question_type === 'MCQ') {
                      setQuestionType('MCQ');
                      setMarks(2);
                    } else if (found?.question_type === 'CODING') {
                      setQuestionType('CODING');
                      setMarks(10);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-[#0B2A5B]"
                >
                  {sections.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      Section {idx + 1}: {s.name} ({s.question_type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Question Format Toggle */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Question Format *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={Boolean(
                    exam?.exam_type === 'MCQ' ||
                    (selectedSectionId && sections.find((s) => s.id === selectedSectionId)?.question_type === 'MCQ')
                  )}
                  onClick={() => {
                    setQuestionType('CODING');
                    if (marks === 2) setMarks(10);
                  }}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    questionType === 'CODING'
                      ? 'border-purple-600 bg-purple-50 text-purple-800 ring-2 ring-purple-600/10'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  <span>Coding Problem</span>
                </button>

                <button
                  type="button"
                  disabled={Boolean(
                    exam?.exam_type === 'CODING' ||
                    (selectedSectionId && sections.find((s) => s.id === selectedSectionId)?.question_type === 'CODING')
                  )}
                  onClick={() => {
                    setQuestionType('MCQ');
                    if (marks === 10) setMarks(2);
                  }}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    questionType === 'MCQ'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/10'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Multiple Choice (MCQ)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 1: Basic Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-2 h-2 rounded-full bg-[#0B2A5B]" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Problem Details & Marks
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
            {/* Title */}
            <div className="sm:col-span-12 space-y-1.5">
              <label className="font-semibold text-slate-700">
                {questionType === 'MCQ' ? 'Question Statement / Prompt *' : 'Question Title *'}
              </label>
              <input
                type="text"
                required
                placeholder={
                  questionType === 'MCQ'
                    ? 'e.g. Which of the following data structures provides O(1) average lookup time?'
                    : 'e.g. Reverse Linked List, Two Sum, Binary Tree Level Order'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B2A5B]"
              />
            </div>

            {/* Difficulty */}
            <div className={`space-y-1.5 ${questionType === 'CODING' ? 'sm:col-span-4' : 'sm:col-span-6'}`}>
              <label className="font-semibold text-slate-700">Difficulty Level *</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-[#0B2A5B]"
              >
                <option value="Easy">Easy (Fundamentals)</option>
                <option value="Medium">Medium (Intermediate)</option>
                <option value="Hard">Hard (Advanced)</option>
              </select>
            </div>

            {/* Marks */}
            <div className={`space-y-1.5 ${questionType === 'CODING' ? 'sm:col-span-4' : 'sm:col-span-6'}`}>
              <label className="font-semibold text-slate-700">Marks Assigned *</label>
              <input
                type="number"
                min="1"
                max="100"
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0B2A5B]"
              />
            </div>

            {/* Time Limit for Coding */}
            {questionType === 'CODING' && (
              <div className="sm:col-span-4 space-y-1.5">
                <label className="font-semibold text-slate-700">CPU Time Limit (ms)</label>
                <input
                  type="number"
                  min="500"
                  max="3000"
                  step="500"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0B2A5B]"
                />
                <span className="text-[10px] text-slate-400">Default: 3000ms max allowed by Piston</span>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: Description / Question Statement Body */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-2 h-2 rounded-full bg-[#0B2A5B]" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {questionType === 'MCQ' ? '3. Extended Context & Code Snippets' : '3. Problem Statement *'}
            </h3>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-semibold text-slate-700">
              {questionType === 'MCQ'
                ? 'Additional description, code block, or question context (Optional)'
                : 'Description & Detailed Task (Markdown supported)'}
            </label>
            <textarea
              rows={questionType === 'MCQ' ? 4 : 6}
              required={questionType === 'CODING'}
              placeholder={
                questionType === 'MCQ'
                  ? 'Paste code snippets or additional context if needed for this question...'
                  : 'Clearly state the algorithmic problem, input rules, and expected behavior...'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-[#0B2A5B] leading-relaxed"
            />
          </div>
        </div>

        {/* IF MCQ: Render Options Builder Card */}
        {questionType === 'MCQ' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  4. MCQ Options & Correct Answer
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Click radio icon to designate the single correct answer
              </span>
            </div>

            <div className="space-y-3">
              {mcqOptions.map((opt, idx) => {
                const isCorrect = correctOptionId === opt.id;
                const letter = String.fromCharCode(65 + idx);
                return (
                  <div
                    key={opt.id}
                    className={`p-3.5 rounded-xl border transition flex items-center gap-3 ${
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Radio Button */}
                    <button
                      type="button"
                      onClick={() => setCorrectOptionId(opt.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer ${
                        isCorrect
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 text-transparent hover:border-emerald-400'
                      }`}
                      title={isCorrect ? 'Correct Answer' : 'Mark as Correct Answer'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    {/* Letter Badge */}
                    <span className="w-6 h-6 rounded-md bg-slate-100 font-bold text-slate-700 text-xs flex items-center justify-center shrink-0">
                      {letter}
                    </span>

                    {/* Option Text Input */}
                    <input
                      type="text"
                      required
                      placeholder={`Option ${letter} statement...`}
                      value={opt.text}
                      onChange={(e) => {
                        const updated = [...mcqOptions];
                        updated[idx].text = e.target.value;
                        setMcqOptions(updated);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#0B2A5B]"
                    />

                    {/* Delete Option */}
                    {mcqOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = mcqOptions.filter((_, i) => i !== idx);
                          setMcqOptions(updated);
                          if (correctOptionId === opt.id) {
                            setCorrectOptionId(updated[0]?.id || '');
                          }
                        }}
                        className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                        title="Delete Option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Add Option Button */}
              {mcqOptions.length < 8 && (
                <button
                  type="button"
                  onClick={() => {
                    const newId = `opt-${Date.now()}-${mcqOptions.length + 1}`;
                    setMcqOptions([...mcqOptions, { id: newId, text: '' }]);
                  }}
                  className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/20 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option ({String.fromCharCode(65 + mcqOptions.length)})</span>
                </button>
              )}
            </div>

            {/* Negative Marks & Explanation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Negative Marks for Wrong Selection</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.25"
                  value={negativeMarks}
                  onChange={(e) => setNegativeMarks(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0B2A5B]"
                />
                <span className="text-[10px] text-slate-400">e.g. 0.5 marks deducted if incorrect</span>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Explanation / Solution Note (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Rationale shown to coordinators and post-exam review..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0B2A5B]"
                />
              </div>
            </div>
          </div>
        )}

        {/* IF CODING: Render Input/Output Format, Constraints, Examples, Templates, Test Cases */}
        {questionType === 'CODING' && (
          <>
            {/* CARD 4: Input / Output Format & Constraints */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-2 h-2 rounded-full bg-[#0B2A5B]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  4. Input / Output Format & Constraints
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Input Format */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Input Format</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. First line contains integer n. Second line contains n space-separated integers."
                    value={inputFormat}
                    onChange={(e) => setInputFormat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0B2A5B]"
                  />
                </div>

                {/* Output Format */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Output Format</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Print single integer representing the maximum subarray sum."
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0B2A5B]"
                  />
                </div>

                {/* Constraints */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="font-semibold text-slate-700">Constraints</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 1 <= n <= 10^5, -10^9 <= a[i] <= 10^9"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#0B2A5B]"
                  />
                </div>
              </div>
            </div>

        {/* CARD 4: Examples */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0B2A5B]" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                4. Examples
              </h3>
            </div>
            <button
              type="button"
              onClick={handleAddExample}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#0B2A5B] flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Example</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {examples.map((ex, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Example {idx + 1}</span>
                  {examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExample(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remove Example"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Example Input</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. 4\n2 7 11 15\n9"
                      value={ex.input}
                      onChange={(e) => handleExampleChange(idx, 'input', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:border-[#0B2A5B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Example Output</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. 0 1"
                      value={ex.output}
                      onChange={(e) => handleExampleChange(idx, 'output', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:border-[#0B2A5B]"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Explanation (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Because nums[0] + nums[1] == 9, we return [0, 1]."
                      value={ex.explanation}
                      onChange={(e) => handleExampleChange(idx, 'explanation', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#0B2A5B]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 5: Starter Code */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0B2A5B]" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                5. Starter Code Templates
              </h3>
            </div>
            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['java', 'cpp', 'python', 'c'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition ${
                    selectedLanguage === lang
                      ? 'bg-white text-[#0B2A5B] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {lang === 'cpp' ? 'C++' : lang}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Edit starter skeleton for <strong>{selectedLanguage.toUpperCase()}</strong>:</span>
              <button
                type="button"
                onClick={() =>
                  setStarterTemplates({
                    ...starterTemplates,
                    [selectedLanguage]: defaultStarterTemplates[selectedLanguage],
                  })
                }
                className="text-[11px] text-[#2563EB] hover:underline cursor-pointer"
              >
                Reset to default template
              </button>
            </div>

            {/* High-Contrast Code Editor Window */}
            <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-md bg-[#0D1525]">
              <div className="flex items-center justify-between px-4 py-2 bg-[#09101D] border-b border-slate-800 text-slate-400 text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 font-medium text-slate-300">
                    Solution.{selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage === 'python' ? 'py' : selectedLanguage}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  {selectedLanguage.toUpperCase()} Starter Skeleton
                </span>
              </div>
              <textarea
                rows={10}
                value={starterTemplates[selectedLanguage] || ''}
                onChange={(e) =>
                  setStarterTemplates({
                    ...starterTemplates,
                    [selectedLanguage]: e.target.value,
                  })
                }
                style={{
                  backgroundColor: '#0D1525',
                  color: '#F1F5F9',
                  caretColor: '#38BDF8',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  lineHeight: '1.65',
                  tabSize: 4,
                }}
                className="w-full px-4 py-3 text-xs font-mono focus:outline-none resize-y selection:bg-blue-600/40 selection:text-white"
                spellCheck={false}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Students will see this exact starter code when selecting {selectedLanguage.toUpperCase()} in their exam interface.
            </p>
          </div>
        </div>

        {/* CARD 6: Test Cases Management */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0B2A5B]" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                6. Test Cases ({testCases.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={openNewTestCaseModal}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0B2A5B] text-white hover:bg-[#123773] transition flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Test Case</span>
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Configure both <strong>Public</strong> (visible to students for dry runs) and <strong>Hidden</strong> test cases (evaluated securely on the backend; never exposed to student frontend).
          </p>

          {/* Test cases list table */}
          {testCases.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
              No test cases added. Click "+ Add Test Case" to configure sample and hidden validation cases.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Input</th>
                    <th className="py-2.5 px-3">Expected Output</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Marks</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {testCases.map((tc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-3 max-w-[150px] truncate text-slate-800">
                        {tc.input.replace(/\n/g, '\\n') || '<empty>'}
                      </td>
                      <td className="py-2.5 px-3 max-w-[150px] truncate text-slate-800">
                        {tc.expected_output.replace(/\n/g, '\\n')}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            tc.type === 'HIDDEN' || tc.is_hidden
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {tc.type || (tc.is_hidden ? 'HIDDEN' : 'PUBLIC')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-sans font-semibold">
                        {tc.marks} pts
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditTestCaseModal(idx)}
                            className="p-1 rounded text-slate-500 hover:text-[#0B2A5B] hover:bg-slate-100"
                            title="Edit Test Case"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateTestCase(idx)}
                            className="p-1 rounded text-slate-500 hover:text-purple-600 hover:bg-purple-50"
                            title="Duplicate"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTestCase(idx)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        )}
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(`/admin/exams/${examId}/questions`)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold border border-[#0B2A5B] text-[#0B2A5B] hover:bg-blue-50 transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save & Add Another</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave(false)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0B2A5B] text-white hover:bg-[#123773] transition flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : 'Save Question'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Adding / Editing a Test Case */}
      {isTcModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTcIndex !== null ? 'Edit Test Case' : 'Add Test Case'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTcModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Type selection */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Test Case Type</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="tcType"
                      checked={modalTcType === 'PUBLIC'}
                      onChange={() => setModalTcType('PUBLIC')}
                      className="text-[#0B2A5B]"
                    />
                    <span>Public (Visible for candidate testing)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="tcType"
                      checked={modalTcType === 'HIDDEN'}
                      onChange={() => setModalTcType('HIDDEN')}
                      className="text-[#0B2A5B]"
                    />
                    <span>Hidden (Backend evaluation only)</span>
                  </label>
                </div>
              </div>

              {/* Input */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Input Data</label>
                <textarea
                  rows={4}
                  placeholder="Raw standard input data passed to stdin..."
                  value={modalTcInput}
                  onChange={(e) => setModalTcInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-[#0B2A5B]"
                />
              </div>

              {/* Expected Output */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Expected Output</label>
                <textarea
                  rows={3}
                  placeholder="Exact expected standard output..."
                  value={modalTcOutput}
                  onChange={(e) => setModalTcOutput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-[#0B2A5B]"
                />
              </div>

              {/* Marks */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Points / Marks for this case</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={modalTcMarks}
                  onChange={(e) => setModalTcMarks(Number(e.target.value))}
                  className="w-32 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0B2A5B]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTcModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTestCaseModal}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0B2A5B] text-white hover:bg-[#123773]"
              >
                Save Test Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
