import { Router } from "express";

import { getCurrentTrustScore } from "../controllers/trust-score.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const trustScoreRouter = Router();

trustScoreRouter.get("/current", requireAuth, getCurrentTrustScore);

export { trustScoreRouter };
