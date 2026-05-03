import { Router } from "express";

import { executeCode } from "../controllers/sandbox.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const sandboxRouter = Router();

sandboxRouter.post("/run", requireAuth, executeCode);

export { sandboxRouter };
