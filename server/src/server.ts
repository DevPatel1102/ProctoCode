import { createServer } from "node:http";

import { createApp } from "./app.js";
import { connectToDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { registerSocketServer } from "./sockets/index.js";

async function bootstrap() {
  await connectToDatabase();

  const app = createApp();
  const httpServer = createServer(app);

  registerSocketServer(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`ProctoCode server listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start ProctoCode server:", error);
  process.exit(1);
});
