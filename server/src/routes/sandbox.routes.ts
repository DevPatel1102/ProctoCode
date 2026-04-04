import { Router } from "express";

import { executeCode } from "../controllers/sandbox.controller.js";

const sandboxRouter = Router();

sandboxRouter.post("/run", executeCode);

export { sandboxRouter };
