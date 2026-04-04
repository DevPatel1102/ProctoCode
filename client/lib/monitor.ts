export type MonitorUser = {
  id: string;
  email: string;
};

export type LiveBehaviorEvent = {
  id: string;
  userId: string;
  email: string;
  type: string;
  timestamp: string;
  metadata: Record<string, unknown>;
  trustScore: number;
  sessionId: string;
};

export function getSocketUrl() {
  return process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5000";
}
