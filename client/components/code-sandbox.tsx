"use client";

import Editor from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { useEffect, useRef, useState } from "react";

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
        body: JSON.stringify({ language, code })
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
        <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
              Coding Sandbox
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Write and run code
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={language}
              onChange={(event) =>
                handleLanguageChange(event.target.value as SandboxLanguage)
              }
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400"
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning}
              className="rounded-2xl bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isRunning ? "Running..." : "Run Code"}
            </button>
            {headerActions}
          </div>
        </div>

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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
          <h3 className="text-lg font-semibold text-white">Syntax Check</h3>
          <p className="mt-2 text-sm text-slate-300">
            Checks your code for syntax errors without executing it.
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-4">
            <pre className="min-h-32 whitespace-pre-wrap break-words text-sm text-slate-200">
              {result
                ? result.success
                  ? "✅ Code runs successfully — no syntax errors found."
                  : `❌ Syntax Error:\n\n${result.stderr || "Unknown error"}`
                : "Click \"Run Code\" to check for syntax errors."}
            </pre>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
          <h3 className="text-lg font-semibold text-white">Behavior Tracking</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>Language: {language}</p>
            <p>Status: {isRunning ? "Checking..." : result ? (result.success ? "Passed" : "Failed") : "Idle"}</p>
            <p>Tracked: tab visibility, large paste, inactivity.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
