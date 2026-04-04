import { Router } from "express";

import {
  login,
  requestForgotPassword,
  resetForgotPassword,
  signup
} from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/forgot-password/request", requestForgotPassword);
authRouter.post("/forgot-password/reset", resetForgotPassword);

export { authRouter };
