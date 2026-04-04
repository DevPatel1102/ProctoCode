import { getCurrentSessionFromBrowser } from "./session";

export const allowedBehaviorEventTypes = [
  "TAB_HIDDEN",
  "TAB_VISIBLE",
  "PASTE",
  "INACTIVE",
  "FAST_TYPING"
] as const;

export type BehaviorEventType = (typeof allowedBehaviorEventTypes)[number];

export type BehaviorEvent = {
  type: BehaviorEventType;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

type SendEventResponse = {
  trustScore?: number;
};

export async function sendEvent(event: BehaviorEvent) {
  try {
    const currentSession = getCurrentSessionFromBrowser();

    if (!currentSession) {
      return;
    }

    const response = await fetch("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...event,
        sessionId: currentSession.sessionId
      }),
      keepalive: true
    });

    const data = (await response.json()) as SendEventResponse;

    if (response.ok && typeof data.trustScore === "number") {
      window.dispatchEvent(
        new CustomEvent("trust-score:updated", {
          detail: {
            trustScore: data.trustScore
          }
        })
      );
    }
  } catch (error) {
    console.error("Failed to send behavior event", error);
  }
}
