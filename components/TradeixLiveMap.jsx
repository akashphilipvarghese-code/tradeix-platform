"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, Ship, Plane, Truck, Train, Bell, ChevronRight, CircleCheck, Circle, TriangleAlert, X, LoaderCircle, RefreshCw } from "lucide-react";

// ---------------------------------------------------------------------------
// Design tokens (Tradeix "Command Center" system — dashboard track, restrained
// per the landing-page skill's split: marketing site is expressive, the
// product surface is efficient, dense, and quiet).
// ---------------------------------------------------------------------------
const T = {
  bg: "#0A0E14",
  surface: "#121826",
  surfaceRaised: "#1A2233",
  border: "#232C3D",
  text: "#F2F3F5",
  textDim: "#8892A6",
  gold: "#C9A34E",
  blue: "#5B8DEF",
  green: "#3DDC84",
  amber: "#E8A33D",
  red: "#F0555C",
};

// ---------------------------------------------------------------------------
// Mock data — shaped exactly like Shipment / AIPrediction / JourneyMilestone
// from types.ts, so swapping in a real API means changing only the fetch,
// never the component shape.
// ---------------------------------------------------------------------------
const HUBS = {
  newyork: { name: "New York", x: 21, y: 34 },
  rotterdam: { name: "Rotterdam", x: 47, y: 26 },
  suez: { name: "Suez Canal", x: 57, y: 40 },
  mumbai: { name: "Mumbai", x: 68, y: 47 },
  singapore: { name: "Singapore", x: 76, y: 55 },
  shanghai: { name: "Shanghai", x: 81, y: 38 },
  losangeles: { name: "Los Angeles", x: 10, y: 38 },
};

const MODE_ICON = { ocean: Ship, air: Plane, road: Truck, rail: Train };

const STATUS_COLOR = {
  in_transit: T.blue,
  delayed: T.amber,
  delivered: T.green,
  customs: T.gold,
  exception: T.red,
  booking_confirmed: T.textDim,
};

// Color is never the only signal — every status also gets a short text label.
const STATUS_LABEL = {
  in_transit: "In Transit",
  delayed: "Delayed",
  delivered: "Delivered",
  customs: "Customs",
  exception: "Exception",
  booking_confirmed: "Booked",
};

// Generic milestone sequence per mode, since the DB only tracks discrete
// status changes today (status_history), not route-specific waypoints yet.
// This is an honest simplification — flagged, not hidden.
const MILESTONE_SEQUENCE = {
  ocean: ["booking_confirmed", "container_loaded", "in_transit", "at_port", "customs", "delivered"],
  air: ["booking_confirmed", "container_loaded", "in_transit", "customs", "delivered"],
  road: ["booking_confirmed", "in_transit", "customs", "delivered"],
  rail: ["booking_confirmed", "in_transit", "delivered"],
};
const MILESTONE_LABEL = {
  booking_confirmed: "Booking Confirmed", container_loaded: "Cargo Loaded",
  in_transit: "In Transit", at_port: "At Port", customs: "Customs Clearance",
  delayed: "Delayed", exception: "Exception", delivered: "Final Delivery",
};

function nameToHubKey(portName) {
  const hit = Object.entries(HUBS).find(([, h]) => h.name.toLowerCase() === (portName || "").toLowerCase());
  return hit ? hit[0] : null;
}

function buildMilestones(mode, status) {
  const seq = MILESTONE_SEQUENCE[mode] || MILESTONE_SEQUENCE.ocean;
  const idx = seq.indexOf(status);
  return seq.map((s, i) => ({
    label: MILESTONE_LABEL[s] || s,
    state: idx === -1 ? "pending" : i < idx ? "done" : i === idx ? "current" : "pending",
  }));
}

// Shapes a raw API shipment (Prisma field names) into the view model the
// rest of this component already expects — the only place that changes
// when the backend response shape changes.
function toViewShipment(api) {
  const origin = nameToHubKey(api.originPort);
  const destination = nameToHubKey(api.destinationPort);
  const latestAI = api.aiPredictions?.[0];
  return {
    id: api.id,
    bookingNumber: api.bookingNumber,
    vesselName: api.vesselName || "—",
    carrier: api.carrier,
    transportMode: api.transportMode,
    status: api.status,
    origin: origin || "newyork",
    destination: destination || "mumbai",
    routeProgressPct: api.routeProgressPct ?? 0,
    cargoType: api.cargoType,
    cargoWeightKg: api.cargoWeightKg,
    isDangerousGoods: !!api.isDangerousGoods,
    milestones: buildMilestones(api.transportMode, api.status),
    ai: latestAI ? { kind: latestAI.kind, reasoning: latestAI.reasoning, confidence: latestAI.confidence } : null,
  };
}

const MODES = ["ocean", "air", "road", "rail"];
const STATUSES = ["in_transit", "delayed", "customs", "delivered"];

// Point along a quadratic bezier (origin -> control -> destination), t in [0,1]
function bezierPoint(p0, p1, p2, t) {
  const x = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x;
  const y = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y;
  return { x, y };
}

function routeControlPoint(a, b) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  // arch the curve upward (toward lower y) so routes read as great-circle paths
  return { x: mx, y: my - Math.abs(a.x - b.x) * 0.18 - 6 };
}

function StatusDot({ status, withLabel }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLOR[status] || T.textDim }} aria-hidden="true" />
      {withLabel && <span className="text-[10px]" style={{ color: T.textDim }}>{STATUS_LABEL[status]}</span>}
    </span>
  );
}

function KPI({ label, value, color }) {
  return (
    <div className="flex flex-col px-4 border-l first:border-l-0" style={{ borderColor: T.border }}>
      <span className="text-[11px] uppercase tracking-wider" style={{ color: T.textDim }}>{label}</span>
      <span className="text-lg font-semibold" style={{ color: color || T.text }}>{value}</span>
    </div>
  );
}

function ShipmentRow({ s, active, onClick }) {
  const Icon = MODE_ICON[s.transportMode];
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-md flex items-center gap-3 transition-colors"
      style={{ background: active ? T.surfaceRaised : "transparent" }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#141C2C"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <Icon size={16} color={active ? T.gold : T.textDim} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: T.text }}>{s.bookingNumber}</div>
        <div className="text-xs truncate" style={{ color: T.textDim }}>
          {HUBS[s.origin].name} → {HUBS[s.destination].name}
        </div>
      </div>
      <StatusDot status={s.status} withLabel />
    </button>
  );
}

function Milestone({ label, state }) {
  const Icon = state === "done" ? CircleCheck : Circle;
  const color = state === "done" ? T.green : state === "current" ? T.gold : "#4A5468";
  return (
    <div className="flex items-center gap-2 py-1">
      <Icon size={14} color={color} fill={state === "current" ? T.gold : "none"} />
      <span
        className="text-xs"
        style={{ color: state === "pending" ? T.textDim : T.text, fontWeight: state === "current" ? 600 : 400 }}
      >
        {label}
      </span>
    </div>
  );
}

function AIPanel({ ai }) {
  // Graceful degradation: if there's no prediction, the panel says so plainly —
  // it never renders a blank space or a fake score.
  if (!ai) {
    return (
      <div className="rounded-lg p-3 text-xs" style={{ background: T.surfaceRaised, color: T.textDim, border: `1px solid ${T.border}` }}>
        No AI signal for this shipment right now. Tracking data above is live and unaffected.
      </div>
    );
  }
  const kindLabel = {
    delay: "Delay Prediction", congestion: "Port Congestion Alert",
    route_optimization: "Route Optimization", risk: "Risk Detection",
  }[ai.kind];
  return (
    <div className="rounded-lg p-3" style={{ background: "#1D1708", border: `1px solid #3A2E10` }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <TriangleAlert size={13} color={T.gold} />
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: T.gold }}>{kindLabel}</span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: T.text }}>{ai.reasoning}</p>
      {ai.confidence != null && (
        <p className="text-[10px] mt-1.5" style={{ color: T.textDim }}>Confidence {Math.round(ai.confidence * 100)}% — reasoning shown, not just a score.</p>
      )}
    </div>
  );
}

export default function TradeixLiveMap() {
  const [query, setQuery] = useState("");
  const [modeFilter, setModeFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedId, setSelectedId] = useState("s1");
  const [progressOverride, setProgressOverride] = useState({});
  const [screenState, setScreenState] = useState("loading"); // loading | ready | error
  const [shipments, setShipments] = useState([]);
  const reducedMotion = useRef(typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  // Real fetch against the shipments API — replaces the earlier simulated
  // timeout. 401 (not signed in) and network failures both land on the
  // same honest error state; nothing here fakes a "ready" screen.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/shipments")
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setShipments(data.shipments.map(toViewShipment));
        setScreenState("ready");
      })
      .catch(() => {
        if (!cancelled) setScreenState("error");
      });
    return () => { cancelled = true; };
  }, []);

  // Live-movement simulation: advance the selected in-transit shipment's
  // progress slowly, respecting reduced-motion preference.
  // (Placeholder for real position updates — swap for a WebSocket subscription
  // once a live tracking feed exists, per Phase 5/8 of the roadmap.)
  useEffect(() => {
    if (reducedMotion.current) return;
    const id = setInterval(() => {
      setProgressOverride((prev) => {
        const next = { ...prev };
        shipments.forEach((s) => {
          if (s.status === "in_transit") {
            const base = prev[s.id] ?? s.routeProgressPct;
            next[s.id] = base >= 99 ? s.routeProgressPct : base + 0.15;
          }
        });
        return next;
      });
    }, 200);
    return () => clearInterval(id);
  }, [shipments]);

  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      if (modeFilter && s.transportMode !== modeFilter) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      if (query && !s.bookingNumber.toLowerCase().includes(query.toLowerCase()) && !s.vesselName.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [shipments, query, modeFilter, statusFilter]);

  const selected = shipments.find((s) => s.id === selectedId) || filtered[0];

  const kpis = useMemo(() => {
    const active = shipments.filter((s) => s.status !== "delivered" && s.status !== "cancelled").length;
    const delayed = shipments.filter((s) => s.status === "delayed").length;
    const delivered = shipments.filter((s) => s.status === "delivered").length;
    const onTimePct = shipments.length ? Math.round(((shipments.length - delayed) / shipments.length) * 100) : 0;
    return { active, delayed, delivered, onTimePct };
  }, [shipments]);

  if (screenState === "loading") {
    return (
      <div className="w-full h-[720px] flex flex-col items-center justify-center gap-3 rounded-xl" style={{ background: T.bg }}>
        <LoaderCircle size={22} color={T.gold} className="animate-spin" />
        <p className="text-xs" style={{ color: T.textDim }}>Connecting to live tracking feed…</p>
      </div>
    );
  }

  if (screenState === "error") {
    return (
      <div className="w-full h-[720px] flex flex-col items-center justify-center gap-3 rounded-xl" style={{ background: T.bg }}>
        <TriangleAlert size={22} color={T.red} />
        <p className="text-sm" style={{ color: T.text }}>Couldn&apos;t reach the live tracking feed.</p>
        <p className="text-xs max-w-xs text-center" style={{ color: T.textDim }}>Your other Tradeix tools still work — this only affects live map data.</p>
        <button
          onClick={() => setScreenState("ready")}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md mt-1"
          style={{ background: T.surfaceRaised, color: T.text, border: `1px solid ${T.border}` }}
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-[720px] flex flex-col overflow-hidden rounded-xl" style={{ background: T.bg, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: T.border, background: T.surface }}>
        <div className="flex items-center gap-3">
          <span className="text-lg font-serif tracking-wide" style={{ color: T.text }}>TRADEIX</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: T.surfaceRaised, color: T.gold }}>LIVE MAP</span>
        </div>
        <div className="flex items-center">
          <KPI label="Active" value={kpis.active} />
          <KPI label="Delayed" value={kpis.delayed} color={T.amber} />
          <KPI label="Delivered Today" value={kpis.delivered} color={T.green} />
          <KPI label="On-Time" value={`${kpis.onTimePct}%`} color={T.blue} />
        </div>
        <button onClick={() => setScreenState("error")} title="Simulate connection error (demo)" className="p-1 rounded hover:opacity-80">
          <Bell size={17} color={T.textDim} />
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: shipment list */}
        <div className="w-64 flex flex-col border-r shrink-0" style={{ borderColor: T.border, background: T.surface }}>
          <div className="p-3 border-b" style={{ borderColor: T.border }}>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
              <Search size={14} color={T.textDim} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shipment, vessel..."
                className="bg-transparent text-xs outline-none flex-1"
                style={{ color: T.text }}
              />
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {MODES.map((m) => {
                const Icon = MODE_ICON[m];
                const active = modeFilter === m;
                return (
                  <button
                    key={m}
                    onClick={() => setModeFilter(active ? null : m)}
                    className="p-1.5 rounded-md"
                    style={{ background: active ? T.surfaceRaised : "transparent", border: `1px solid ${active ? T.gold : T.border}` }}
                    title={m}
                  >
                    <Icon size={13} color={active ? T.gold : T.textDim} />
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {STATUSES.map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(statusFilter === st ? null : st)}
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    background: statusFilter === st ? T.surfaceRaised : "transparent",
                    color: statusFilter === st ? T.text : T.textDim,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-center mt-6" style={{ color: T.textDim }}>No shipments match these filters.</p>
            ) : (
              filtered.map((s) => (
                <ShipmentRow key={s.id} s={s} active={s.id === selected?.id} onClick={() => setSelectedId(s.id)} />
              ))
            )}
          </div>
        </div>

        {/* Center: map */}
        <div className="flex-1 relative" style={{ background: "radial-gradient(ellipse at 50% 40%, #0E1420 0%, #080B10 100%)" }}>
          <svg viewBox="0 0 100 65" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* faint lat/long grid — abstract globe, not literal cartography */}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`h${i}`} x1="0" x2="100" y1={i * 10 + 5} y2={i * 10 + 5} stroke="#182131" strokeWidth="0.15" />
            ))}
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 10} x2={i * 10} y1="0" y2="65" stroke="#182131" strokeWidth="0.15" />
            ))}

            {/* all routes, dimmed */}
            {shipments.map((s) => {
              const a = HUBS[s.origin], b = HUBS[s.destination];
              const c = routeControlPoint(a, b);
              const isSel = s.id === selected?.id;
              return (
                <path
                  key={s.id}
                  d={`M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`}
                  fill="none"
                  stroke={isSel ? T.gold : "#2A3346"}
                  strokeWidth={isSel ? 0.35 : 0.2}
                  opacity={isSel ? 0.9 : 0.5}
                />
              );
            })}

            {/* hubs */}
            {Object.entries(HUBS).map(([key, h]) => (
              <g key={key}>
                <circle cx={h.x} cy={h.y} r="0.5" fill={T.textDim} />
                <text x={h.x + 1} y={h.y + 0.8} fontSize="1.6" fill={T.textDim}>{h.name}</text>
              </g>
            ))}

            {/* moving markers for in-transit shipments */}
            {shipments.filter((s) => s.status === "in_transit" || s.status === "delayed").map((s) => {
              const a = HUBS[s.origin], b = HUBS[s.destination];
              const c = routeControlPoint(a, b);
              const t = (progressOverride[s.id] ?? s.routeProgressPct) / 100;
              const pos = bezierPoint(a, c, b, t);
              const isSel = s.id === selected?.id;
              return (
                <g key={s.id}>
                  <circle cx={pos.x} cy={pos.y} r={isSel ? 1.1 : 0.7} fill={isSel ? T.gold : T.blue} opacity="0.35">
                    <animate attributeName="r" values={isSel ? "1.1;1.8;1.1" : "0.7;1.1;0.7"} dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={pos.x} cy={pos.y} r={isSel ? 0.6 : 0.4} fill={isSel ? T.gold : T.blue} />
                </g>
              );
            })}
          </svg>

          {selected && (
            <div className="absolute left-4 bottom-4 right-4 rounded-lg p-3 flex items-center gap-4" style={{ background: "rgba(18,24,38,0.9)", border: `1px solid ${T.border}`, backdropFilter: "blur(6px)" }}>
              <span className="text-xs font-medium" style={{ color: T.text }}>{HUBS[selected.origin].name}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                <div className="h-full rounded-full" style={{ width: `${progressOverride[selected.id] ?? selected.routeProgressPct}%`, background: T.gold }} />
              </div>
              <span className="text-xs font-medium" style={{ color: T.text }}>{HUBS[selected.destination].name}</span>
              <span className="text-xs font-semibold w-10 text-right" style={{ color: T.gold }}>
                {Math.round(progressOverride[selected.id] ?? selected.routeProgressPct)}%
              </span>
            </div>
          )}
        </div>

        {/* Right: detail panel */}
        <div className="w-80 border-l overflow-y-auto shrink-0" style={{ borderColor: T.border, background: T.surface }}>
          {!selected ? (
            <p className="text-xs p-4" style={{ color: T.textDim }}>Select a shipment to see details.</p>
          ) : (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: T.text }}>{selected.bookingNumber}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded uppercase" style={{ background: T.surfaceRaised, color: STATUS_COLOR[selected.status] }}>
                    {selected.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: T.textDim }}>{selected.carrier} · {selected.vesselName}</p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide mb-1.5" style={{ color: T.textDim }}>AI Intelligence</p>
                <AIPanel ai={selected.ai} />
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide mb-1.5" style={{ color: T.textDim }}>Journey Timeline</p>
                <div className="rounded-lg p-2.5" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                  {selected.milestones.map((m, i) => <Milestone key={i} {...m} />)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p style={{ color: T.textDim }}>Cargo</p>
                  <p style={{ color: T.text }}>{selected.cargoType}</p>
                </div>
                <div>
                  <p style={{ color: T.textDim }}>Weight</p>
                  <p style={{ color: T.text }}>{selected.cargoWeightKg?.toLocaleString()} kg</p>
                </div>
                <div>
                  <p style={{ color: T.textDim }}>Mode</p>
                  <p style={{ color: T.text }} className="capitalize">{selected.transportMode}</p>
                </div>
                <div>
                  <p style={{ color: T.textDim }}>Dangerous Goods</p>
                  <p style={{ color: selected.isDangerousGoods ? T.red : T.text }}>{selected.isDangerousGoods ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
