import { Router } from "express";

import { analyzeBehaviorHandler, generateProblemHandler, getCodeReview, sessionSummaryHandler, triggerCodeReview } from "../controllers/ai.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";

const aiRouter = Router();

aiRouter.get("/code-review", requireAuth, requireAdmin, getCodeReview);
aiRouter.post("/code-review", requireAuth, requireAdmin, triggerCodeReview);
aiRouter.post("/generate-problem", requireAuth, requireAdmin, generateProblemHandler);
aiRouter.post("/behavior-analysis", requireAuth, requireAdmin, analyzeBehaviorHandler);
aiRouter.post("/session-summary", requireAuth, requireAdmin, sessionSummaryHandler);

export { aiRouter };
