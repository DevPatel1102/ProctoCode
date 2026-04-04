import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import { env } from "../config/env.js";

type LiveBehaviorEvent = {
  id: string;
  userId: string;
  email: string;
  type: string;
  timestamp: string;
  metadata: Record<string, unknown>;
  trustScore: number;
  sessionId: string;
};

let ioInstance: Server | null = null;

export function registerSocketServer(httpServer: HttpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true
    }
  });

  ioInstance.on("connection", (socket) => {
    socket.emit("system:ready", {
      message: "Socket server connected."
    });
  });

  return ioInstance;
}

export function emitBehaviorLogCreated(event: LiveBehaviorEvent) {
  ioInstance?.emit("behavior:created", event);
}
