"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { getCurrentSessionFromBrowser, type CurrentSession } from "@/lib/session";

type SessionContextValue = {
  currentSession: CurrentSession | null;
  setCurrentSession: (session: CurrentSession | null) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

type SessionProviderProps = {
  children: ReactNode;
  initialSession: CurrentSession | null;
};

export function SessionProvider({
  children,
  initialSession
}: SessionProviderProps) {
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(
    initialSession
  );

  useEffect(() => {
    const browserSession = getCurrentSessionFromBrowser();

    if (browserSession?.sessionId !== currentSession?.sessionId) {
      setCurrentSession(browserSession);
    }
  }, [currentSession?.sessionId]);

  const value = useMemo(
    () => ({
      currentSession,
      setCurrentSession
    }),
    [currentSession]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }

  return context;
}
