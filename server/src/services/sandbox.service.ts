import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";

type SandboxLanguage = "javascript" | "python";

type RunCodeInput = {
  code: string;
  language: SandboxLanguage;
  stdin?: string;
};

type CommandConfig = {
  command: string;
  args: string[];
  extension: string;
  prepare?: (tempDir: string) => Promise<void>;
  collect?: (tempDir: string) => Promise<{
    stdout: string;
    stderr: string;
  }>;
};

const EXECUTION_TIMEOUT_MS = 5_000;
const OUTPUT_LIMIT = 8_000;
const MAX_MEMORY_MB = 64;

// Dangerous patterns that indicate filesystem/network/process abuse
const DANGEROUS_JS_PATTERNS = [
  /require\s*\(\s*['"`]child_process['"`]\s*\)/i,
  /require\s*\(\s*['"`]fs['"`]\s*\)/i,
  /require\s*\(\s*['"`]net['"`]\s*\)/i,
  /require\s*\(\s*['"`]http['"`]\s*\)/i,
  /require\s*\(\s*['"`]https['"`]\s*\)/i,
  /require\s*\(\s*['"`]dgram['"`]\s*\)/i,
  /require\s*\(\s*['"`]cluster['"`]\s*\)/i,
  /require\s*\(\s*['"`]worker_threads['"`]\s*\)/i,
  /from\s+['"`]child_process['"`]/i,
  /from\s+['"`]fs['"`]/i,
  /from\s+['"`]fs\/promises['"`]/i,
  /from\s+['"`]net['"`]/i,
  /from\s+['"`]node:/i,
  /process\.env/i,
  /process\.exit/i,
  /process\.kill/i
];

const DANGEROUS_PYTHON_PATTERNS = [
  /import\s+subprocess/i,
  /from\s+subprocess/i,
  /import\s+shutil/i,
  /import\s+socket/i,
  /from\s+socket/i,
  /import\s+http/i,
  /import\s+urllib/i,
  /from\s+urllib/i,
  /import\s+requests/i,
  /os\.system\s*\(/i,
  /os\.popen\s*\(/i,
  /os\.exec/i,
  /os\.spawn/i,
  /os\.environ/i,
  /os\.remove/i,
  /os\.unlink/i,
  /os\.rmdir/i,
  /__import__\s*\(/i,
  /eval\s*\(/i,
  /exec\s*\(/i,
  /open\s*\([^)]*['"`]\/etc/i,
  /open\s*\([^)]*['"`]\/proc/i
];

function validateCode(code: string, language: SandboxLanguage): string | null {
  const patterns =
    language === "python" ? DANGEROUS_PYTHON_PATTERNS : DANGEROUS_JS_PATTERNS;

  for (const pattern of patterns) {
    if (pattern.test(code)) {
      return `Blocked: Code contains a restricted pattern (${pattern.source}). Only standard I/O operations are allowed.`;
    }
  }

  return null;
}

function getCommandConfig(language: SandboxLanguage, filePath: string): CommandConfig {
  if (language === "python") {
    return {
      command: "python3",
      // -I = isolated mode: no user site-packages, PYTHONPATH ignored, no .pth files
      // -S = skip importing site module
      args: ["-I", "-S", filePath],
      extension: "py"
    };
  }

  return {
    command: process.execPath,
    args: [
      `--max-old-space-size=${MAX_MEMORY_MB}`,
      "--no-warnings",
      "--disallow-code-generation-from-strings",
      "runner.mjs"
    ],
    extension: "js",
    prepare: async (tempDir) => {
      const runnerPath = path.join(tempDir, "runner.mjs");
      const runnerSource = `import { writeFile } from "node:fs/promises";
import { inspect } from "node:util";

const stdout = [];
const stderr = [];

const format = (values) =>
  values
    .map((value) =>
      typeof value === "string" ? value : inspect(value, { depth: 4, breakLength: Infinity })
    )
    .join(" ");

console.log = (...values) => {
  stdout.push(format(values));
};

console.error = (...values) => {
  stderr.push(format(values));
};

try {
  await import("./snippet.js");
} catch (error) {
  stderr.push(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
} finally {
  await writeFile("./stdout.txt", stdout.join("\\n"));
  await writeFile("./stderr.txt", stderr.join("\\n"));
}`;

      await writeFile(runnerPath, runnerSource, "utf8");
    },
    collect: async (tempDir) => {
      const [stdout, stderr] = await Promise.all([
        readFile(path.join(tempDir, "stdout.txt"), "utf8").catch(() => ""),
        readFile(path.join(tempDir, "stderr.txt"), "utf8").catch(() => "")
      ]);

      return { stdout, stderr };
    }
  };
}

function trimOutput(value: string) {
  if (value.length <= OUTPUT_LIMIT) {
    return value;
  }

  return `${value.slice(0, OUTPUT_LIMIT)}\n...output truncated...`;
}

// Minimal, stripped-down environment — no secrets or shell access
function getSandboxEnv(): Record<string, string> {
  return {
    ...process.env,
    HOME: "/tmp",
    PYTHONUNBUFFERED: "1",
    PYTHONDONTWRITEBYTECODE: "1",
    PYTHONIOENCODING: "utf-8",
    NODE_ENV: "production"
  } as Record<string, string>;
}

export async function runCode({ code, language, stdin }: RunCodeInput) {
  // Validate code against dangerous patterns before execution
  const validationError = validateCode(code, language);
  if (validationError) {
    return {
      stdout: "",
      stderr: validationError,
      exitCode: 1,
      timedOut: false,
      success: false
    };
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "proctocode-"));
  const config = getCommandConfig(language, "");
  const filePath = path.join(tempDir, `snippet.${config.extension}`);

  await writeFile(filePath, code, "utf8");
  await config.prepare?.(tempDir);

  const runtime = getCommandConfig(language, filePath);

  try {
    const result = await new Promise<{
      stdout: string;
      stderr: string;
      exitCode: number | null;
      timedOut: boolean;
    }>((resolve, reject) => {
      const child = execFile(
        runtime.command,
        runtime.args,
        {
          cwd: tempDir,
          shell: false,
          timeout: EXECUTION_TIMEOUT_MS,
          killSignal: "SIGKILL",
          maxBuffer: OUTPUT_LIMIT,
          env: getSandboxEnv()
        },
        (error, stdout, stderr) => {
          const finishWithCollectedOutput = async (
            exitCode: number | null,
            timedOut: boolean,
            fallbackStderr: string
          ) => {
            const collected = await runtime.collect?.(tempDir);
            const collectedStdout = collected?.stdout ?? stdout;
            const collectedStderr = collected?.stderr ?? (stderr || fallbackStderr);

            resolve({
              stdout: trimOutput(collectedStdout),
              stderr: trimOutput(collectedStderr),
              exitCode,
              timedOut
            });
          };

          if (!error) {
            void finishWithCollectedOutput(0, false, "");
            return;
          }

          const executionError = error as NodeJS.ErrnoException & {
            code?: number | string;
            killed?: boolean;
            signal?: NodeJS.Signals;
          };

          if (typeof executionError.code === "string" && executionError.code === "ENOENT") {
            reject(new Error(`Runtime not available for ${language}`));
            return;
          }

          void finishWithCollectedOutput(
            typeof executionError.code === "number" ? executionError.code : null,
            executionError.killed === true,
            executionError.message
          );
        }
      );

      if (stdin && child.stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }
    });

    return {
      ...result,
      success: !result.timedOut && result.exitCode === 0
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function syntaxCheckCode(code: string, language: SandboxLanguage) {
  const validationError = validateCode(code, language);
  if (validationError) {
    return {
      stdout: "",
      stderr: validationError,
      exitCode: 1,
      success: false
    };
  }

  const extension = language === "python" ? "py" : "js";
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "proctocode-check-"));
  const filePath = path.join(tempDir, `snippet.${extension}`);

  await writeFile(filePath, code, "utf8");

  try {
    const result = await new Promise<{
      stdout: string;
      stderr: string;
      exitCode: number | null;
    }>((resolve) => {
      const command = language === "python" ? "python3" : process.execPath;
      const args = language === "python"
        ? ["-m", "py_compile", filePath]
        : ["--check", filePath];

      execFile(
        command,
        args,
        {
          cwd: tempDir,
          timeout: 5000,
          env: getSandboxEnv()
        },
        (error, stdout, stderr) => {
          if (!error) {
            resolve({ stdout, stderr, exitCode: 0 });
            return;
          }

          const executionError = error as NodeJS.ErrnoException & { code?: number | string };
          resolve({
            stdout,
            stderr: stderr || error.message,
            exitCode: typeof executionError.code === "number" ? executionError.code : 1
          });
        }
      );
    });

    return {
      ...result,
      success: result.exitCode === 0
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export type TestCaseResult = {
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  error?: string;
  isHidden: boolean;
};

export async function submitCode(
  code: string,
  language: SandboxLanguage,
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>
): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  for (const testCase of testCases) {
    const runResult = await runCode({ code, language, stdin: testCase.input });

    let actualOutput = runResult.stdout.trim();
    if (!runResult.success) {
      actualOutput = runResult.stderr.trim() || actualOutput;
    }

    const passed = runResult.success && actualOutput === testCase.expectedOutput.trim();

    results.push({
      passed,
      actualOutput,
      expectedOutput: testCase.expectedOutput,
      error: runResult.success ? undefined : runResult.stderr,
      isHidden: testCase.isHidden
    });
  }

  return results;
}
