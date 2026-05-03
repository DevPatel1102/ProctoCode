import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import { env } from "../config/env.js";
import { verifyAuthToken } from "../utils/auth.js";

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

  // Authenticate every Socket.IO connection with JWT
  ioInstance.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ??
      socket.handshake.query?.token;

    if (!token || typeof token !== "string") {
      return next(new Error("Authentication required"));
    }

    try {
      const payload = verifyAuthToken(token);
      socket.data.userId = payload.userId;
      socket.data.email = payload.email;
      socket.data.role = payload.role;
      return next();
    } catch {
      return next(new Error("Invalid or expired token"));
    }
  });

  ioInstance.on("connection", (socket) => {
    // Only admins can subscribe to session monitoring rooms
    if (socket.data.role === "admin") {
      socket.on("monitor:subscribe", (sessionId: unknown) => {
        if (typeof sessionId === "string" && sessionId.length > 0) {
          void socket.join(`session:${sessionId}`);
        }
      });

      socket.on("monitor:unsubscribe", (sessionId: unknown) => {
        if (typeof sessionId === "string") {
          void socket.leave(`session:${sessionId}`);
        }
      });
    }

    socket.emit("system:ready", {
      message: "Socket server connected.",
      role: socket.data.role
    });
  });

  return ioInstance;
}

export function emitBehaviorLogCreated(event: LiveBehaviorEvent) {
  if (!ioInstance) {
    return;
  }

  // Emit only to the specific session room instead of broadcasting globally
  ioInstance.to(`session:${event.sessionId}`).emit("behavior:created", event);
}
