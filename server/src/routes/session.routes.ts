import { Router } from "express";

import {
  createNewSession,
  deactivateExistingSession,
  deleteExistingSession,
  getMySessions,
  getSessions,
  getSessionUsers,
  joinExistingSession,
  leaveCurrentSession
} from "../controllers/session.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";

const sessionRouter = Router();

sessionRouter.post("/", requireAuth, requireAdmin, createNewSession);
sessionRouter.get("/", requireAuth, requireAdmin, getSessions);
sessionRouter.get("/mine", requireAuth, getMySessions);
sessionRouter.post("/join", requireAuth, joinExistingSession);
sessionRouter.post("/leave", requireAuth, leaveCurrentSession);
sessionRouter.get("/:id/users", requireAuth, requireAdmin, getSessionUsers);
sessionRouter.patch("/:id/deactivate", requireAuth, requireAdmin, deactivateExistingSession);
sessionRouter.delete("/:id", requireAuth, requireAdmin, deleteExistingSession);

export { sessionRouter };
