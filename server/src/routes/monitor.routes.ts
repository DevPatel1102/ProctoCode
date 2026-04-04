import { Router } from "express";

import { getMonitorUsers, getRecentLogs } from "../controllers/monitor.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";

const monitorRouter = Router();

monitorRouter.get("/users", requireAuth, requireAdmin, getMonitorUsers);
monitorRouter.get("/events", requireAuth, requireAdmin, getRecentLogs);

export { monitorRouter };
