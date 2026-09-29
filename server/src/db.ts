import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, isSupabaseConfigured } from './supabase.js';
import {
  Exam,
  Section,
  Question,
  TestCase,
  Participant,
  Submission,
  SecurityEvent,
  ExamResult,
  EventItem,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

interface DatabaseStore {
  exams: Exam[];
  sections: Section[];
  questions: Question[];
  testCases: TestCase[];
  participants: Participant[];
  submissions: Submission[];
  securityEvents: SecurityEvent[];
  examResults: ExamResult[];
  events: EventItem[];
}

// Clean initial data with zero demo participants, zero demo submissions, zero demo violations
function getInitialData(): DatabaseStore {
  const defaultExamId = 'exam-dsa-2026';
  const q1Id = 'q-two-sum';
  const q2Id = 'q-reverse-array';
  const q3Id = 'q-linked-list';
  const q4Id = 'q-binary-search';
  const q5Id = 'q-stack-impl';

  const exams: Exam[] = [
    {
      id: defaultExamId,
      title: 'Anveshana DSA Challenge',
      description: 'Central University Club annual competitive algorithmic and data structures assessment.',
      passkey: '4827',
      duration_minutes: 60,
      total_marks: 100,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 86400000).toISOString(),
      status: 'LIVE',
      max_violations: 3,
      allowed_languages: ['java', 'c++', 'python', 'c'],
      created_at: new Date().toISOString(),
    },
  ];

  const questions: Question[] = [
    {
      id: q1Id,
      exam_id: defaultExamId,
      title: 'Two Sum',
      description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.`,
      difficulty: 'Easy',
      marks: 10,
      order_number: 1,
      starter_templates: {
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }
        int target = sc.nextInt();
        
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < n; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                System.out.println(map.get(complement) + " " + i);
                return;
            }
            map.put(nums[i], i);
        }
    }
}`,
        python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    nums = [int(x) for x in lines[1:n+1]]
    target = int(lines[n+1])
    
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            print(f"{seen[diff]} {i}")
            return
        seen[num] = i

if __name__ == '__main__':
    main()`,
        cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int target;
    cin >> target;

    unordered_map<int, int> mp;
    for (int i = 0; i < n; i++) {
        int comp = target - nums[i];
        if (mp.count(comp)) {
            cout << mp[comp] << " " << i << endl;
            return 0;
        }
        mp[nums[i]] = i;
    }
    return 0;
}`,
        c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int nums[1000];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);
    int target;
    scanf("%d", &target);

    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (nums[i] + nums[j] == target) {
                printf("%d %d\\n", i, j);
                return 0;
            }
        }
    }
    return 0;
}`,
      },
      created_at: new Date().toISOString(),
    },
    {
      id: q2Id,
      exam_id: defaultExamId,
      title: 'Reverse Array',
      description: `Given an array of \`n\` integers, reverse the array in-place and print the elements separated by space.

### Input Format
First line contains integer \`n\`.
Second line contains \`n\` space-separated integers.

### Output Format
Print the reversed array separated by single space.`,
      difficulty: 'Easy',
      marks: 10,
      order_number: 2,
      starter_templates: {
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        
        for (int i = n - 1; i >= 0; i--) {
            System.out.print(arr[i] + (i > 0 ? " " : "\\n"));
        }
    }
}`,
        python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    arr = lines[1:n+1]
    print(" ".join(reversed(arr)))

if __name__ == '__main__':
    main()`,
        cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    for (int i = n - 1; i >= 0; i--) {
        cout << a[i] << (i > 0 ? " " : "\\n");
    }
    return 0;
}`,
        c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int a[1000];
    for (int i = 0; i < n; i++) scanf("%d", &a[i]);
    for (int i = n - 1; i >= 0; i--) {
        printf("%d%s", a[i], i > 0 ? " " : "\\n");
    }
    return 0;
}`,
      },
      created_at: new Date().toISOString(),
    },
    {
      id: q3Id,
      exam_id: defaultExamId,
      title: 'Linked List Cycle',
      description: `Given a representation of a linked list with \`n\` nodes and a position \`pos\` where the tail connects to (-1 if no cycle), determine if there is a cycle. Print "true" or "false".`,
      difficulty: 'Medium',
      marks: 20,
      order_number: 3,
      starter_templates: {
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        for (int i = 0; i < n; i++) sc.nextInt();
        int pos = sc.nextInt();
        System.out.println(pos >= 0 ? "true" : "false");
    }
}`,
        python: `import sys

def main():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    pos = int(data[n+1])
    print("true" if pos >= 0 else "false")

if __name__ == '__main__':
    main()`,
        cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    for (int i = 0; i < n; i++) { int x; cin >> x; }
    int pos;
    cin >> pos;
    cout << (pos >= 0 ? "true" : "false") << endl;
    return 0;
}`,
        c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    for (int i = 0; i < n; i++) { int x; scanf("%d", &x); }
    int pos;
    scanf("%d", &pos);
    printf("%s\\n", pos >= 0 ? "true" : "false");
    return 0;
}`,
      },
      created_at: new Date().toISOString(),
    },
    {
      id: q4Id,
      exam_id: defaultExamId,
      title: 'Binary Search',
      description: `Given a sorted array of \`n\` distinct integers and a \`target\` value, return the index if target is found. If not, return -1.`,
      difficulty: 'Easy',
      marks: 10,
      order_number: 4,
      starter_templates: {
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        int target = sc.nextInt();

        int left = 0, right = n - 1, ans = -1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] == target) { ans = mid; break; }
            else if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        System.out.println(ans);
    }
}`,
        python: `import sys

def main():
    nums = sys.stdin.read().split()
    if not nums:
        return
    n = int(nums[0])
    arr = [int(x) for x in nums[1:n+1]]
    target = int(nums[n+1])

    left, right = 0, n - 1
    ans = -1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            ans = mid
            break
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    print(ans)

if __name__ == '__main__':
    main()`,
        cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    int target;
    cin >> target;

    int left = 0, right = n - 1, ans = -1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (a[mid] == target) { ans = mid; break; }
        else if (a[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    cout << ans << endl;
    return 0;
}`,
        c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int a[1000];
    for (int i = 0; i < n; i++) scanf("%d", &a[i]);
    int target;
    scanf("%d", &target);

    int left = 0, right = n - 1, ans = -1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (a[mid] == target) { ans = mid; break; }
        else if (a[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    printf("%d\\n", ans);
    return 0;
}`,
      },
      created_at: new Date().toISOString(),
    },
    {
      id: q5Id,
      exam_id: defaultExamId,
      title: 'Stack Implementation',
      description: `Implement a basic min-stack operations processor: push X, pop, top, getMin.`,
      difficulty: 'Medium',
      marks: 20,
      order_number: 5,
      starter_templates: {
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Stack<Integer> stack = new Stack<>();
        Stack<Integer> minStack = new Stack<>();
        while (sc.hasNext()) {
            String op = sc.next();
            if (op.equals("push")) {
                int val = sc.nextInt();
                stack.push(val);
                if (minStack.isEmpty() || val <= minStack.peek()) {
                    minStack.push(val);
                }
            } else if (op.equals("pop")) {
                if (!stack.isEmpty()) {
                    int val = stack.pop();
                    if (!minStack.isEmpty() && val == minStack.peek()) {
                        minStack.pop();
                    }
                }
            } else if (op.equals("top")) {
                if (!stack.isEmpty()) System.out.println(stack.peek());
            } else if (op.equals("getMin")) {
                if (!minStack.isEmpty()) System.out.println(minStack.peek());
            }
        }
    }
}`,
        python: `import sys

def main():
    commands = sys.stdin.read().split()
    stack = []
    min_stack = []
    i = 0
    while i < len(commands):
        op = commands[i]
        if op == "push":
            val = int(commands[i+1])
            stack.append(val)
            if not min_stack or val <= min_stack[-1]:
                min_stack.append(val)
            i += 2
        elif op == "pop":
            if stack:
                val = stack.pop()
                if min_stack and val == min_stack[-1]:
                    min_stack.pop()
            i += 1
        elif op == "top":
            if stack:
                print(stack[-1])
            i += 1
        elif op == "getMin":
            if min_stack:
                print(min_stack[-1])
            i += 1
        else:
            i += 1

if __name__ == '__main__':
    main()`,
        cpp: `#include <iostream>
#include <stack>
#include <string>
using namespace std;

int main() {
    string op;
    stack<int> st, minSt;
    while (cin >> op) {
        if (op == "push") {
            int val; cin >> val;
            st.push(val);
            if (minSt.empty() || val <= minSt.top()) minSt.push(val);
        } else if (op == "pop") {
            if (!st.empty()) {
                int val = st.top(); st.pop();
                if (!minSt.empty() && val == minSt.top()) minSt.pop();
            }
        } else if (op == "top") {
            if (!st.empty()) cout << st.top() << endl;
        } else if (op == "getMin") {
            if (!minSt.empty()) cout << minSt.top() << endl;
        }
    }
    return 0;
}`,
        c: `#include <stdio.h>
#include <string.h>

int st[1000], minSt[1000];
int topSt = -1, topMin = -1;

int main() {
    char op[20];
    while (scanf("%s", op) == 1) {
        if (strcmp(op, "push") == 0) {
            int val; scanf("%d", &val);
            st[++topSt] = val;
            if (topMin == -1 || val <= minSt[topMin]) {
                minSt[++topMin] = val;
            }
        } else if (strcmp(op, "pop") == 0) {
            if (topSt >= 0) {
                int val = st[topSt--];
                if (topMin >= 0 && val == minSt[topMin]) topMin--;
            }
        } else if (strcmp(op, "top") == 0) {
            if (topSt >= 0) printf("%d\\n", st[topSt]);
        } else if (strcmp(op, "getMin") == 0) {
            if (topMin >= 0) printf("%d\\n", minSt[topMin]);
        }
    }
    return 0;
}`,
      },
      created_at: new Date().toISOString(),
    },
  ];

  const testCases: TestCase[] = [
    { id: 'tc-1-1', question_id: q1Id, input: '4\n2 7 11 15\n9', expected_output: '0 1', is_hidden: false, marks: 3 },
    { id: 'tc-1-2', question_id: q1Id, input: '3\n3 2 4\n6', expected_output: '1 2', is_hidden: false, marks: 3 },
    { id: 'tc-1-3', question_id: q1Id, input: '2\n3 3\n6', expected_output: '0 1', is_hidden: true, marks: 4 },
    { id: 'tc-2-1', question_id: q2Id, input: '5\n1 2 3 4 5', expected_output: '5 4 3 2 1', is_hidden: false, marks: 3 },
    { id: 'tc-2-2', question_id: q2Id, input: '3\n10 20 30', expected_output: '30 20 10', is_hidden: false, marks: 3 },
    { id: 'tc-2-3', question_id: q2Id, input: '6\n7 14 21 28 35 42', expected_output: '42 35 28 21 14 7', is_hidden: true, marks: 4 },
    { id: 'tc-3-1', question_id: q3Id, input: '4\n3 2 0 -4\n1', expected_output: 'true', is_hidden: false, marks: 6 },
    { id: 'tc-3-2', question_id: q3Id, input: '2\n1 2\n0', expected_output: 'true', is_hidden: false, marks: 7 },
    { id: 'tc-3-3', question_id: q3Id, input: '1\n1\n-1', expected_output: 'false', is_hidden: true, marks: 7 },
    { id: 'tc-4-1', question_id: q4Id, input: '6\n-1 0 3 5 9 12\n9', expected_output: '4', is_hidden: false, marks: 3 },
    { id: 'tc-4-2', question_id: q4Id, input: '6\n-1 0 3 5 9 12\n2', expected_output: '-1', is_hidden: false, marks: 3 },
    { id: 'tc-4-3', question_id: q4Id, input: '10\n2 5 8 12 16 23 38 56 72 91\n23', expected_output: '5', is_hidden: true, marks: 4 },
    { id: 'tc-5-1', question_id: q5Id, input: 'push 5 push 3 getMin pop getMin', expected_output: '3\n5', is_hidden: false, marks: 10 },
    { id: 'tc-5-2', question_id: q5Id, input: 'push 10 push 20 top getMin', expected_output: '20\n10', is_hidden: true, marks: 10 },
  ];

  // Completely empty participant, submission, violation, and result lists
  return {
    exams,
    sections: [],
    questions,
    testCases,
    participants: [],
    submissions: [],
    securityEvents: [],
    examResults: [],
    events: [],
  };
}

class Database {
  private store: DatabaseStore;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Always reset to clean data without demo students
    this.store = getInitialData();
    if (!this.store.sections) {
      this.store.sections = [];
    }
    this.save();

    // Auto-seed default exams and questions to Supabase if Supabase is connected but empty
    this.syncInitialDataToSupabaseIfEmpty();
  }

  async syncInitialDataToSupabaseIfEmpty() {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { count } = await supabase.from('exams').select('*', { count: 'exact', head: true });
      if (count === 0) {
        console.log('[ANVESHANA DB] Supabase database has 0 exams. Seeding initial assessment and questions...');
        const init = getInitialData();
        for (const exam of init.exams) {
          await supabase.from('exams').upsert([exam]);
        }
        for (const q of init.questions) {
          await supabase.from('questions').upsert([{
            id: q.id,
            exam_id: q.exam_id,
            title: q.title,
            description: q.description,
            difficulty: q.difficulty,
            marks: q.marks,
            order_number: q.order_number,
            starter_templates: q.starter_templates,
            question_type: q.question_type || 'CODING',
            created_at: q.created_at,
          }]);
        }
        for (const tc of init.testCases) {
          await supabase.from('test_cases').upsert([tc]);
        }
        console.log('[ANVESHANA DB] Initial assessment and questions seeded to Supabase.');
      }
    } catch (e) {
      console.error('[ANVESHANA DB] Error syncing initial data to Supabase:', e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write store file:', e);
    }
  }

  // 1. Exams
  async getExams(): Promise<Exam[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as Exam[];
    }
    return this.store.exams;
  }

  async getExamById(id: string): Promise<Exam | undefined> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('exams').select('*').eq('id', id).maybeSingle();
      if (!error && data) return data as Exam;
    }
    return this.store.exams.find((e) => e.id === id);
  }

  async getActiveExamByPasskey(passkey: string): Promise<Exam | undefined> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('passkey', passkey)
        .in('status', ['LIVE', 'ACTIVE', 'SCHEDULED', 'DRAFT'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) return data as Exam;
    }
    return this.store.exams.find(
      (e) => (e.status === 'LIVE' || e.status === 'ACTIVE' || e.status === 'SCHEDULED' || e.status === 'DRAFT') && e.passkey === passkey
    );
  }

  async createExam(examData: Omit<Exam, 'id' | 'created_at'>): Promise<Exam> {
    const finalData = {
      ...examData,
      exam_type: examData.exam_type || 'FULL',
      status: examData.status || 'DRAFT',
    };
    let newExam: Exam | null = null;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('exams').insert([finalData]).select().single();
        if (!error && data) {
          newExam = data as Exam;
        } else if (error) {
          // If exam_type column does not exist yet in Supabase schema
          const { exam_type, ...withoutType } = finalData;
          const fb = await supabase.from('exams').insert([withoutType]).select().single();
          if (!fb.error && fb.data) {
            newExam = { ...(fb.data as Exam), exam_type: finalData.exam_type };
          }
        }
      } catch (err) {
        console.warn('Supabase createExam error:', err);
      }
    }
    if (!newExam) {
      newExam = {
        ...finalData,
        id: `exam-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
    }
    this.store.exams.unshift(newExam);
    this.save();

    // Automatically create default section for MCQ and CODING exams
    if (newExam.exam_type === 'MCQ') {
      await this.createSection({
        exam_id: newExam.id,
        name: 'Multiple Choice Questions',
        description: 'Single and multiple choice assessment questions',
        question_type: 'MCQ',
        duration_minutes: newExam.duration_minutes,
        total_marks: newExam.total_marks,
        navigation_mode: 'FREE',
        lock_after_submission: false,
        allow_previous_section: true,
        order_number: 1,
      });
    } else if (newExam.exam_type === 'CODING') {
      await this.createSection({
        exam_id: newExam.id,
        name: 'Coding Problems',
        description: 'Algorithmic programming and data structures challenges',
        question_type: 'CODING',
        duration_minutes: newExam.duration_minutes,
        total_marks: newExam.total_marks,
        navigation_mode: 'FREE',
        lock_after_submission: false,
        allow_previous_section: true,
        order_number: 1,
      });
    }

    return newExam;
  }

  async updateExam(id: string, updates: Partial<Exam>): Promise<Exam | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('exams').update(updates).eq('id', id).select().single();
      if (error && updates.status === 'ACTIVE' && error.code === '23514') {
        const fallback = await supabase.from('exams').update({ ...updates, status: 'LIVE' }).eq('id', id).select().single();
        if (!fallback.error && fallback.data) return fallback.data as Exam;
      }
      if (!error && data) return data as Exam;
      if (error) console.error('Supabase updateExam error:', error);
    }
    const idx = this.store.exams.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    this.store.exams[idx] = { ...this.store.exams[idx], ...updates };
    this.save();
    return this.store.exams[idx];
  }

  async deleteExam(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      return !error;
    }
    const initialLen = this.store.exams.length;
    this.store.exams = this.store.exams.filter((e) => e.id !== id);
    this.store.sections = (this.store.sections || []).filter((s) => s.exam_id !== id);
    this.store.questions = this.store.questions.filter((q) => q.exam_id !== id);
    this.save();
    return this.store.exams.length < initialLen;
  }

  async activateExam(examId: string): Promise<{ success: boolean; error?: string; exam?: Exam }> {
    const exam = await this.getExamById(examId);
    if (!exam) return { success: false, error: 'Exam not found' };

    if (!exam.title || !exam.title.trim()) {
      return { success: false, error: 'Exam title is required.' };
    }
    if (!exam.passkey || !exam.passkey.trim()) {
      return { success: false, error: 'Exam passkey is required.' };
    }
    if (!exam.duration_minutes || exam.duration_minutes <= 0) {
      return { success: false, error: 'Exam duration must be greater than 0.' };
    }
    if (!exam.total_marks || exam.total_marks <= 0) {
      return { success: false, error: 'Total marks must be greater than 0.' };
    }

    const questions = await this.getQuestionsByExam(examId);
    const sections = await this.getSectionsByExam(examId);

    // Section 25 Validation Rules
    if (exam.exam_type === 'SECTIONAL') {
      if (sections.length === 0) {
        return { success: false, error: 'Sectional exam must have at least one section.' };
      }
      for (const sec of sections) {
        if (!sec.name.trim()) {
          return { success: false, error: `Section ${sec.order_number} must have a name.` };
        }
        const secQuestions = questions.filter((q) => q.section_id === sec.id);
        if (secQuestions.length === 0) {
          return { success: false, error: `Section "${sec.name}" has no questions. Please add at least one question.` };
        }
      }
    } else if (exam.exam_type === 'MCQ') {
      const mcqQuestions = questions.filter((q) => q.question_type === 'MCQ');
      if (mcqQuestions.length === 0) {
        return { success: false, error: 'MCQ exam must have at least one MCQ question.' };
      }
    } else if (exam.exam_type === 'CODING') {
      const codingQuestions = questions.filter((q) => q.question_type !== 'MCQ');
      if (codingQuestions.length === 0) {
        return { success: false, error: 'Coding exam must have at least one coding question.' };
      }
    } else {
      // FULL Exam
      if (questions.length === 0) {
        return { success: false, error: 'Full exam must have at least one question.' };
      }
    }

    // Validate MCQ questions have at least 2 options and a designated correct option
    for (const q of questions) {
      if (q.question_type === 'MCQ') {
        if (!q.options || q.options.length < 2) {
          return { success: false, error: `MCQ question "${q.title}" must have at least 2 options.` };
        }
        if (!q.correct_option_id) {
          return { success: false, error: `MCQ question "${q.title}" must have a designated correct answer.` };
        }
      }
    }

    const updated = await this.updateExam(examId, { status: 'ACTIVE' });
    return { success: true, exam: updated || exam };
  }

  // 1.5 Sections Management
  async getSectionsByExam(examId: string): Promise<Section[]> {
    let list: Section[] = [];
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('sections')
          .select('*')
          .eq('exam_id', examId)
          .order('order_number', { ascending: true });
        if (!error && data) {
          list = data as Section[];
        }
      } catch (err) {
        console.warn('Supabase getSectionsByExam fallback:', err);
      }
    }

    if (list.length === 0) {
      list = (this.store.sections || []).filter((s) => s.exam_id === examId);
    }

    // Attach questions_count to sections
    const allQuestions = await this.getQuestionsByExam(examId);
    return list
      .map((sec) => ({
        ...sec,
        questions_count: allQuestions.filter((q) => q.section_id === sec.id).length,
      }))
      .sort((a, b) => a.order_number - b.order_number);
  }

  async getSectionById(id: string): Promise<Section | undefined> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('sections').select('*').eq('id', id).maybeSingle();
        if (!error && data) return data as Section;
      } catch (err) {
        console.warn('Supabase getSectionById fallback:', err);
      }
    }
    return (this.store.sections || []).find((s) => s.id === id);
  }

  async createSection(sectionData: Omit<Section, 'id' | 'created_at'>): Promise<Section> {
    if (!this.store.sections) this.store.sections = [];
    const newSection: Section = {
      ...sectionData,
      id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('sections').insert([{
          ...sectionData,
          id: newSection.id,
        }]).select().single();
        if (!error && data) {
          const createdSec = data as Section;
          this.store.sections.push(createdSec);
          this.save();
          return createdSec;
        }
      } catch (err) {
        console.warn('Supabase createSection fallback:', err);
      }
    }

    this.store.sections.push(newSection);
    this.save();
    return newSection;
  }

  async updateSection(id: string, updates: Partial<Section>): Promise<Section | null> {
    if (!this.store.sections) this.store.sections = [];
    const updatedFields = { ...updates, updated_at: new Date().toISOString() };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('sections').update(updatedFields).eq('id', id).select().single();
        if (!error && data) {
          const idx = this.store.sections.findIndex((s) => s.id === id);
          if (idx !== -1) this.store.sections[idx] = data as Section;
          this.save();
          return data as Section;
        }
      } catch (err) {
        console.warn('Supabase updateSection fallback:', err);
      }
    }

    const idx = this.store.sections.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.store.sections[idx] = { ...this.store.sections[idx], ...updatedFields };
    this.save();
    return this.store.sections[idx];
  }

  async deleteSection(id: string): Promise<boolean> {
    if (!this.store.sections) this.store.sections = [];
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('sections').delete().eq('id', id);
      } catch (err) {}
    }
    const initialLen = this.store.sections.length;
    this.store.sections = this.store.sections.filter((s) => s.id !== id);
    // Unset section_id on questions that belonged to this section
    this.store.questions.forEach((q) => {
      if (q.section_id === id) q.section_id = null;
    });
    this.save();
    return this.store.sections.length < initialLen;
  }

  async reorderSections(examId: string, sectionIds: string[]): Promise<Section[]> {
    if (!this.store.sections) this.store.sections = [];
    for (let i = 0; i < sectionIds.length; i++) {
      const secId = sectionIds[i];
      const order = i + 1;
      await this.updateSection(secId, { order_number: order });
    }
    return this.getSectionsByExam(examId);
  }

  async duplicateSection(sectionId: string): Promise<Section | null> {
    const original = await this.getSectionById(sectionId);
    if (!original) return null;

    const existingSections = await this.getSectionsByExam(original.exam_id);
    const newSection = await this.createSection({
      exam_id: original.exam_id,
      name: `${original.name} (Copy)`,
      description: original.description || '',
      question_type: original.question_type,
      duration_minutes: original.duration_minutes,
      total_marks: original.total_marks,
      question_limit: original.question_limit,
      navigation_mode: original.navigation_mode,
      lock_after_submission: original.lock_after_submission,
      allow_previous_section: original.allow_previous_section,
      order_number: existingSections.length + 1,
    });

    // Duplicate questions belonging to this section
    const questions = await this.getQuestionsByExam(original.exam_id, sectionId);
    for (const q of questions) {
      const newQ = await this.createQuestion({
        exam_id: original.exam_id,
        section_id: newSection.id,
        question_type: q.question_type || 'CODING',
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        marks: q.marks,
        time_limit: q.time_limit,
        order_number: q.order_number,
        input_format: q.input_format,
        output_format: q.output_format,
        constraints: q.constraints,
        examples: q.examples,
        starter_templates: q.starter_templates,
        options: q.options,
        correct_option_id: q.correct_option_id,
        explanation: q.explanation,
        negative_marks: q.negative_marks,
      });

      const testCases = await this.getAllTestCasesForExecution(q.id);
      for (const tc of testCases) {
        await this.createTestCase({
          question_id: newQ.id,
          input: tc.input,
          expected_output: tc.expected_output,
          is_hidden: tc.is_hidden,
          type: tc.type,
          marks: tc.marks,
        });
      }
    }

    return newSection;
  }

  // 2. Questions Management
  async getQuestionsByExam(examId: string, sectionId?: string | null): Promise<Question[]> {
    let list: Question[] = [];
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('questions').select('*').eq('exam_id', examId).order('order_number');
        if (sectionId !== undefined && sectionId !== null) {
          query = query.eq('section_id', sectionId);
        }
        const { data, error } = await query;
        if (!error && data) {
          list = (data as any[]).map((q) => {
            const ext = q.starter_templates?.__extended || {};
            return {
              ...q,
              section_id: q.section_id !== undefined ? q.section_id : (ext.section_id || null),
              question_type: q.question_type || ext.question_type || 'CODING',
              options: q.options || ext.options || [],
              correct_option_id: q.correct_option_id || ext.correct_option_id || '',
              explanation: q.explanation || ext.explanation || '',
              negative_marks: q.negative_marks !== undefined ? q.negative_marks : (ext.negative_marks || 0),
              input_format: q.input_format || ext.input_format || '',
              output_format: q.output_format || ext.output_format || '',
              constraints: q.constraints || ext.constraints || '',
              examples: q.examples || ext.examples || [],
              time_limit: q.time_limit || ext.time_limit || 3000,
            } as Question;
          });
        }
      } catch (err) {
        console.warn('Supabase getQuestionsByExam fallback:', err);
      }
    }

    if (list.length === 0) {
      list = (this.store.questions || []).filter((q) => q.exam_id === examId);
      if (sectionId !== undefined && sectionId !== null) {
        list = list.filter((q) => q.section_id === sectionId);
      }
    }

    return list.sort((a, b) => a.order_number - b.order_number);
  }

  async getQuestionById(id: string): Promise<Question | undefined> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('questions').select('*').eq('id', id).maybeSingle();
        if (!error && data) {
          const ext = data.starter_templates?.__extended || {};
          return {
            ...data,
            section_id: data.section_id !== undefined ? data.section_id : (ext.section_id || null),
            question_type: data.question_type || ext.question_type || 'CODING',
            options: data.options || ext.options || [],
            correct_option_id: data.correct_option_id || ext.correct_option_id || '',
            explanation: data.explanation || ext.explanation || '',
            negative_marks: data.negative_marks !== undefined ? data.negative_marks : (ext.negative_marks || 0),
            input_format: data.input_format || ext.input_format || '',
            output_format: data.output_format || ext.output_format || '',
            constraints: data.constraints || ext.constraints || '',
            examples: data.examples || ext.examples || [],
            time_limit: data.time_limit || ext.time_limit || 3000,
          } as Question;
        }
      } catch (err) {
        console.warn('Supabase getQuestionById fallback:', err);
      }
    }
    return this.store.questions.find((q) => q.id === id);
  }

  async createQuestion(qData: Omit<Question, 'id' | 'created_at'>): Promise<Question> {
    const extData = {
      section_id: qData.section_id || null,
      question_type: qData.question_type || 'CODING',
      options: qData.options || [],
      correct_option_id: qData.correct_option_id || '',
      explanation: qData.explanation || '',
      negative_marks: qData.negative_marks || 0,
      input_format: qData.input_format || '',
      output_format: qData.output_format || '',
      constraints: qData.constraints || '',
      examples: qData.examples || [],
      time_limit: qData.time_limit || 3000,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const supabasePayload: any = {
          exam_id: qData.exam_id,
          section_id: qData.section_id || null,
          question_type: qData.question_type || 'CODING',
          title: qData.title,
          description: qData.description,
          difficulty: qData.difficulty,
          marks: qData.marks,
          order_number: qData.order_number,
          options: qData.options || [],
          correct_option_id: qData.correct_option_id || null,
          explanation: qData.explanation || null,
          negative_marks: qData.negative_marks || 0,
          starter_templates: {
            ...qData.starter_templates,
            __extended: extData,
          },
        };
        const { data, error } = await supabase.from('questions').insert([supabasePayload]).select().single();
        if (!error && data) {
          const createdQ: Question = {
            ...qData,
            id: data.id,
            section_id: data.section_id !== undefined ? data.section_id : extData.section_id,
            question_type: data.question_type || extData.question_type,
            options: data.options || extData.options,
            correct_option_id: data.correct_option_id || extData.correct_option_id,
            explanation: data.explanation || extData.explanation,
            created_at: data.created_at,
          };
          this.store.questions.push(createdQ);
          this.save();
          return createdQ;
        }
      } catch (err) {
        console.warn('Supabase createQuestion fallback:', err);
      }
    }

    const newQ: Question = {
      ...qData,
      id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      section_id: qData.section_id || null,
      question_type: qData.question_type || 'CODING',
      options: qData.options || [],
      correct_option_id: qData.correct_option_id || '',
      explanation: qData.explanation || '',
      negative_marks: qData.negative_marks || 0,
      created_at: new Date().toISOString(),
    };
    this.store.questions.push(newQ);
    this.save();
    return newQ;
  }

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const current = await this.getQuestionById(id);
        const mergedTemplates = {
          ...(current?.starter_templates || {}),
          ...(updates.starter_templates || {}),
          __extended: {
            section_id: updates.section_id !== undefined ? updates.section_id : (current?.section_id || null),
            question_type: updates.question_type !== undefined ? updates.question_type : (current?.question_type || 'CODING'),
            options: updates.options !== undefined ? updates.options : (current?.options || []),
            correct_option_id: updates.correct_option_id !== undefined ? updates.correct_option_id : (current?.correct_option_id || ''),
            explanation: updates.explanation !== undefined ? updates.explanation : (current?.explanation || ''),
            negative_marks: updates.negative_marks !== undefined ? updates.negative_marks : (current?.negative_marks || 0),
            input_format: updates.input_format !== undefined ? updates.input_format : (current?.input_format || ''),
            output_format: updates.output_format !== undefined ? updates.output_format : (current?.output_format || ''),
            constraints: updates.constraints !== undefined ? updates.constraints : (current?.constraints || ''),
            examples: updates.examples !== undefined ? updates.examples : (current?.examples || []),
            time_limit: updates.time_limit !== undefined ? updates.time_limit : (current?.time_limit || 3000),
          },
        };

        const supabaseUpdates: any = {};
        if (updates.title !== undefined) supabaseUpdates.title = updates.title;
        if (updates.description !== undefined) supabaseUpdates.description = updates.description;
        if (updates.difficulty !== undefined) supabaseUpdates.difficulty = updates.difficulty;
        if (updates.marks !== undefined) supabaseUpdates.marks = updates.marks;
        if (updates.order_number !== undefined) supabaseUpdates.order_number = updates.order_number;
        if (updates.section_id !== undefined) supabaseUpdates.section_id = updates.section_id;
        if (updates.question_type !== undefined) supabaseUpdates.question_type = updates.question_type;
        if (updates.options !== undefined) supabaseUpdates.options = updates.options;
        if (updates.correct_option_id !== undefined) supabaseUpdates.correct_option_id = updates.correct_option_id;
        if (updates.explanation !== undefined) supabaseUpdates.explanation = updates.explanation;
        if (updates.negative_marks !== undefined) supabaseUpdates.negative_marks = updates.negative_marks;
        supabaseUpdates.starter_templates = mergedTemplates;

        const { data, error } = await supabase.from('questions').update(supabaseUpdates).eq('id', id).select().single();
        if (!error && data) {
          const updatedQ = {
            ...data,
            ...updates,
          } as Question;
          const idx = this.store.questions.findIndex((q) => q.id === id);
          if (idx !== -1) this.store.questions[idx] = updatedQ;
          this.save();
          return updatedQ;
        }
      } catch (err) {
        console.warn('Supabase updateQuestion fallback:', err);
      }
    }

    const idx = this.store.questions.findIndex((q) => q.id === id);
    if (idx === -1) return null;
    this.store.questions[idx] = { ...this.store.questions[idx], ...updates };
    this.save();
    return this.store.questions[idx];
  }

  async deleteQuestion(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('questions').delete().eq('id', id);
      } catch (err) {}
    }
    const initialLen = this.store.questions.length;
    this.store.questions = this.store.questions.filter((q) => q.id !== id);
    this.store.testCases = this.store.testCases.filter((tc) => tc.question_id !== id);
    this.save();
    return this.store.questions.length < initialLen;
  }

  async reorderQuestions(examId: string, questionIds: string[], sectionId?: string | null): Promise<boolean> {
    for (let i = 0; i < questionIds.length; i++) {
      const qId = questionIds[i];
      const newOrder = i + 1;
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('questions').update({ order_number: newOrder }).eq('id', qId);
        } catch (err) {}
      }
      const q = this.store.questions.find((x) => x.id === qId);
      if (q) q.order_number = newOrder;
    }
    this.save();
    return true;
  }

  async duplicateQuestion(questionId: string): Promise<Question | null> {
    const original = await this.getQuestionById(questionId);
    if (!original) return null;

    const existingInExam = await this.getQuestionsByExam(original.exam_id, original.section_id);
    const newOrder = existingInExam.length + 1;

    const newQuestion = await this.createQuestion({
      exam_id: original.exam_id,
      section_id: original.section_id || null,
      question_type: original.question_type || 'CODING',
      title: `${original.title} (Copy)`,
      description: original.description,
      difficulty: original.difficulty,
      marks: original.marks,
      time_limit: original.time_limit || 3000,
      order_number: newOrder,
      input_format: original.input_format,
      output_format: original.output_format,
      constraints: original.constraints,
      examples: original.examples,
      starter_templates: original.starter_templates || {},
      options: original.options || [],
      correct_option_id: original.correct_option_id || '',
      explanation: original.explanation || '',
      negative_marks: original.negative_marks || 0,
    });

    const originalTcs = await this.getAllTestCasesForExecution(questionId);
    for (const tc of originalTcs) {
      await this.createTestCase({
        question_id: newQuestion.id,
        input: tc.input,
        expected_output: tc.expected_output,
        is_hidden: tc.is_hidden,
        type: (tc.type || (tc.is_hidden ? 'HIDDEN' : 'PUBLIC')) as 'PUBLIC' | 'HIDDEN',
        marks: tc.marks,
      });
    }

    return newQuestion;
  }

  // 3. Test Cases
  async getTestCasesByQuestion(questionId: string, includeHidden = false): Promise<TestCase[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('test_cases').select('*').eq('question_id', questionId);
      if (!includeHidden) {
        query = query.eq('is_hidden', false);
      }
      const { data, error } = await query;
      if (!error && data) {
        return (data as any[]).map((tc) => ({
          ...tc,
          type: tc.type || (tc.is_hidden ? 'HIDDEN' : 'PUBLIC'),
        })) as TestCase[];
      }
    }
    return this.store.testCases.filter((tc) => {
      if (tc.question_id !== questionId) return false;
      if (!includeHidden && (tc.is_hidden || tc.type === 'HIDDEN')) return false;
      return true;
    }).map((tc) => ({
      ...tc,
      type: tc.type || (tc.is_hidden ? 'HIDDEN' : 'PUBLIC'),
    })) as TestCase[];
  }

  async getAllTestCasesForExecution(questionId: string): Promise<TestCase[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('test_cases').select('*').eq('question_id', questionId);
      if (!error && data && data.length > 0) {
        return (data as any[]).map((tc) => ({
          ...tc,
          type: tc.type || (tc.is_hidden ? 'HIDDEN' : 'PUBLIC'),
        })) as TestCase[];
      }
    }
    return this.store.testCases
      .filter((tc) => tc.question_id === questionId)
      .map((tc) => ({
        ...tc,
        type: tc.type || (tc.is_hidden ? 'HIDDEN' : 'PUBLIC'),
      })) as TestCase[];
  }

  async createTestCase(tcData: Omit<TestCase, 'id'>): Promise<TestCase> {
    const isHidden = tcData.type === 'HIDDEN' || Boolean(tcData.is_hidden);
    const resolvedType: 'PUBLIC' | 'HIDDEN' = isHidden ? 'HIDDEN' : 'PUBLIC';
    const payload = {
      ...tcData,
      is_hidden: isHidden,
      type: resolvedType,
    };
    if (isSupabaseConfigured && supabase) {
      const supabasePayload = {
        question_id: tcData.question_id,
        input: tcData.input,
        expected_output: tcData.expected_output,
        is_hidden: isHidden,
        marks: tcData.marks,
      };
      const { data, error } = await supabase.from('test_cases').insert([supabasePayload]).select().single();
      if (!error && data) {
        return {
          ...data,
          type: resolvedType,
        } as TestCase;
      }
    }
    const newTc: TestCase = {
      ...payload,
      id: `tc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    this.store.testCases.push(newTc);
    this.save();
    return newTc;
  }

  async updateTestCase(id: string, updates: Partial<TestCase>): Promise<TestCase | null> {
    const isHidden = updates.type ? updates.type === 'HIDDEN' : updates.is_hidden;
    const resolvedType: 'PUBLIC' | 'HIDDEN' | undefined =
      isHidden !== undefined ? (isHidden ? 'HIDDEN' : 'PUBLIC') : undefined;
    const finalUpdates = {
      ...updates,
      ...(isHidden !== undefined ? { is_hidden: isHidden, type: resolvedType } : {}),
    };
    if (isSupabaseConfigured && supabase) {
      const supabaseUpdates: any = {};
      if (updates.input !== undefined) supabaseUpdates.input = updates.input;
      if (updates.expected_output !== undefined) supabaseUpdates.expected_output = updates.expected_output;
      if (isHidden !== undefined) supabaseUpdates.is_hidden = isHidden;
      if (updates.marks !== undefined) supabaseUpdates.marks = updates.marks;

      const { data, error } = await supabase.from('test_cases').update(supabaseUpdates).eq('id', id).select().single();
      if (!error && data) {
        return {
          ...data,
          type: resolvedType || (data.is_hidden ? 'HIDDEN' : 'PUBLIC'),
        } as TestCase;
      }
    }
    const idx = this.store.testCases.findIndex((tc) => tc.id === id);
    if (idx === -1) return null;
    this.store.testCases[idx] = { ...this.store.testCases[idx], ...finalUpdates } as TestCase;
    this.save();
    return this.store.testCases[idx];
  }

  async deleteTestCase(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('test_cases').delete().eq('id', id);
      return true;
    }
    const initialLen = this.store.testCases.length;
    this.store.testCases = this.store.testCases.filter((tc) => tc.id !== id);
    this.save();
    return this.store.testCases.length < initialLen;
  }

  // 4. Participants (Clean: zero demo records)
  async getParticipantsByExam(examId?: string): Promise<Participant[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('participants').select('*, exams(title)');
      if (examId && examId !== 'all') {
        query = query.eq('exam_id', examId);
      }
      const { data, error } = await query.order('started_at', { ascending: false });
      if (!error && data) {
        return (data as any[]).map((p) => ({
          ...p,
          exam_title: p.exams?.title || '',
        })) as Participant[];
      }
      if (error) console.error('Supabase getParticipantsByExam error:', error);
    }
    if (!examId || examId === 'all') return this.store.participants;
    return this.store.participants.filter((p) => p.exam_id === examId);
  }

  async getParticipantById(id: string): Promise<Participant | undefined> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('participants').select('*').eq('id', id).maybeSingle();
      if (!error && data) return data as Participant;
    }
    return this.store.participants.find((p) => p.id === id);
  }

  async createOrGetParticipant(
    examId: string,
    name: string,
    rollNumber: string,
    email: string
  ): Promise<Participant> {
    if (isSupabaseConfigured && supabase) {
      const { data: existing } = await supabase
        .from('participants')
        .select('*')
        .eq('exam_id', examId)
        .ilike('roll_number', rollNumber.trim())
        .maybeSingle();

      if (existing) return existing as Participant;

      const { data: created, error } = await supabase
        .from('participants')
        .insert([
          {
            exam_id: examId,
            name: name.trim(),
            roll_number: rollNumber.trim().toUpperCase(),
            email: email.trim().toLowerCase(),
            status: 'CODING',
            started_at: new Date().toISOString(),
            violations_count: 0,
          },
        ])
        .select()
        .single();

      if (!error && created) return created as Participant;
      if (error) console.error('Supabase createParticipant error:', error);
    }

    const cleanRoll = rollNumber.trim().toUpperCase();
    const existing = this.store.participants.find(
      (p) => p.exam_id === examId && p.roll_number === cleanRoll
    );
    if (existing) {
      return existing;
    }

    const newParticipant: Participant = {
      id: `attempt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      exam_id: examId,
      name: name.trim(),
      roll_number: cleanRoll,
      email: email.trim().toLowerCase(),
      status: 'CODING',
      started_at: new Date().toISOString(),
      violations_count: 0,
      created_at: new Date().toISOString(),
    };
    this.store.participants.unshift(newParticipant);
    this.save();
    return newParticipant;
  }

  async updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('participants').update(updates).eq('id', id).select().single();
      if (!error && data) return data as Participant;
    }
    const idx = this.store.participants.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.store.participants[idx] = { ...this.store.participants[idx], ...updates };
    this.save();
    return this.store.participants[idx];
  }

  // 5. Submissions
  async getSubmissionsByParticipant(participantId: string): Promise<Submission[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('submissions').select('*').eq('participant_id', participantId);
      if (!error && data) return data as Submission[];
    }
    return this.store.submissions.filter((s) => s.participant_id === participantId);
  }

  async getSubmissionsByExam(examId?: string): Promise<Submission[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('submissions')
        .select('*, participants(name, roll_number, exam_id), questions(title)');

      if (examId && examId !== 'all') {
        const { data: pList } = await supabase.from('participants').select('id').eq('exam_id', examId);
        const pIds = (pList || []).map((p: any) => p.id);
        if (pIds.length === 0) return [];
        query = query.in('participant_id', pIds);
      }

      const { data, error } = await query.order('submitted_at', { ascending: false });
      if (!error && data) {
        return (data as any[]).map((s) => ({
          ...s,
          student_name: s.participants?.name || 'Student',
          roll_number: s.participants?.roll_number || '',
          exam_id: s.participants?.exam_id || '',
          question_title: s.questions?.title || 'Problem',
        })) as Submission[];
      }
      if (error) console.error('Supabase getSubmissionsByExam error:', error);
    }
    if (!examId || examId === 'all') {
      return this.store.submissions.map((s) => {
        const p = this.store.participants.find((part) => part.id === s.participant_id);
        const q = this.store.questions.find((qst) => qst.id === s.question_id);
        return {
          ...s,
          student_name: p?.name || 'Student',
          roll_number: p?.roll_number || '',
          exam_id: p?.exam_id || '',
          question_title: q?.title || 'Problem',
        };
      });
    }
    const participantIds = new Set(
      this.store.participants.filter((p) => p.exam_id === examId).map((p) => p.id)
    );
    return this.store.submissions
      .filter((s) => participantIds.has(s.participant_id))
      .map((s) => {
        const p = this.store.participants.find((part) => part.id === s.participant_id);
        const q = this.store.questions.find((qst) => qst.id === s.question_id);
        return {
          ...s,
          student_name: p?.name || 'Student',
          roll_number: p?.roll_number || '',
          exam_id: p?.exam_id || '',
          question_title: q?.title || 'Problem',
        };
      });
  }

  async createSubmission(subData: Omit<Submission, 'id' | 'submitted_at'>): Promise<Submission> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('submissions').insert([subData]).select().single();
      if (!error && data) return data as Submission;
    }
    const newSub: Submission = {
      ...subData,
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      submitted_at: new Date().toISOString(),
    };
    this.store.submissions.unshift(newSub);
    this.save();
    return newSub;
  }

  async saveOrUpdateSubmission(subData: Omit<Submission, 'id' | 'submitted_at'>): Promise<Submission> {
    const existing = this.store.submissions.find(
      (s) => s.participant_id === subData.participant_id && s.question_id === subData.question_id
    );
    if (existing) {
      existing.score = subData.score;
      existing.status = subData.status;
      existing.selected_option_id = subData.selected_option_id;
      existing.language = subData.language;
      existing.code = subData.code;
      existing.passed_test_cases = subData.passed_test_cases;
      existing.total_test_cases = subData.total_test_cases;
      existing.execution_time_ms = subData.execution_time_ms;
      existing.memory_kb = subData.memory_kb;
      existing.submitted_at = new Date().toISOString();
      this.save();
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('submissions').update({
            score: existing.score,
            status: existing.status,
            code: existing.code,
            submitted_at: existing.submitted_at
          }).eq('id', existing.id);
        } catch (e) {
          // ignore error if supabase columns differ
        }
      }
      return existing;
    }
    return this.createSubmission(subData);
  }

  // 6. Security Events
  async recordSecurityEvent(
    participantId: string,
    eventType: SecurityEvent['event_type'],
    details: string
  ): Promise<{ event: SecurityEvent; totalViolations: number; participant: Participant | null }> {
    const participant = await this.getParticipantById(participantId);

    const newEvent: SecurityEvent = {
      id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participant_id: participantId,
      student_name: participant?.name || 'Student',
      roll_number: participant?.roll_number || '',
      event_type: eventType,
      details,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('security_events').insert([
        {
          participant_id: participantId,
          event_type: eventType,
          details,
        },
      ]);
    }

    this.store.securityEvents.unshift(newEvent);

    let updatedParticipant: Participant | null = null;
    if (participant) {
      const newCount = (participant.violations_count || 0) + 1;
      const newStatus = (newCount >= 3 && participant.status !== 'SUBMITTED' && participant.status !== 'TERMINATED')
        ? 'WARNING'
        : participant.status;

      updatedParticipant = await this.updateParticipant(participantId, {
        violations_count: newCount,
        status: newStatus,
      });
    }

    this.save();

    return {
      event: newEvent,
      totalViolations: updatedParticipant?.violations_count || 1,
      participant: updatedParticipant,
    };
  }

  async getSecurityEventsByExam(examId?: string): Promise<SecurityEvent[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('security_events')
        .select('*, participants(name, roll_number, exam_id)');

      if (examId && examId !== 'all') {
        const { data: pList } = await supabase.from('participants').select('id').eq('exam_id', examId);
        const pIds = (pList || []).map((p: any) => p.id);
        if (pIds.length === 0) return [];
        query = query.in('participant_id', pIds);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) {
        return (data as any[]).map((se) => ({
          id: se.id,
          participant_id: se.participant_id,
          student_name: se.participants?.name || 'Student',
          roll_number: se.participants?.roll_number || '',
          exam_id: se.participants?.exam_id || '',
          event_type: se.event_type,
          details: se.details,
          created_at: se.created_at,
        })) as SecurityEvent[];
      }
      if (error) console.error('Supabase getSecurityEventsByExam error:', error);
    }
    if (!examId || examId === 'all') return this.store.securityEvents;
    const participantIds = new Set(
      this.store.participants.filter((p) => p.exam_id === examId).map((p) => p.id)
    );
    return this.store.securityEvents.filter((se) => participantIds.has(se.participant_id));
  }

  // 7. Exam Results
  async saveExamResult(result: ExamResult): Promise<ExamResult> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('exam_results').upsert([result]).select().single();
      if (!error && data) return data as ExamResult;
    }
    const idx = this.store.examResults.findIndex((r) => r.participant_id === result.participant_id);
    if (idx !== -1) {
      this.store.examResults[idx] = result;
    } else {
      this.store.examResults.unshift(result);
    }
    this.save();
    return result;
  }

  async getResultByParticipantId(participantId: string): Promise<ExamResult | undefined> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('exam_results').select('*').eq('participant_id', participantId).maybeSingle();
      if (!error && data) return data as ExamResult;
    }
    return this.store.examResults.find((r) => r.participant_id === participantId);
  }

  async getResultsByExam(examId?: string): Promise<ExamResult[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('exam_results').select('*, exams(title)');
      if (examId && examId !== 'all') {
        query = query.eq('exam_id', examId);
      }
      const { data, error } = await query.order('total_score', { ascending: false });
      if (!error && data) {
        return (data as any[]).map((r) => ({
          ...r,
          exam_title: r.exams?.title || '',
        })) as ExamResult[];
      }
      if (error) console.error('Supabase getResultsByExam error:', error);
    }
    if (!examId || examId === 'all') return this.store.examResults;
    return this.store.examResults
      .filter((r) => r.exam_id === examId)
      .sort((a, b) => b.total_score - a.total_score || a.time_taken_seconds - b.time_taken_seconds);
  }

  // 8. Events
  async getEvents(): Promise<EventItem[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as EventItem[];
    }
    return this.store.events || [];
  }

  async createEvent(eventData: Omit<EventItem, 'id'> & { id?: string }): Promise<EventItem> {
    const newEvent: EventItem = {
      id: eventData.id || `ev-${Date.now()}`,
      title: eventData.title,
      category: eventData.category,
      date: eventData.date,
      day: eventData.day,
      month: eventData.month,
      time: eventData.time,
      location: eventData.location,
      attendees: eventData.attendees || '0 Registered',
      description: eventData.description,
      isAssessment: !!eventData.isAssessment,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('events').insert([newEvent]);
    }
    if (!this.store.events) this.store.events = [];
    this.store.events.unshift(newEvent);
    this.save();
    return newEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('events').delete().eq('id', id);
    }
    if (this.store.events) {
      this.store.events = this.store.events.filter((e) => e.id !== id);
      this.save();
    }
    return true;
  }

  // 9. Dashboard Stats
  async getDashboardStats() {
    let examsList = await this.getExams();
    let totalExams = examsList.length;
    let totalStudents = 0;
    let totalSubmissions = 0;
    let totalViolations = 0;
    let activeExams = examsList.filter((e) => e.status === 'LIVE').length;
    let topPerformers: any[] = [];

    if (isSupabaseConfigured && supabase) {
      const { count: studentCount } = await supabase.from('participants').select('*', { count: 'exact', head: true });
      const { count: subCount } = await supabase.from('submissions').select('*', { count: 'exact', head: true });
      const { count: eventCount } = await supabase.from('security_events').select('*', { count: 'exact', head: true });
      const { data: results } = await supabase.from('exam_results').select('*').order('total_score', { ascending: false }).limit(5);

      totalStudents = studentCount || 0;
      totalSubmissions = subCount || 0;
      totalViolations = eventCount || 0;
      topPerformers = (results || []).map((r: any, i: number) => ({
        rank: i + 1,
        name: r.student_name,
        rollNumber: r.roll_number,
        score: r.total_score,
      }));
    } else {
      totalStudents = this.store.participants.length;
      totalSubmissions = this.store.submissions.length;
      totalViolations = this.store.securityEvents.length;
      topPerformers = [...this.store.examResults]
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, 5)
        .map((r, i) => ({
          rank: i + 1,
          name: r.student_name,
          rollNumber: r.roll_number,
          score: r.total_score,
        }));
    }

    const totalSections = (this.store.sections || []).length;
    const allQuestions = this.store.questions || [];
    const totalQuestions = allQuestions.length;
    const totalMcqs = allQuestions.filter((q) => q.question_type === 'MCQ').length;
    const totalCoding = allQuestions.filter((q) => q.question_type !== 'MCQ').length;

    const examsByType = {
      FULL: examsList.filter((e) => !e.exam_type || e.exam_type === 'FULL').length,
      MCQ: examsList.filter((e) => e.exam_type === 'MCQ').length,
      CODING: examsList.filter((e) => e.exam_type === 'CODING').length,
      SECTIONAL: examsList.filter((e) => e.exam_type === 'SECTIONAL').length,
    };

    return {
      totalExams,
      totalStudents,
      totalSubmissions,
      totalViolations,
      activeExams,
      totalSections,
      totalQuestions,
      totalMcqs,
      totalCoding,
      examsByType,
      recentExams: examsList.slice(0, 5),
      topPerformers,
    };
  }
}

export const db = new Database();
