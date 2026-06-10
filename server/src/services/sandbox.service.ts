import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";

type SandboxLanguage = "javascript" | "python" | "java" | "c" | "cpp";

type RunCodeInput = {
  code: string;
  language: SandboxLanguage;
  stdin?: string;
};

type CommandConfig = {
  command: string;
  args: string[];
  extension: string;
  filename?: string; // Java needs specific filename (class name)
  prepare?: (tempDir: string) => Promise<void>;
  collect?: (tempDir: string) => Promise<{
    stdout: string;
    stderr: string;
  }>;
  compileCommand?: string;
  compileArgs?: (tempDir: string) => string[];
  runCommand?: (tempDir: string) => { command: string; args: string[] };
};

const EXECUTION_TIMEOUT_MS = 10_000;
const COMPILE_TIMEOUT_MS   = 15_000;
const OUTPUT_LIMIT         = 8_000;
const MAX_MEMORY_MB        = 128;

// ── Security patterns ──────────────────────────────────────────────────────

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

// Blocks Runtime.exec, ProcessBuilder, file system abuse in Java
const DANGEROUS_JAVA_PATTERNS = [
  /Runtime\.getRuntime\(\)/i,
  /ProcessBuilder/i,
  /System\.exit/i,
  /Class\.forName/i,
  /new\s+File\s*\(/i,
  /FileWriter|FileReader|FileInputStream|FileOutputStream/i,
  /java\.net\./i,
  /java\.nio\./i,
  /SecurityManager/i
];

// Blocks system calls, file ops in C/C++
const DANGEROUS_C_PATTERNS = [
  /\bsystem\s*\(/i,
  /\bpopen\s*\(/i,
  /\bexecv[ep]?\s*\(/i,
  /\bfork\s*\(/i,
  /#include\s+<sys\//i,
  /#include\s+<unistd\.h>/i,
  /#include\s+<signal\.h>/i,
  /\bsocket\s*\(/i,
  /\bconnect\s*\(/i,
  /\bremove\s*\(/i,
  /\bunlink\s*\(/i
];

function getPatterns(language: SandboxLanguage): RegExp[] {
  if (language === "python") return DANGEROUS_PYTHON_PATTERNS;
  if (language === "java")   return DANGEROUS_JAVA_PATTERNS;
  if (language === "c" || language === "cpp") return DANGEROUS_C_PATTERNS;
  return DANGEROUS_JS_PATTERNS;
}

function validateCode(code: string, language: SandboxLanguage): string | null {
  for (const pattern of getPatterns(language)) {
    if (pattern.test(code)) {
      return `Blocked: Code contains a restricted pattern. Only standard I/O operations are allowed.`;
    }
  }
  return null;
}

// ── Minimal sandbox environment ────────────────────────────────────────────

function getSandboxEnv(): Record<string, string> {
  return {
    ...process.env,
    HOME: "/tmp",
    PYTHONUNBUFFERED: "1",
    PYTHONDONTWRITEBYTECODE: "1",
    PYTHONIOENCODING: "utf-8",
    NODE_ENV: "production",
    JAVA_TOOL_OPTIONS: `-Xmx${MAX_MEMORY_MB}m`
  } as Record<string, string>;
}

function trimOutput(value: string) {
  if (value.length <= OUTPUT_LIMIT) return value;
  return `${value.slice(0, OUTPUT_LIMIT)}\n...output truncated...`;
}

// ── Compile step (for Java / C / C++) ─────────────────────────────────────

async function compileCode(
  language: SandboxLanguage,
  tempDir: string,
  filePath: string
): Promise<{ success: boolean; stderr: string }> {
  let command: string;
  let args: string[];

  if (language === "java") {
    command = "javac";
    args = [filePath];
  } else if (language === "c") {
    command = "gcc";
    args = [filePath, "-o", path.join(tempDir, "solution"), "-lm", "-std=c11", "-Wall"];
  } else {
    // cpp
    command = "g++";
    args = [filePath, "-o", path.join(tempDir, "solution"), "-lm", "-std=c++17", "-Wall"];
  }

  return new Promise((resolve) => {
    execFile(command, args, { cwd: tempDir, timeout: COMPILE_TIMEOUT_MS, env: getSandboxEnv() },
      (error, _stdout, stderr) => {
        if (!error) {
          resolve({ success: true, stderr: "" });
        } else {
          resolve({ success: false, stderr: stderr || error.message });
        }
      }
    );
  });
}

// ── Run step config per language ───────────────────────────────────────────

function getRunConfig(language: SandboxLanguage, tempDir: string): {
  command: string;
  args: string[];
} {
  if (language === "python") {
    return { command: "python3", args: ["-I", "-S", path.join(tempDir, "snippet.py")] };
  }
  if (language === "java") {
    return { command: "java", args: [`-Xmx${MAX_MEMORY_MB}m`, "-cp", tempDir, "Solution"] };
  }
  if (language === "c" || language === "cpp") {
    return { command: path.join(tempDir, "solution"), args: [] };
  }
  // javascript — uses runner.mjs
  return {
    command: process.execPath,
    args: [`--max-old-space-size=${MAX_MEMORY_MB}`, "--no-warnings", "--disallow-code-generation-from-strings", "runner.mjs"]
  };
}

// ── JavaScript runner preparation ──────────────────────────────────────────

async function prepareJsRunner(tempDir: string) {
  const runnerSource = `import { writeFile, readFile } from "node:fs/promises";
import { inspect } from "node:util";

const stdout = [];
const stderr = [];

const format = (values) =>
  values
    .map((value) =>
      typeof value === "string" ? value : inspect(value, { depth: 4, breakLength: Infinity })
    )
    .join(" ");

console.log = (...values) => { stdout.push(format(values)); };
console.error = (...values) => { stderr.push(format(values)); };

let __stdinData = "";
try {
  const stdinFile = await readFile("./stdin.txt", "utf8").catch(() => "");
  __stdinData = stdinFile;
} catch {
  __stdinData = "";
}

const __INPUT__ = __stdinData.trimEnd();
const __LINES__ = __INPUT__.split("\\n");
let __lineIndex__ = 0;

globalThis.readLine = () => __LINES__[__lineIndex__++] ?? "";
globalThis.readLines = () => __LINES__;
globalThis.input = globalThis.readLine;
globalThis.__INPUT__ = __INPUT__;
globalThis.__LINES__ = __LINES__;

try {
  await import("./snippet.js");
} catch (error) {
  stderr.push(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
} finally {
  await writeFile("./stdout.txt", stdout.join("\\n"));
  await writeFile("./stderr.txt", stderr.join("\\n"));
}`;

  await writeFile(path.join(tempDir, "runner.mjs"), runnerSource, "utf8");
}

// ── Collect JS output from files ───────────────────────────────────────────

async function collectJsOutput(tempDir: string) {
  const [stdout, stderr] = await Promise.all([
    readFile(path.join(tempDir, "stdout.txt"), "utf8").catch(() => ""),
    readFile(path.join(tempDir, "stderr.txt"), "utf8").catch(() => "")
  ]);
  return { stdout, stderr };
}

// ── Main execution function ────────────────────────────────────────────────

export async function runCode({ code, language, stdin }: RunCodeInput) {
  const validationError = validateCode(code, language);
  if (validationError) {
    return { stdout: "", stderr: validationError, exitCode: 1, timedOut: false, success: false };
  }

  const ext: Record<SandboxLanguage, string> = {
    javascript: "js",
    python:     "py",
    java:       "java",
    c:          "c",
    cpp:        "cpp"
  };

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "proctocode-"));

  try {
    // Java requires the filename to match the public class name — we enforce "Solution"
    const filename = language === "java" ? "Solution.java" : `snippet.${ext[language]}`;
    const filePath = path.join(tempDir, filename);

    await writeFile(filePath, code, "utf8");
    await writeFile(path.join(tempDir, "stdin.txt"), stdin ?? "", "utf8");

    // Prepare JS runner
    if (language === "javascript") {
      await prepareJsRunner(tempDir);
    }

    // Compile step for compiled languages
    if (language === "java" || language === "c" || language === "cpp") {
      const compileResult = await compileCode(language, tempDir, filePath);
      if (!compileResult.success) {
        return {
          stdout: "",
          stderr: `Compilation Error:\n${compileResult.stderr}`,
          exitCode: 1,
          timedOut: false,
          success: false
        };
      }
    }

    const runConfig = getRunConfig(language, tempDir);

    const result = await new Promise<{
      stdout: string;
      stderr: string;
      exitCode: number | null;
      timedOut: boolean;
    }>((resolve, reject) => {
      const child = execFile(
        runConfig.command,
        runConfig.args,
        {
          cwd: tempDir,
          shell: false,
          timeout: EXECUTION_TIMEOUT_MS,
          killSignal: "SIGKILL",
          maxBuffer: OUTPUT_LIMIT,
          env: getSandboxEnv()
        },
        async (error, stdout, stderr) => {
          const finalize = async (exitCode: number | null, timedOut: boolean, fallbackStderr: string) => {
            // JS collects output from files, others use stdout directly
            const collected = language === "javascript" ? await collectJsOutput(tempDir) : null;
            resolve({
              stdout: trimOutput(collected?.stdout ?? stdout),
              stderr: trimOutput(collected?.stderr ?? (stderr || fallbackStderr)),
              exitCode,
              timedOut
            });
          };

          if (!error) {
            await finalize(0, false, "");
            return;
          }

          const execError = error as NodeJS.ErrnoException & { code?: number | string; killed?: boolean };

          if (typeof execError.code === "string" && execError.code === "ENOENT") {
            reject(new Error(`Runtime not available for ${language}`));
            return;
          }

          await finalize(
            typeof execError.code === "number" ? execError.code : null,
            execError.killed === true,
            execError.message
          );
        }
      );

      // Feed stdin directly to the process for Python/Java/C/C++
      if (stdin && child.stdin && language !== "javascript") {
        child.stdin.write(stdin);
        child.stdin.end();
      }
    });

    return { ...result, success: !result.timedOut && result.exitCode === 0 };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

// ── Syntax check ───────────────────────────────────────────────────────────

export async function syntaxCheckCode(code: string, language: SandboxLanguage) {
  const validationError = validateCode(code, language);
  if (validationError) {
    return { stdout: "", stderr: validationError, exitCode: 1, success: false };
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "proctocode-check-"));

  try {
    if (language === "python") {
      const filePath = path.join(tempDir, "snippet.py");
      await writeFile(filePath, code, "utf8");
      return await new Promise<{ stdout: string; stderr: string; exitCode: number | null; success: boolean }>((resolve) => {
        execFile("python3", ["-m", "py_compile", filePath], { cwd: tempDir, timeout: 5000, env: getSandboxEnv() },
          (error, stdout, stderr) => {
            if (!error) { resolve({ stdout, stderr, exitCode: 0, success: true }); return; }
            const e = error as NodeJS.ErrnoException & { code?: number | string };
            resolve({ stdout, stderr: stderr || error.message, exitCode: typeof e.code === "number" ? e.code : 1, success: false });
          }
        );
      });
    }

    if (language === "javascript") {
      const filePath = path.join(tempDir, "snippet.js");
      await writeFile(filePath, code, "utf8");
      return await new Promise<{ stdout: string; stderr: string; exitCode: number | null; success: boolean }>((resolve) => {
        execFile(process.execPath, ["--check", filePath], { cwd: tempDir, timeout: 5000, env: getSandboxEnv() },
          (error, stdout, stderr) => {
            if (!error) { resolve({ stdout, stderr, exitCode: 0, success: true }); return; }
            const e = error as NodeJS.ErrnoException & { code?: number | string };
            resolve({ stdout, stderr: stderr || error.message, exitCode: typeof e.code === "number" ? e.code : 1, success: false });
          }
        );
      });
    }

    // For compiled languages, a compile attempt doubles as syntax check
    const ext: Record<SandboxLanguage, string> = { javascript: "js", python: "py", java: "java", c: "c", cpp: "cpp" };
    const filename = language === "java" ? "Solution.java" : `snippet.${ext[language]}`;
    const filePath = path.join(tempDir, filename);
    await writeFile(filePath, code, "utf8");
    const compileResult = await compileCode(language, tempDir, filePath);
    return {
      stdout: "",
      stderr: compileResult.stderr,
      exitCode: compileResult.success ? 0 : 1,
      success: compileResult.success
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

// ── Test case runner ───────────────────────────────────────────────────────

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
