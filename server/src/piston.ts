import axios from 'axios';
import { PistonExecuteResponse } from './types.js';

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
  py: {
    pistonLanguage: 'python',
    version: '3.12.0',
    filename: 'main.py',
  },
};

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

export async function executeCodeOnPiston(
  language: string,
  code: string,
  stdin: string = ''
): Promise<ExecutionResult> {
  const normLang = language.toLowerCase().trim();
  const config = LANGUAGE_CONFIGS[normLang] || LANGUAGE_CONFIGS['python'];

  const startTime = Date.now();
  try {
    const payload = {
      language: config.pistonLanguage,
      version: config.version,
      files: [
        {
          name: config.filename,
          content: code,
        },
      ],
      stdin: stdin,
      run_timeout: 3000,
      compile_timeout: 3000,
    };

    const response = await axios.post<PistonExecuteResponse>(
      PISTON_EXECUTE_URL,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );

    const data = response.data;
    const compile = data.compile;
    const run = data.run;

    const compilationFailed = Boolean(compile && compile.code !== 0);
    const runtimeFailed = Boolean(!compilationFailed && run && run.code !== 0);

    const stdout = run?.stdout || '';
    const stderr = compilationFailed ? compile?.output || compile?.stderr || '' : run?.stderr || '';
    const output = compilationFailed ? compile?.output || '' : run?.output || '';
    const exitCode = compilationFailed ? (compile?.code ?? 1) : (run?.code ?? 0);

    // Calculate memory in MB and time in ms
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
  } catch (error: any) {
    console.error('Piston Execution Error:', error?.message || error);
    return {
      stdout: '',
      stderr: error?.response?.data?.message || error?.message || 'Compiler execution timed out or failed to connect to local Piston engine.',
      output: error?.response?.data?.message || error?.message || 'Execution error',
      exitCode: 1,
      compilationError: false,
      runtimeError: true,
      timeMs: Date.now() - startTime,
      memoryMb: 0,
    };
  }
}
