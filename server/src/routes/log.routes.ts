import { Router } from "express";

import { createLog } from "../controllers/log.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const logRouter = Router();

logRouter.post("/", requireAuth, createLog);

export { logRouter };
