import type { Request, Response } from "express";

import { runCode } from "../services/sandbox.service.js";

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

    const result = await runCode({
      code,
      language: language as "javascript" | "python"
    });

    return response.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Code execution failed";

    return response.status(500).json({ message });
  }
}
