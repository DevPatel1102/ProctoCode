"use client";

import Editor from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { useEffect, useRef, useState } from "react";
import { Play, Loader2, Terminal, Info } from "lucide-react";

import { useBehaviorTracking } from "@/hooks/use-behavior-tracking";
import { sendEvent } from "@/lib/behavior-tracking";
import {
  codeTemplates,
  getMonacoLanguage,
  languageOptions,
  type SandboxLanguage
} from "@/lib/sandbox";

type RunResponse = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  success: boolean;
  message?: string;
};

export function CodeSandbox({
  onCodeChange,
  onLanguageChange,
  headerActions
}: {
  onCodeChange?: (code: string) => void;
  onLanguageChange?: (language: SandboxLanguage) => void;
  headerActions?: React.ReactNode;
} = {}) {
  useBehaviorTracking();

  const [language, setLanguage] = useState<SandboxLanguage>("javascript");
  const [code, setCode] = useState(codeTemplates.javascript);
  const [customStdin, setCustomStdin] = useState("");
  const [result, setResult] = useState<RunResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [editorInstance, setEditorInstance] =
    useState<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const lastPasteSignatureRef = useRef<string>("");
  const suppressEditorTrackingRef = useRef(false);
  const lastInternalClipboardRef = useRef<{
    text: string;
    capturedAt: number;
  } | null>(null);

  function isRecentlyCopiedFromEditor(text: string) {
    const snapshot = lastInternalClipboardRef.current;

    if (!snapshot) {
      return false;
    }

    if (snapshot.text !== text) {
      return false;
    }

    return Date.now() - snapshot.capturedAt < 120_000;
  }

  function trackPaste(length: number, source: string, text?: string) {
    if (length <= 50) {
      return;
    }

    if (text && isRecentlyCopiedFromEditor(text)) {
      return;
    }

    const now = Date.now();
    const normalizedText = text?.trim() ?? "";
    const signature = normalizedText
      ? `${length}:${normalizedText.slice(0, 120)}:${Math.floor(now / 1000)}`
      : `${length}:${Math.floor(now / 1000)}`;

    if (lastPasteSignatureRef.current === signature) {
      return;
    }

    lastPasteSignatureRef.current = signature;

    void sendEvent({
      type: "PASTE",
      timestamp: now,
      metadata: { length, source }
    });
  }

  async function handleRun() {
    setIsRunning(true);
    setResult(null);

    try {
      const response = await fetch("/api/sandbox/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ language, code, stdin: customStdin })
      });

      const data = (await response.json()) as RunResponse;

      if (!response.ok) {
        setResult({
          stdout: "",
          stderr: data.message ?? "Execution failed",
          exitCode: null,
          timedOut: false,
          success: false
        });
        return;
      }

      setResult(data);
    } finally {
      setIsRunning(false);
    }
  }

  function handleLanguageChange(nextLanguage: SandboxLanguage) {
    suppressEditorTrackingRef.current = true;
    setLanguage(nextLanguage);
    setCode(codeTemplates[nextLanguage]);
    setResult(null);

    onLanguageChange?.(nextLanguage);
    onCodeChange?.(codeTemplates[nextLanguage]);

    window.setTimeout(() => {
      suppressEditorTrackingRef.current = false;
    }, 0);
  }

  useEffect(() => {
    const editorNode = editorInstance?.getDomNode();

    if (!editorNode) {
      return;
    }

    const captureEditorClipboard = () => {
      const selection = editorInstance?.getSelection();

      if (!selection) {
        return;
      }

      const copiedText = editorInstance?.getModel()?.getValueInRange(selection);

      if (!copiedText) {
        return;
      }

      lastInternalClipboardRef.current = {
        text: copiedText,
        capturedAt: Date.now()
      };
    };

    const handleEditorPaste = (event: ClipboardEvent) => {
      const pastedText = event.clipboardData?.getData("text") ?? "";

      trackPaste(pastedText.length, "monaco-dom", pastedText);
    };

    editorNode.addEventListener("copy", captureEditorClipboard, true);
    editorNode.addEventListener("cut", captureEditorClipboard, true);
    editorNode.addEventListener("paste", handleEditorPaste, true);

    return () => {
      editorNode.removeEventListener("copy", captureEditorClipboard, true);
      editorNode.removeEventListener("cut", captureEditorClipboard, true);
      editorNode.removeEventListener("paste", handleEditorPaste, true);
    };
  }, [editorInstance]);

  function handleEditorMount(editor: MonacoEditor.IStandaloneCodeEditor) {
    setEditorInstance(editor);

    editor.onDidPaste((event) => {
      if (suppressEditorTrackingRef.current) {
        return;
      }

      const pastedText = editor.getModel()?.getValueInRange(event.range) ?? "";

      trackPaste(pastedText.length, "monaco-api", pastedText);
    });

    editor.onDidChangeModelContent((event) => {
      if (suppressEditorTrackingRef.current || event.isFlush) {
        return;
      }

      for (const change of event.changes) {
        if (change.text.length > 50) {
          trackPaste(change.text.length, "monaco-change", change.text);
          break;
        }
      }
    });
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-xl shadow-slate-950/30">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Coding Sandbox</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Write and run code</h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Language pill selector */}
            <div className="flex flex-wrap gap-1.5">
              {languageOptions.map((opt) => {
                const isActive = language === opt.value;
                const colors: Record<string, string> = {
                  javascript: isActive ? "border-yellow-400/60 bg-yellow-400/15 text-yellow-300" : "border-white/10 text-slate-400 hover:border-yellow-400/30 hover:text-yellow-300",
                  python:     isActive ? "border-sky-400/60 bg-sky-400/15 text-sky-300"        : "border-white/10 text-slate-400 hover:border-sky-400/30 hover:text-sky-300",
                  java:       isActive ? "border-orange-400/60 bg-orange-400/15 text-orange-300" : "border-white/10 text-slate-400 hover:border-orange-400/30 hover:text-orange-300",
                  c:          isActive ? "border-blue-400/60 bg-blue-400/15 text-blue-300"      : "border-white/10 text-slate-400 hover:border-blue-400/30 hover:text-blue-300",
                  cpp:        isActive ? "border-violet-400/60 bg-violet-400/15 text-violet-300" : "border-white/10 text-slate-400 hover:border-violet-400/30 hover:text-violet-300"
                };
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleLanguageChange(opt.value as SandboxLanguage)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold tracking-wide transition ${colors[opt.value]}`}
                  >
                    {opt.icon}&nbsp;&nbsp;{opt.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-2 rounded-2xl bg-teal-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isRunning
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Play className="h-4 w-4" />}
              {isRunning ? "Running..." : "Run"}
            </button>
            {headerActions}
          </div>
        </div>

        {/* Java note */}
        {language === "java" && (
          <div className="flex items-start gap-2 border-b border-white/5 bg-orange-500/5 px-5 py-3">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
            <p className="text-xs text-orange-200/80">
              Your Java code <strong>must</strong> use <code className="rounded bg-slate-800 px-1 text-orange-300">public class Solution</code> as the class name. The <code className="rounded bg-slate-800 px-1 text-orange-300">main</code> method is the entry point.
            </p>
          </div>
        )}
        {(language === "c" || language === "cpp") && (
          <div className="flex items-start gap-2 border-b border-white/5 bg-violet-500/5 px-5 py-3">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
            <p className="text-xs text-violet-200/80">
              Your code is compiled with <code className="rounded bg-slate-800 px-1 text-violet-300">{language === "c" ? "gcc -std=c11" : "g++ -std=c++17"}</code>. Use <code className="rounded bg-slate-800 px-1 text-violet-300">stdin</code> / <code className="rounded bg-slate-800 px-1 text-violet-300">stdout</code> for I/O.
            </p>
          </div>
        )}

        <Editor
          height="480px"
          language={getMonacoLanguage(language)}
          theme="vs-dark"
          value={code}
          onMount={handleEditorMount}
          onChange={(value) => {
            const newCode = value ?? "";
            setCode(newCode);
            onCodeChange?.(newCode);
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16 }
          }}
        />
      </div>

      {/* Custom stdin input */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/30">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">Custom Input (stdin)</h3>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          {language === "javascript" && <>Use <code className="rounded bg-slate-800 px-1 py-0.5 text-yellow-300">readLine()</code> / <code className="rounded bg-slate-800 px-1 py-0.5 text-yellow-300">readLines()</code> to read this input.</>}
          {language === "python" && <>Use <code className="rounded bg-slate-800 px-1 py-0.5 text-sky-300">input()</code> or <code className="rounded bg-slate-800 px-1 py-0.5 text-sky-300">sys.stdin.read()</code> to read this input.</>}
          {language === "java" && <>Use <code className="rounded bg-slate-800 px-1 py-0.5 text-orange-300">Scanner</code> or <code className="rounded bg-slate-800 px-1 py-0.5 text-orange-300">BufferedReader</code> on <code className="rounded bg-slate-800 px-1 py-0.5 text-orange-300">System.in</code>.</>}
          {(language === "c" || language === "cpp") && <>Use <code className="rounded bg-slate-800 px-1 py-0.5 text-violet-300">{language === "c" ? "scanf / fgets" : "cin / getline"}</code> to read from stdin.</>}
        </p>
        <textarea
          value={customStdin}
          onChange={(e) => setCustomStdin(e.target.value)}
          placeholder={"e.g.\n5\n1 2 3 4 5"}
          rows={3}
          className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-teal-400"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Output panel */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
          <h3 className="text-lg font-semibold text-white">Output</h3>
          <p className="mt-2 text-sm text-slate-300">
            Result of running your code against the custom input above.
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-4">
            <pre className="min-h-32 whitespace-pre-wrap break-words font-mono text-sm">
              {result
                ? result.timedOut
                  ? <span className="text-amber-300">⏱ Time limit exceeded (5s)</span>
                  : result.success && result.stdout
                    ? <span className="text-emerald-300">{result.stdout}</span>
                    : result.stderr
                      ? <span className="text-rose-300">❌ Error:{"\n\n"}{result.stderr}</span>
                      : <span className="text-slate-400">(no output)</span>
                : <span className="text-slate-500">Click &quot;Run Code&quot; to see output here.</span>}
            </pre>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
          <h3 className="text-lg font-semibold text-white">Behavior Tracking</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>Language: {language}</p>
            <p>Status: {isRunning ? "Running..." : result ? (result.success ? "✅ Passed" : "❌ Failed") : "Idle"}</p>
            <p>Tracked: tab visibility, large paste, inactivity.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
