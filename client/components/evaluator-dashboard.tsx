"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { io, type Socket } from "socket.io-client";

import { getSocketUrl, type LiveBehaviorEvent, type MonitorUser } from "@/lib/monitor";

type EvaluatorDashboardProps = {
  initialUsers: MonitorUser[];
  initialEvents: LiveBehaviorEvent[];
};

export function EvaluatorDashboard({
  initialUsers,
  initialEvents
}: EvaluatorDashboardProps) {
  const [events, setEvents] = useState<LiveBehaviorEvent[]>(initialEvents);
  const [connectionState, setConnectionState] = useState("Connecting...");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    initialEvents[0]?.id ?? null
  );

  useEffect(() => {
    const socket: Socket = io(getSocketUrl(), {
      transports: ["websocket"],
      withCredentials: true
    });

    socket.on("connect", () => {
      setConnectionState("Live");
    });

    socket.on("disconnect", () => {
      setConnectionState("Disconnected");
    });

    socket.on("behavior:created", (event: LiveBehaviorEvent) => {
      setEvents((current) => [event, ...current].slice(0, 100));
    });

    socket.on("connect_error", () => {
      setConnectionState("Connection error");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const userCounts = useMemo(() => {
    return initialUsers.map((user) => ({
      ...user,
      count: events.filter((event) => event.userId === user.id).length
    }));
  }, [events, initialUsers]);

  const filteredEvents = useMemo(() => {
    if (selectedUserId === "all") {
      return events;
    }

    return events.filter((event) => event.userId === selectedUserId);
  }, [events, selectedUserId]);

  const timelineData = useMemo(() => {
    return [...filteredEvents]
      .slice()
      .reverse()
      .map((event, index) => ({
        ...event,
        sequence: index + 1,
        label: new Date(event.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      }));
  }, [filteredEvents]);

  const selectedEvent =
    filteredEvents.find((event) => event.id === selectedEventId) ?? filteredEvents[0] ?? null;

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

  return (
    <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
                Evaluator View
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">Users</h2>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-2 text-sm text-slate-200">
              Socket: {connectionState}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => setSelectedUserId("all")}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                selectedUserId === "all"
                  ? "border-teal-300 bg-teal-400/10"
                  : "border-white/10 bg-slate-950/80"
              }`}
            >
              <p className="font-medium text-white">All users</p>
              <p className="mt-1 text-sm text-slate-400">
                Events in current feed: {events.length}
              </p>
            </button>

            {userCounts.length ? (
              userCounts.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    selectedUserId === user.id
                      ? "border-teal-300 bg-teal-400/10"
                      : "border-white/10 bg-slate-950/80"
                  }`}
                >
                  <p className="font-medium text-white">{user.email}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Events in current feed: {user.count}
                  </p>
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-300">No users found yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
          <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
            Event Detail
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {selectedEvent ? selectedEvent.type : "No event selected"}
          </h2>
          {selectedEvent ? (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Candidate
                  </p>
                  <p className="mt-2 text-sm text-white">{selectedEvent.email}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Trust Score
                  </p>
                  <p className="mt-2 text-sm text-white">{selectedEvent.trustScore}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Event metadata
                </p>
                <pre className="mt-3 whitespace-pre-wrap break-words text-xs text-slate-300">
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-300">
              Click a point in the timeline or an event card to inspect its details.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-cyan-950/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
                Trust Timeline
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Score trend with event markers
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                The line shows trust score drift over time. Colored markers highlight
                suspicious moments such as tab switches, paste actions, and inactivity.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-amber-200">
                Tab switch
              </span>
              <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-rose-200">
                Paste
              </span>
              <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-sky-200">
                Inactivity
              </span>
            </div>
          </div>

          <div className="mt-6 h-[360px] w-full rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_transparent_40%),linear-gradient(180deg,_rgba(15,23,42,0.95),_rgba(2,6,23,0.95))] p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 20, right: 12, left: -12, bottom: 8 }}>
                <defs>
                  <linearGradient id="trustGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.35} />
                  </linearGradient>
                </defs>
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
                  formatter={(value, name) => [value, name === "trustScore" ? "Trust Score" : name]}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend wrapperStyle={{ color: "#cbd5e1" }} />
                <Line
                  type="monotone"
                  dataKey="trustScore"
                  name="Trust Score"
                  stroke="url(#trustGlow)"
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

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-teal-300">
                Live Stream
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">Behavior events</h2>
            </div>
            <div className="text-sm text-slate-400">{filteredEvents.length} shown</div>
          </div>

          <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {filteredEvents.length ? (
              filteredEvents.map((event) => (
              <article
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={`cursor-pointer rounded-2xl border px-4 py-4 transition ${
                  selectedEvent?.id === event.id
                    ? "border-teal-300 bg-teal-400/10"
                    : "border-white/10 bg-slate-950/80"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{event.email}</p>
                    <p
                      className="text-sm"
                      style={{ color: getEventTone(event.type) }}
                    >
                      {event.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-300">
                      Trust Score: {event.trustScore}
                    </p>
                  </div>
                </div>
                <pre className="mt-3 whitespace-pre-wrap break-words text-xs text-slate-300">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </article>
              ))
            ) : (
              <p className="text-sm text-slate-300">No events yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
