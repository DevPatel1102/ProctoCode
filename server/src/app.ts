import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { router } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true
    })
  );

  app.use(express.json());
  app.use("/api", router);

  return app;
}
