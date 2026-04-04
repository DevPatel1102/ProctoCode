"use client";

import { useEffect, useState } from "react";

import { useSession } from "@/components/providers/session-provider";

type TrustScoreResponse = {
  trustScore: number;
};

function getTrustScoreTone(score: number) {
  if (score >= 70) {
    return {
      label: "Stable",
      classes: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
    };
  }

  if (score >= 40) {
    return {
      label: "Warning",
      classes: "border-amber-400/30 bg-amber-500/10 text-amber-200"
    };
  }

  return {
    label: "High Risk",
    classes: "border-rose-400/30 bg-rose-500/10 text-rose-200"
  };
}

export function TrustScoreCard() {
  const { currentSession } = useSession();
  const [trustScore, setTrustScore] = useState(100);
  const tone = getTrustScoreTone(trustScore);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentTrustScore = async () => {
      if (!currentSession?.sessionId) {
        return;
      }

      const response = await fetch(
        `/api/trust-score/current?sessionId=${currentSession.sessionId}`,
        {
        cache: "no-store"
        }
      );

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as TrustScoreResponse;

      if (isMounted) {
        setTrustScore(data.trustScore);
      }
    };

    const handleTrustScoreUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ trustScore: number }>;
      setTrustScore(customEvent.detail.trustScore);
    };

    void loadCurrentTrustScore();
    window.addEventListener("trust-score:updated", handleTrustScoreUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("trust-score:updated", handleTrustScoreUpdate);
    };
  }, [currentSession?.sessionId]);

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${tone.classes}`}>
      <p className="font-medium">Trust Score: {trustScore}</p>
      <p className="mt-1 text-xs opacity-90">{tone.label}</p>
    </div>
  );
}
