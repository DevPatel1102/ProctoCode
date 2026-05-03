import type { Request, Response } from "express";

import { syntaxCheckCode, submitCode } from "../services/sandbox.service.js";
import { Session } from "../models/session.model.js";

const supportedLanguages = new Set(["javascript", "python"]);

export async function executeCode(request: Request, response: Response) {
  try {
    const { code, language } = request.body as {
      code?: string;
      language?: string;
    };

    if (!code || !language) {
      return response.status(400).json({
        message: "Code and language are required"
      });
    }

    if (!supportedLanguages.has(language)) {
      return response.status(400).json({
        message: "Unsupported language"
      });
    }

    if (code.length > 10_000) {
      return response.status(400).json({
        message: "Code is too large"
      });
    }

    const result = await syntaxCheckCode(
      code,
      language as "javascript" | "python"
    );

    return response.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Code execution failed";

    return response.status(500).json({ message });
  }
}

export async function submitCodeForSession(request: Request, response: Response) {
  try {
    const { code, language, sessionId } = request.body as {
      code?: string;
      language?: string;
      sessionId?: string;
    };

    if (!code || !language || !sessionId) {
      return response.status(400).json({
        message: "Code, language, and sessionId are required"
      });
    }

    if (!supportedLanguages.has(language)) {
      return response.status(400).json({
        message: "Unsupported language"
      });
    }

    if (code.length > 10_000) {
      return response.status(400).json({
        message: "Code is too large"
      });
    }

    const session = await Session.findById(sessionId);
    if (!session || !session.isActive) {
      return response.status(404).json({ message: "Session not found or inactive" });
    }

    const testCases = session.testCases || [];
    if (testCases.length === 0) {
      return response.status(400).json({ message: "No test cases defined for this session" });
    }

    const results = await submitCode(
      code,
      language as "javascript" | "python",
      testCases
    );

    const allPassed = results.every((r) => r.passed);

    return response.status(200).json({
      success: true,
      allPassed,
      results: results.map((r) => ({
        passed: r.passed,
        actualOutput: r.actualOutput,
        expectedOutput: r.expectedOutput,
        error: r.error,
        isHidden: r.isHidden
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Code submission failed";
    return response.status(500).json({ message });
  }
}
