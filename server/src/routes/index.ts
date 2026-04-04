import { Router } from "express";

import { requireAuth } from "../middlewares/auth.middleware.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { authRouter } from "./auth.routes.js";
import { logRouter } from "./log.routes.js";
import { monitorRouter } from "./monitor.routes.js";
import { sandboxRouter } from "./sandbox.routes.js";
import { sessionRouter } from "./session.routes.js";
import { trustScoreRouter } from "./trust-score.routes.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/logs", logRouter);
router.use("/monitor", monitorRouter);
router.use("/sandbox", sandboxRouter);
router.use("/sessions", sessionRouter);
router.use("/trust-score", trustScoreRouter);

router.get("/health", (_request, response) => {
  response.status(200).json({
    ok: true,
    service: "ghost-proof-server",
    timestamp: new Date().toISOString()
  });
});

router.get("/auth/me", requireAuth, (request, response) => {
  const authenticatedRequest = request as AuthenticatedRequest;

  response.status(200).json({
    user: authenticatedRequest.authUser
  });
});

export { router };
