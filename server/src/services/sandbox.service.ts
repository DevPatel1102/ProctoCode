import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";

type SandboxLanguage = "javascript" | "python";

type RunCodeInput = {
  code: string;
  language: SandboxLanguage;
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

function getCommandConfig(language: SandboxLanguage, filePath: string): CommandConfig {
  if (language === "python") {
    return {
      command: "python3",
      args: [filePath],
      extension: "py"
    };
  }

  return {
    command: process.execPath,
    args: ["runner.mjs"],
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

export async function runCode({ code, language }: RunCodeInput) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "ghost-proof-"));
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
      execFile(
        runtime.command,
        runtime.args,
        {
          cwd: tempDir,
          shell: false,
          timeout: EXECUTION_TIMEOUT_MS,
          killSignal: "SIGKILL",
          maxBuffer: OUTPUT_LIMIT,
          env: {
            PATH: process.env.PATH,
            PYTHONUNBUFFERED: "1"
          }
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
    });

    return {
      ...result,
      success: !result.timedOut && result.exitCode === 0
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
