import { Router } from "express";

import { executeCode, submitCodeForSession } from "../controllers/sandbox.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const sandboxRouter = Router();

sandboxRouter.post("/run", requireAuth, executeCode);
sandboxRouter.post("/submit", requireAuth, submitCodeForSession);

export { sandboxRouter };
