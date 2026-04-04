"use client";

import { useEffect, useRef } from "react";

import { sendEvent } from "@/lib/behavior-tracking";

const INACTIVITY_MS = 120_000;
const FAST_TYPING_AVG_MS = 20;
const FAST_TYPING_SAMPLE_SIZE = 6;
const FAST_TYPING_COOLDOWN_MS = 10_000;

export function useBehaviorTracking() {
  const lastKeypressAtRef = useRef<number | null>(null);
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingIntervalsRef = useRef<number[]>([]);
  const lastFastTypingEventAtRef = useRef<number>(0);
  const lastVisibilityStateRef = useRef<"visible" | "hidden">("visible");

  useEffect(() => {
    const emitVisibilityEvent = (nextState: "visible" | "hidden") => {
      if (lastVisibilityStateRef.current === nextState) {
        return;
      }

      lastVisibilityStateRef.current = nextState;

      void sendEvent({
        type: nextState === "hidden" ? "TAB_HIDDEN" : "TAB_VISIBLE",
        timestamp: Date.now()
      });
    };

    const resetInactivityTimer = () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }

      inactivityTimeoutRef.current = setTimeout(() => {
        void sendEvent({
          type: "INACTIVE",
          timestamp: Date.now(),
          metadata: { duration: 120 }
        });
      }, INACTIVITY_MS);
    };

    const handleVisibilityChange = () => {
      emitVisibilityEvent(
        document.visibilityState === "hidden" ? "hidden" : "visible"
      );
    };

    const handleWindowBlur = () => {
      emitVisibilityEvent("hidden");
    };

    const handleWindowFocus = () => {
      emitVisibilityEvent("visible");
    };

    const handlePaste = (event: ClipboardEvent) => {
      const target =
        event.target instanceof Element
          ? event.target
          : event.target instanceof Node
            ? event.target.parentElement
            : null;

      if (target?.closest(".monaco-editor")) {
        return;
      }

      const pastedText = event.clipboardData?.getData("text") ?? "";

      if (pastedText.length > 50) {
        void sendEvent({
          type: "PASTE",
          timestamp: Date.now(),
          metadata: { length: pastedText.length }
        });
      }
    };

    const handleKeydown = () => {
      const now = Date.now();

      if (lastKeypressAtRef.current) {
        const interval = now - lastKeypressAtRef.current;
        const nextIntervals = [...typingIntervalsRef.current, interval].slice(
          -FAST_TYPING_SAMPLE_SIZE
        );

        typingIntervalsRef.current = nextIntervals;

        if (nextIntervals.length === FAST_TYPING_SAMPLE_SIZE) {
          const averageInterval =
            nextIntervals.reduce((sum, value) => sum + value, 0) /
            nextIntervals.length;

          if (
            averageInterval < FAST_TYPING_AVG_MS &&
            now - lastFastTypingEventAtRef.current > FAST_TYPING_COOLDOWN_MS
          ) {
            lastFastTypingEventAtRef.current = now;

            void sendEvent({
              type: "FAST_TYPING",
              timestamp: now
            });
          }
        }
      }

      lastKeypressAtRef.current = now;
      resetInactivityTimer();
    };

    resetInactivityTimer();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("paste", handlePaste);
    window.addEventListener("keydown", handleKeydown);

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);
}
