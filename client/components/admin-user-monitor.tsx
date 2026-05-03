"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { io, type Socket } from "socket.io-client";

import { getSocketUrl, type LiveBehaviorEvent } from "@/lib/monitor";
import { getAuthTokenFromBrowser } from "@/lib/auth";

type AdminUserMonitorProps = {
  sessionId: string;
  userId: string;
  sessionCode: string;
  userEmail: string;
  initialEvents: LiveBehaviorEvent[];
  token: string;
};

function getEventTone(type: string) {
  if (type === "PASTE") {
    return "#fb7185";
  }

  if (type === "TAB_HIDDEN") {
    return "#f59e0b";
  }

  if (type === "INACTIVE") {
    return "#38bdf8";
  }

  return "#2dd4bf";
}

export function AdminUserMonitor({
  sessionId,
  userId,
  sessionCode,
  userEmail,
  initialEvents,
  token
}: AdminUserMonitorProps) {
  const [events, setEvents] = useState<LiveBehaviorEvent[]>(initialEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    initialEvents[0]?.id ?? null
  );
  const [connectionState, setConnectionState] = useState("Connecting...");

  useEffect(() => {
    setEvents(initialEvents);
    setSelectedEventId(initialEvents[0]?.id ?? null);
  }, [initialEvents]);

  useEffect(() => {
    const socket: Socket = io(getSocketUrl(), {
      transports: ["websocket"],
      withCredentials: true,
      auth: { token }
    });

    socket.on("connect", () => {
      setConnectionState("Live");
      socket.emit("monitor:subscribe", sessionId);
    });

    socket.on("disconnect", () => {
      setConnectionState("Disconnected");
    });

    socket.on("connect_error", (error) => {
      setConnectionState(
        error.message === "Authentication required"
          ? "Auth required"
          : "Connection error"
      );
    });

    socket.on("behavior:created", (event: LiveBehaviorEvent) => {
      if (event.sessionId !== sessionId || event.userId !== userId) {
        return;
      }

      console.log("Received live event!", event); setEvents((current) => [event, ...current].slice(0, 100));
      setSelectedEventId((current) => current ?? event.id);
    });

    return () => {
      socket.emit("monitor:unsubscribe", sessionId);
      socket.disconnect();
    };
  }, [sessionId, userId]);

  const timelineData = useMemo(
    () =>
      [...events].reverse().map((event) => ({
        ...event,
        label: new Date(event.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      })),
    [events]
  );

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0] ?? null;

  return (
    <div className="rounded-3xl border border-cyan-400/20 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.15),_transparent_38%),linear-gradient(180deg,_rgba(15,23,42,0.92),_rgba(2,6,23,0.96))] p-6 shadow-2xl shadow-cyan-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
            Session Monitor
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{userEmail}</h3>
          <p className="mt-2 text-sm text-slate-300">
            Session {sessionCode}. Click a marker or feed item to inspect the event.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2 text-sm text-slate-200">
            {events.length} events
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2 text-sm text-slate-200">
            Socket: {connectionState}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-3">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 20, right: 12, left: -12, bottom: 8 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis
                  dataKey="label"
                  minTickGap={24}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    border: "1px solid rgba(148,163,184,0.15)",
                    borderRadius: "18px",
                    color: "#e2e8f0"
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="trustScore"
                  stroke="#2dd4bf"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: "#2dd4bf" }}
                />
                {timelineData.map((entry) => (
                  <ReferenceDot
                    key={entry.id}
                    x={entry.label}
                    y={entry.trustScore}
                    r={selectedEvent?.id === entry.id ? 8 : 5}
                    fill={getEventTone(entry.type)}
                    stroke={selectedEvent?.id === entry.id ? "#ffffff" : "transparent"}
                    strokeWidth={2}
                    ifOverflow="visible"
                    onClick={() => setSelectedEventId(entry.id)}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Selected event
            </p>
            <h4 className="mt-2 text-lg font-semibold text-white">
              {selectedEvent?.type ?? "No event selected"}
            </h4>
            {selectedEvent ? (
              <>
                <p className="mt-2 text-sm text-slate-300">
                  {new Date(selectedEvent.timestamp).toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Trust Score: {selectedEvent.trustScore}
                </p>
                <pre className="mt-4 whitespace-pre-wrap break-words text-xs text-slate-300">
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-300">No detail available yet.</p>
            )}
          </div>

          <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
            {events.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedEventId(event.id)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  selectedEvent?.id === event.id
                    ? "border-teal-300 bg-teal-400/10"
                    : "border-white/10 bg-slate-950/80"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{event.type}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      color: getEventTone(event.type),
                      backgroundColor: "rgba(15,23,42,0.9)"
                    }}
                  >
                    {event.trustScore}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
