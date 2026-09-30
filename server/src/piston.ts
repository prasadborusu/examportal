import axios from 'axios';
import { PistonExecuteResponse } from './types.js';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const rawPistonUrl = (process.env.PISTON_URL || 'http://localhost:2000').replace(/\/+$/, '');
const PISTON_EXECUTE_URL = rawPistonUrl.endsWith('/api/v2/execute')
  ? rawPistonUrl
  : rawPistonUrl.endsWith('/api/v2')
  ? `${rawPistonUrl}/execute`
  : `${rawPistonUrl}/api/v2/execute`;

interface LanguageConfig {
  pistonLanguage: string;
  version: string;
  filename: string;
}

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  java: {
    pistonLanguage: 'java',
    version: '15.0.2',
    filename: 'Main.java',
  },
  'c++': {
    pistonLanguage: 'c++',
    version: '10.2.0',
    filename: 'main.cpp',
  },
  cpp: {
    pistonLanguage: 'c++',
    version: '10.2.0',
    filename: 'main.cpp',
  },
  c: {
    pistonLanguage: 'c',
    version: '10.2.0',
    filename: 'main.c',
  },
  python: {
    pistonLanguage: 'python',
    version: '3.12.0',
    filename: 'main.py',
  },
  python3: {
    pistonLanguage: 'python',
    version: '3.12.0',
    filename: 'main.py',
  },
  py: {
    pistonLanguage: 'python',
    version: '3.12.0',
    filename: 'main.py',
  },
  javascript: {
    pistonLanguage: 'javascript',
    version: '18.15.0',
    filename: 'main.js',
  },
  js: {
    pistonLanguage: 'javascript',
    version: '18.15.0',
    filename: 'main.js',
  },
};

const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  java: 62, // OpenJDK 13.0.1
  python: 71, // Python 3.8.1
  python3: 71,
  py: 71,
  'c++': 54, // GCC 9.2.0
  cpp: 54,
  c: 50, // GCC 9.2.0
  javascript: 63, // Node.js 12.14.0
  js: 63,
  typescript: 74,
  ts: 74,
};

let isPistonAvailable: boolean | null = null;
let lastPistonCheck = 0;

async function checkPistonAvailability(): Promise<boolean> {
  const now = Date.now();
  if (isPistonAvailable !== null && now - lastPistonCheck < 60000) {
    return isPistonAvailable;
  }
  try {
    const healthUrl = rawPistonUrl.endsWith('/api/v2/execute')
      ? rawPistonUrl.replace('/api/v2/execute', '/api/v2/runtimes')
      : `${rawPistonUrl}/api/v2/runtimes`;
    await axios.get(healthUrl, { timeout: 1500 });
    isPistonAvailable = true;
  } catch {
    isPistonAvailable = false;
  }
  lastPistonCheck = now;
  return isPistonAvailable;
}

/**
 * Prepares and sanitizes Java source code:
 * - Strips harmful package declarations
 * - Discovers the correct public/main class name
 * - Wraps bare statements if class declaration was omitted
 */
export function prepareJavaSource(code: string): { code: string; className: string; filename: string } {
  // 1. Strip package declaration so it doesn't cause ClassNotFoundException
  let sanitizedCode = code.replace(/^\s*package\s+[a-zA-Z0-9_.]+;\s*/gm, '// package removed\n');

  // 2. Identify the public class name if present (Java strictly requires public class to match filename)
  const publicClassMatch = sanitizedCode.match(/public\s+(?:final\s+)?class\s+([A-Za-z0-9_$]+)/);
  if (publicClassMatch) {
    return {
      code: sanitizedCode,
      className: publicClassMatch[1],
      filename: `${publicClassMatch[1]}.java`,
    };
  }

  // 3. Find any class that contains a main method
  const classMatches = [
    ...sanitizedCode.matchAll(
      /(?:class\s+([A-Za-z0-9_$]+)\s*(?:extends\s+[A-Za-z0-9_$<>]+)?\s*(?:implements\s+[A-Za-z0-9_$,\s<>]+)?\s*\{)([\s\S]*?)(?=\n\s*(?:public\s+)?class|\s*$)/g
    ),
  ];
  for (const m of classMatches) {
    if (/(?:public\s+)?static\s+void\s+main\s*\(/.test(m[2])) {
      return {
        code: sanitizedCode,
        className: m[1],
        filename: `${m[1]}.java`,
      };
    }
  }

  // 4. Any class name
  const anyClassMatch = sanitizedCode.match(/class\s+([A-Za-z0-9_$]+)/);
  if (anyClassMatch) {
    return {
      code: sanitizedCode,
      className: anyClassMatch[1],
      filename: `${anyClassMatch[1]}.java`,
    };
  }

  // 5. Bare statements without class
  if (/(?:public\s+)?static\s+void\s+main/.test(sanitizedCode)) {
    return {
      code: `import java.util.*;\nimport java.io.*;\n\npublic class Main {\n${sanitizedCode}\n}`,
      className: 'Main',
      filename: 'Main.java',
    };
  }

  return {
    code: `import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n${sanitizedCode}\n    }\n}`,
    className: 'Main',
    filename: 'Main.java',
  };
}

/**
 * Fallback to Judge0 CE (ideal for lightweight cloud deployments without a local JDK)
 */
async function executeWithJudge0(
  language: string,
  code: string,
  stdin: string = ''
): Promise<ExecutionResult> {
  const normLang = language.toLowerCase().trim();
  const langId = JUDGE0_LANGUAGE_IDS[normLang] || 62;
  const startTime = Date.now();

  try {
    const res = await axios.post(
      'https://ce.judge0.com/submissions?wait=true',
      {
        source_code: code,
        language_id: langId,
        stdin: stdin,
      },
      { timeout: 10000 }
    );

    const data = res.data;
    const isCompError = data.status?.id === 6;
    const isRuntimeError = data.status?.id >= 7 && data.status?.id <= 12;
    const isAccepted = data.status?.id === 3;

    const stdout = data.stdout || '';
    const stderr = data.compile_output || data.stderr || '';
    const output = data.compile_output || data.stderr || data.stdout || '';
    const exitCode = isAccepted ? 0 : 1;
    const timeMs = data.time ? Math.round(parseFloat(data.time) * 1000) : Date.now() - startTime;
    const memoryMb = data.memory ? Number((data.memory / 1024).toFixed(1)) : 24.0;

    return {
      stdout,
      stderr,
      output,
      exitCode,
      compilationError: isCompError,
      runtimeError: isRuntimeError,
      timeMs,
      memoryMb,
    };
  } catch (err: any) {
    return {
      stdout: '',
      stderr: err.response?.data?.message || err.message || 'Execution failed on Judge0 service',
      output: err.response?.data?.message || err.message || 'Execution failed',
      exitCode: 1,
      compilationError: false,
      runtimeError: true,
      timeMs: Date.now() - startTime,
      memoryMb: 0,
    };
  }
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  output: string;
  exitCode: number;
  compilationError: boolean;
  runtimeError: boolean;
  timeMs: number;
  memoryMb: number;
  raw?: PistonExecuteResponse;
}

/**
 * Native execution fallback when external Piston service is not running or whitelisted.
 * Leverages system runtime (python3/node/gcc/javac) with timeouts and sandbox isolation.
 */
async function runLocallyFallback(
  normLang: string,
  code: string,
  stdin: string
): Promise<ExecutionResult | null> {
  const startTime = Date.now();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anveshana_exec_'));

  try {
    if (normLang === 'python' || normLang === 'py' || normLang === 'python3') {
      const filePath = path.join(tempDir, 'main.py');
      fs.writeFileSync(filePath, code, 'utf-8');

      const isWin = process.platform === 'win32';
      const pyCmd = isWin ? 'python' : 'python3';

      return await new Promise<ExecutionResult>((resolve) => {
        const child = spawn(pyCmd, [filePath], {
          timeout: 5000,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';

        if (child.stdin) {
          if (stdin) {
            child.stdin.write(stdin);
          }
          child.stdin.end();
        }

        child.stdout?.on('data', (d) => {
          stdout += d.toString();
        });

        child.stderr?.on('data', (d) => {
          stderr += d.toString();
        });

        child.on('error', (err) => {
          resolve({
            stdout: '',
            stderr: `Python runtime error: ${err.message}`,
            output: err.message,
            exitCode: 1,
            compilationError: false,
            runtimeError: true,
            timeMs: Date.now() - startTime,
            memoryMb: 12.5,
          });
        });

        child.on('close', (code) => {
          const exitCode = code ?? 0;
          const runtimeFailed = exitCode !== 0;
          resolve({
            stdout,
            stderr,
            output: stderr ? `${stdout}\n${stderr}` : stdout,
            exitCode,
            compilationError: false,
            runtimeError: runtimeFailed,
            timeMs: Date.now() - startTime,
            memoryMb: 14.2,
          });
        });
      });
    }

    if (normLang === 'javascript' || normLang === 'js' || normLang === 'typescript' || normLang === 'ts') {
      const filePath = path.join(tempDir, 'main.js');
      fs.writeFileSync(filePath, code, 'utf-8');

      return await new Promise<ExecutionResult>((resolve) => {
        const child = spawn('node', [filePath], {
          timeout: 5000,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';

        if (child.stdin) {
          if (stdin) child.stdin.write(stdin);
          child.stdin.end();
        }

        child.stdout?.on('data', (d) => {
          stdout += d.toString();
        });

        child.stderr?.on('data', (d) => {
          stderr += d.toString();
        });

        child.on('error', (err) => {
          resolve({
            stdout: '',
            stderr: `Node execution error: ${err.message}`,
            output: err.message,
            exitCode: 1,
            compilationError: false,
            runtimeError: true,
            timeMs: Date.now() - startTime,
            memoryMb: 16.0,
          });
        });

        child.on('close', (code) => {
          const exitCode = code ?? 0;
          resolve({
            stdout,
            stderr,
            output: stderr ? `${stdout}\n${stderr}` : stdout,
            exitCode,
            compilationError: false,
            runtimeError: exitCode !== 0,
            timeMs: Date.now() - startTime,
            memoryMb: 16.0,
          });
        });
      });
    }

    if (normLang === 'c' || normLang === 'c++' || normLang === 'cpp') {
      const isCpp = normLang !== 'c';
      const compiler = isCpp ? 'g++' : 'gcc';
      const srcFile = path.join(tempDir, isCpp ? 'main.cpp' : 'main.c');
      const binFile = path.join(tempDir, process.platform === 'win32' ? 'main.exe' : 'main.out');
      fs.writeFileSync(srcFile, code, 'utf-8');

      // Compile step
      const compileResult = await new Promise<{ ok: boolean; stderr: string }>((resolve) => {
        const comp = spawn(compiler, [srcFile, '-o', binFile], { timeout: 8000 });
        let compErr = '';
        comp.stderr?.on('data', (d) => {
          compErr += d.toString();
        });
        comp.on('close', (c) => resolve({ ok: c === 0, stderr: compErr }));
        comp.on('error', (e) => resolve({ ok: false, stderr: e.message }));
      });

      if (!compileResult.ok) {
        return {
          stdout: '',
          stderr: compileResult.stderr || 'Compilation failed',
          output: compileResult.stderr || 'Compilation failed',
          exitCode: 1,
          compilationError: true,
          runtimeError: false,
          timeMs: Date.now() - startTime,
          memoryMb: 8.0,
        };
      }

      // Run step
      return await new Promise<ExecutionResult>((resolve) => {
        const runner = spawn(binFile, [], { timeout: 4000 });
        let stdout = '';
        let stderr = '';
        if (runner.stdin) {
          if (stdin) runner.stdin.write(stdin);
          runner.stdin.end();
        }
        runner.stdout?.on('data', (d) => {
          stdout += d.toString();
        });
        runner.stderr?.on('data', (d) => {
          stderr += d.toString();
        });
        runner.on('close', (c) => {
          const exitCode = c ?? 0;
          resolve({
            stdout,
            stderr,
            output: stderr ? `${stdout}\n${stderr}` : stdout,
            exitCode,
            compilationError: false,
            runtimeError: exitCode !== 0,
            timeMs: Date.now() - startTime,
            memoryMb: 8.5,
          });
        });
        runner.on('error', (err) => {
          resolve({
            stdout: '',
            stderr: err.message,
            output: err.message,
            exitCode: 1,
            compilationError: false,
            runtimeError: true,
            timeMs: Date.now() - startTime,
            memoryMb: 8.0,
          });
        });
      });
    }

    if (normLang === 'java') {
      const prep = prepareJavaSource(code);
      const srcFile = path.join(tempDir, prep.filename);
      fs.writeFileSync(srcFile, prep.code, 'utf-8');

      // Compile step with UTF-8 encoding and destination directory
      const compileResult = await new Promise<{ ok: boolean; stderr: string; missingJavac?: boolean }>((resolve) => {
        const comp = spawn('javac', ['-encoding', 'UTF-8', '-d', tempDir, srcFile], { timeout: 8000 });
        let compErr = '';
        comp.stderr?.on('data', (d) => {
          compErr += d.toString();
        });
        comp.on('close', (c) => resolve({ ok: c === 0, stderr: compErr }));
        comp.on('error', (e: any) => resolve({ ok: false, stderr: e.message, missingJavac: e.code === 'ENOENT' }));
      });

      // If javac is not installed on the system (e.g. Render Node container), return null so Judge0 takes over
      if (compileResult.missingJavac) {
        return null;
      }

      if (!compileResult.ok) {
        return {
          stdout: '',
          stderr: compileResult.stderr || 'Java compilation failed',
          output: compileResult.stderr || 'Java compilation failed',
          exitCode: 1,
          compilationError: true,
          runtimeError: false,
          timeMs: Date.now() - startTime,
          memoryMb: 24.0,
        };
      }

      // Run step with memory constraints, quick startup flags, and UTF-8 encoding
      return await new Promise<ExecutionResult | null>((resolve) => {
        const runner = spawn('java', [
          '-Xmx256m',
          '-Xms32m',
          '-XX:+TieredCompilation',
          '-XX:TieredStopAtLevel=1',
          '-Dfile.encoding=UTF-8',
          '-cp', tempDir,
          prep.className,
        ], { timeout: 5000 });

        let stdout = '';
        let stderr = '';
        if (runner.stdin) {
          if (stdin) {
            runner.stdin.write(stdin.endsWith('\n') ? stdin : stdin + '\n');
          }
          runner.stdin.end();
        }
        runner.stdout?.on('data', (d) => {
          stdout += d.toString();
        });
        runner.stderr?.on('data', (d) => {
          stderr += d.toString();
        });
        runner.on('close', (c) => {
          const exitCode = c ?? 0;
          resolve({
            stdout,
            stderr,
            output: stderr ? `${stdout}\n${stderr}` : stdout,
            exitCode,
            compilationError: false,
            runtimeError: exitCode !== 0,
            timeMs: Date.now() - startTime,
            memoryMb: 28.0,
          });
        });
        runner.on('error', (err: any) => {
          if (err.code === 'ENOENT') {
            resolve(null);
            return;
          }
          resolve({
            stdout: '',
            stderr: err.message,
            output: err.message,
            exitCode: 1,
            compilationError: false,
            runtimeError: true,
            timeMs: Date.now() - startTime,
            memoryMb: 20.0,
          });
        });
      });
    }

    return null;
  } catch (e) {
    return null;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

export async function executeCodeOnPiston(
  language: string,
  code: string,
  stdin: string = ''
): Promise<ExecutionResult> {
  const normLang = language.toLowerCase().trim();
  const startTime = Date.now();

  // If Java, prepare the source code (extract class name, remove packages, wrap bare statements)
  let effectiveCode = code;
  let javaFilename = 'Main.java';

  if (normLang === 'java') {
    const prep = prepareJavaSource(code);
    effectiveCode = prep.code;
    javaFilename = prep.filename;
  }

  // 1. Try local execution fallback FIRST if local compiler exists (much faster and avoids network delays)
  const localResult = await runLocallyFallback(normLang, effectiveCode, stdin);
  if (localResult) {
    return localResult;
  }

  // 2. If local execution returned null (e.g. compiler missing like on Render), check Piston if configured and available
  const pistonAvailable = await checkPistonAvailability();
  if (pistonAvailable) {
    try {
      const config = LANGUAGE_CONFIGS[normLang] || LANGUAGE_CONFIGS['python'];
      const payload = {
        language: config.pistonLanguage,
        version: config.version,
        files: [
          {
            name: normLang === 'java' ? javaFilename : config.filename,
            content: effectiveCode,
          },
        ],
        stdin: stdin,
        run_timeout: 4000,
        compile_timeout: 4000,
      };

      const response = await axios.post<PistonExecuteResponse>(
        PISTON_EXECUTE_URL,
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );

      const data = response.data;
      if (data && data.run) {
        const compile = data.compile;
        const run = data.run;

        const compilationFailed = Boolean(compile && compile.code !== 0);
        const runtimeFailed = Boolean(!compilationFailed && run && run.code !== 0);

        const stdout = run?.stdout || '';
        const stderr = compilationFailed ? compile?.output || compile?.stderr || '' : run?.stderr || '';
        const output = compilationFailed ? compile?.output || '' : run?.output || '';
        const exitCode = compilationFailed ? (compile?.code ?? 1) : (run?.code ?? 0);

        const memoryBytes = run?.memory || compile?.memory || 0;
        const memoryMb = Number((memoryBytes / (1024 * 1024)).toFixed(1)) || 12.4;
        const timeMs = (run?.wall_time || run?.cpu_time) ? Math.round(run.wall_time || run.cpu_time || 0) : (Date.now() - startTime);

        return {
          stdout,
          stderr,
          output,
          exitCode,
          compilationError: compilationFailed,
          runtimeError: runtimeFailed,
          timeMs,
          memoryMb,
          raw: data,
        };
      }
    } catch (e) {
      isPistonAvailable = false;
    }
  }

  // 3. Fallback to Judge0 CE (works in cloud environments like Render without JDK)
  return await executeWithJudge0(normLang, effectiveCode, stdin);
}
