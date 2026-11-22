"use client";
import React, { useEffect, useRef, useState } from "react";
import { Ship, Radar, Route, ShieldCheck, ArrowRight, Anchor, Plane, Truck, Train, Check } from "lucide-react";

// ---------------------------------------------------------------------------
// Design tokens — as specified by the landing-page skill. This is the
// MARKETING track: expressive, editorial, restrained-luxury. Deliberately
// different from the product dashboard's dense command-center look.
// ---------------------------------------------------------------------------
const C = {
  bg: "#0A0D12",
  surface: "#131922",
  text: "#F5F4EF",
  textDim: "#9FA6B2",
  copper: "#B87A3D",
  highlight: "#D8A46B",
  success: "#5D8F87",
  border: "#232A36",
  slate: "#4C6FFF",
};

const display = "'Iowan Old Style','Palatino Linotype', Georgia, 'Times New Roman', serif";
const body = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

// Scroll-reveal: fade + rise on enter, once, respecting reduced motion.
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setVisible(true); return; }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold: 0.18 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, className = "", delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children }) {
  return (
    <div className="text-xs tracking-[0.2em] uppercase mb-4" style={{ color: C.copper, fontFamily: body }}>
      {children}
    </div>
  );
}

function Section({ id, children, className = "" }) {
  return (
    <section id={id} className={`px-6 md:px-16 py-24 md:py-32 ${className}`}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  );
}

// A restrained abstract rendering of the Live Map — the product's own
// signature visual, reused here as the hero's proof rather than a stock photo.
function MapGlyph() {
  return (
    <svg viewBox="0 0 400 220" className="w-full h-auto">
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.copper} stopOpacity="0.35" />
          <stop offset="100%" stopColor={C.copper} stopOpacity="0" />
        </radialGradient>
      </defs>
      {Array.from({ length: 6 }).map((_, i) => (
        <line key={`h${i}`} x1="0" x2="400" y1={i * 36 + 10} y2={i * 36 + 10} stroke={C.border} strokeWidth="0.6" />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 40} x2={i * 40} y1="0" y2="220" stroke={C.border} strokeWidth="0.6" />
      ))}
      <path d="M 60 120 Q 200 40 340 100" fill="none" stroke={C.copper} strokeWidth="1.4" opacity="0.85" />
      <circle cx="60" cy="120" r="3" fill={C.textDim} />
      <circle cx="340" cy="100" r="3" fill={C.textDim} />
      <circle cx="235" cy="70" r="10" fill="url(#glow)" />
      <circle cx="235" cy="70" r="3.2" fill={C.highlight} />
    </svg>
  );
}

function ModeIcon({ Icon, label }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.border}` }}>
        <Icon size={17} color={C.copper} />
      </div>
      <span className="text-xs" style={{ color: C.textDim }}>{label}</span>
    </div>
  );
}

function PlanCard({ name, tagline, price, features, accent, featured }) {
  return (
    <div
      className="rounded-xl p-8 flex flex-col"
      style={{
        background: featured ? "#171009" : C.surface,
        border: `1px solid ${featured ? C.copper : C.border}`,
      }}
    >
      <span className="text-xs tracking-[0.15em] uppercase" style={{ color: accent }}>{tagline}</span>
      <h3 className="mt-2 text-2xl" style={{ fontFamily: display, color: C.text }}>{name}</h3>
      <p className="mt-1 text-sm" style={{ color: C.textDim }}>{price}</p>
      <ul className="mt-6 space-y-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm" style={{ color: C.text }}>
            <Check size={15} color={accent} className="mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <button
        className="mt-8 text-sm font-medium py-2.5 rounded-md transition-opacity hover:opacity-90"
        style={{ background: featured ? C.copper : "transparent", border: `1px solid ${featured ? C.copper : C.border}`, color: featured ? "#0A0D12" : C.text }}
      >
        Talk to sales
      </button>
    </div>
  );
}

export default function TradeixLanding() {
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: body }} className="min-h-screen">
      {/* Nav */}
      <header className="px-6 md:px-16 py-6 flex items-center justify-between border-b" style={{ borderColor: C.border }}>
        <span className="text-lg tracking-wide" style={{ fontFamily: display }}>TRADEIX</span>
        <nav className="hidden md:flex items-center gap-8 text-sm" style={{ color: C.textDim }}>
          <a href="#solution" className="hover:text-white transition-colors">Platform</a>
          <a href="#intelligence" className="hover:text-white transition-colors">Intelligence</a>
          <a href="#trust" className="hover:text-white transition-colors">Trust &amp; Security</a>
          <a href="#plans" className="hover:text-white transition-colors">Plans</a>
        </nav>
        <a href="/dashboard" className="text-sm px-4 py-2 rounded-md" style={{ border: `1px solid ${C.border}`, color: C.text }}>
          Open dashboard
        </a>
      </header>

      {/* Hero */}
      <Section className="!pt-28 md:!pt-36">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <Reveal>
            <Eyebrow>Global Shipment Intelligence</Eyebrow>
            <h1 className="text-4xl md:text-6xl leading-[1.08]" style={{ fontFamily: display }}>
              See every shipment,<br />everywhere, as it happens.
            </h1>
            <p className="mt-6 text-lg leading-relaxed max-w-md" style={{ color: C.textDim }}>
              Tradeix replaces static tracking pages with a live global map — real-time
              vessel and cargo movement, AI-predicted delays, and one command center
              for every shipment you run.
            </p>
            <div className="mt-9 flex items-center gap-5">
              <a href="#plans" className="flex items-center gap-2 text-sm font-medium px-5 py-3 rounded-md" style={{ background: C.copper, color: "#0A0D12" }}>
                Request access <ArrowRight size={15} />
              </a>
              <a href="#solution" className="text-sm" style={{ color: C.textDim }}>See the Live Map ↓</a>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="rounded-xl p-6" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <MapGlyph />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Industry problem */}
      <Section className="border-t" style={{ borderColor: C.border }}>
        <Reveal>
          <Eyebrow>The Problem</Eyebrow>
          <h2 className="text-3xl md:text-4xl max-w-2xl leading-tight" style={{ fontFamily: display }}>
            A tracking page tells you where a shipment was. Not where it is.
          </h2>
          <p className="mt-6 max-w-xl leading-relaxed" style={{ color: C.textDim }}>
            Most tracking is a list of past events — a status that updates hours after
            the fact, if at all. Teams find out about a delay once it has already
            cost them a delivery window, not before.
          </p>
        </Reveal>
      </Section>

      {/* Platform solution */}
      <Section id="solution" className="border-t" style={{ borderColor: C.border }}>
        <Reveal>
          <Eyebrow>The Platform</Eyebrow>
          <h2 className="text-3xl md:text-4xl max-w-2xl leading-tight" style={{ fontFamily: display }}>
            One live map. Every mode, every shipment, every port.
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <div className="mt-14 flex flex-wrap gap-10 md:gap-16">
            <ModeIcon Icon={Anchor} label="Ocean" />
            <ModeIcon Icon={Plane} label="Air" />
            <ModeIcon Icon={Truck} label="Road" />
            <ModeIcon Icon={Train} label="Rail" />
          </div>
        </Reveal>
      </Section>

      {/* How it works — a real sequence, so numbering is earned here */}
      <Section className="border-t" style={{ borderColor: C.border }}>
        <Reveal><Eyebrow>How It Works</Eyebrow></Reveal>
        <div className="grid md:grid-cols-3 gap-10 mt-4">
          {[
            { n: "01", title: "Connect your shipments", body: "Booking numbers, carriers, and container IDs sync automatically — no manual entry." },
            { n: "02", title: "Watch them move", body: "Live position, ETA, and route progress update continuously across every mode." },
            { n: "03", title: "Get ahead of problems", body: "AI flags delays and congestion before they hit your schedule — with the reasoning shown, never a bare score." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="pt-6 border-t" style={{ borderColor: C.border }}>
                <span className="text-sm" style={{ color: C.copper, fontFamily: display }}>{s.n}</span>
                <h3 className="mt-3 text-xl" style={{ fontFamily: display }}>{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: C.textDim }}>{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* AI Intelligence layer */}
      <Section id="intelligence" className="border-t" style={{ borderColor: C.border }}>
        <Reveal>
          <Eyebrow>Intelligence</Eyebrow>
          <h2 className="text-3xl md:text-4xl max-w-2xl leading-tight" style={{ fontFamily: display }}>
            Predictions you can act on, not a black box.
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6 mt-14">
          {[
            { Icon: Radar, title: "Delay Prediction", body: "\u201cHeavy weather near the Arabian Sea may delay arrival by approximately 8 hours.\u201d" },
            { Icon: Ship, title: "Port Congestion", body: "\u201cMumbai Port is operating at 83% capacity — expected unloading delay 12 hours.\u201d" },
            { Icon: Route, title: "Route Optimization", body: "\u201cRecommended reroute via Colombo saves approximately 3 hours.\u201d" },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 120}>
              <div className="rounded-xl p-7 h-full" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <c.Icon size={20} color={C.copper} />
                <h3 className="mt-4 text-lg" style={{ fontFamily: display }}>{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed italic" style={{ color: C.textDim }}>{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Trust & Security */}
      <Section id="trust" className="border-t" style={{ borderColor: C.border }}>
        <Reveal>
          <Eyebrow>Trust &amp; Security</Eyebrow>
          <h2 className="text-3xl md:text-4xl max-w-2xl leading-tight" style={{ fontFamily: display }}>
            Built for teams that can&apos;t afford to guess.
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mt-14">
            {[
              "Role-based access control",
              "End-to-end encrypted communications",
              "Full audit logging",
              "99.9% platform availability target",
            ].map((t) => (
              <div key={t} className="flex items-start gap-3">
                <ShieldCheck size={17} color={C.success} className="mt-0.5 shrink-0" />
                <span className="text-sm" style={{ color: C.textDim }}>{t}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* Plans */}
      <Section id="plans" className="border-t" style={{ borderColor: C.border }}>
        <Reveal><Eyebrow>Plans</Eyebrow></Reveal>
        <div className="grid md:grid-cols-2 gap-6 mt-8 max-w-3xl">
          <Reveal>
            <PlanCard
              name="Trade Select"
              tagline="Standard"
              price="For teams getting started with live visibility"
              accent={C.slate}
              features={["Live Map access", "Ocean, air, road & rail tracking", "Standard AI delay alerts", "Email support"]}
            />
          </Reveal>
          <Reveal delay={120}>
            <PlanCard
              name="Reserve"
              tagline="Executive Access"
              price="For operations teams running at scale"
              accent={C.copper}
              featured
              features={["Everything in Trade Select", "Route optimization & risk detection", "Historical playback & analytics", "Dedicated operations support"]}
            />
          </Reveal>
        </div>
      </Section>

      {/* CTA */}
      <Section className="border-t text-center" style={{ borderColor: C.border }}>
        <Reveal>
          <h2 className="text-3xl md:text-5xl max-w-2xl mx-auto leading-tight" style={{ fontFamily: display }}>
            Ready to see your shipments differently?
          </h2>
          <a href="#plans" className="inline-flex items-center gap-2 mt-8 text-sm font-medium px-6 py-3.5 rounded-md" style={{ background: C.copper, color: "#0A0D12" }}>
            Request access <ArrowRight size={15} />
          </a>
        </Reveal>
      </Section>

      {/* Footer */}
      <footer className="px-6 md:px-16 py-10 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: C.border }}>
        <span className="text-sm" style={{ fontFamily: display, color: C.textDim }}>TRADEIX</span>
        <span className="text-xs" style={{ color: C.textDim }}>&copy; 2026 Tradeix. Global shipment intelligence.</span>
      </footer>
    </div>
  );
}
