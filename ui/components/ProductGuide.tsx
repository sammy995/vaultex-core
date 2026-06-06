"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  Eye,
  BarChart3,
  Lock,
  MessageSquare,
  Upload,
} from "lucide-react";

const GUIDE_KEY = "pii_gw_guide_seen";

interface TourStep {
  id: string;
  target: string | null;
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
  detail: React.ReactNode;
  placement?: "right" | "left" | "top" | "bottom" | "center";
}

const STEPS: TourStep[] = [
  {
    id: "welcome",
    target: null,
    placement: "center",
    icon: <Shield size={28} />,
    color: "#00d4ff",
    title: "Welcome to PII Gateway",
    description: "A privacy-first AI chat platform that tokenizes sensitive data before it ever reaches your LLM.",
    detail: (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {[
          { label: "Automatic PII Detection", desc: "Presidio NER engine scans every prompt for names, SSNs, emails, account numbers and 30+ other entity types." },
          { label: "Role-Based Reveal", desc: "Your JWT role controls which real values are shown back — junior analysts see tokens, VPs see full PII." },
          { label: "Full Audit Trail", desc: "Every event is logged: detection, masking, LLM call, de-tokenization. Admins get a searchable console." },
        ].map(({ label, desc }) => (
          <div key={label} style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: "10px", padding: "12px 16px" }}>
            <div style={{ fontWeight: 700, color: "#00d4ff", fontSize: "0.83rem", marginBottom: "4px" }}>{label}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "persona-bar",
    target: "persona-bar",
    placement: "bottom",
    icon: <Eye size={28} />,
    color: "#ffb800",
    title: "Persona Bar — Role Switcher",
    description: "Switch between analyst roles in real time. Each click re-issues a signed JWT without reloading.",
    detail: (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {[
          { role: "Junior Analyst", color: "#8899aa", access: "Sees tokens only — no PII revealed" },
          { role: "Senior Analyst", color: "#ffb800", access: "PERSON and CURRENCY entities de-tokenized" },
          { role: "VP Risk", color: "#00d4ff", access: "All PII entities revealed in responses" },
          { role: "Admin", color: "#00ff88", access: "Full PII + access to the Audit Console" },
        ].map(({ role, color, access }) => (
          <div key={role} style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "9px 13px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color, minWidth: "120px" }}>{role}</span>
            <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>{access}</span>
          </div>
        ))}
        <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px", lineHeight: 1.5 }}>
          Try switching roles after sending a message — watch the same response re-render with different PII visibility.
        </p>
      </div>
    ),
  },
  {
    id: "csv-strip",
    target: "csv-strip",
    placement: "bottom",
    icon: <Upload size={28} />,
    color: "#00ff88",
    title: "CSV Upload — Dataset Context",
    description: "Upload a .csv with PII columns. The entire dataset is injected as system context so you can ask analytical questions over real data.",
    detail: (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.18)", borderRadius: "10px", padding: "13px 16px" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "8px" }}>WHAT YOU CAN ASK</div>
          {[
            "Which customers have a credit score below 600?",
            "Average balance by risk flag — HIGH vs LOW",
            "List self-employed borrowers 30+ days past due",
          ].map(q => (
            <div key={q} style={{ fontSize: "0.8rem", color: "var(--text-secondary)", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", lineHeight: 1.5 }}>
              › {q}
            </div>
          ))}
        </div>
        <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
          Use the <span style={{ color: "#00ff88", fontWeight: 600 }}>? Sample CSV</span> button to download a realistic 19-column financial dataset.
        </p>
      </div>
    ),
  },
  {
    id: "chat-column",
    target: "chat-column",
    placement: "right",
    icon: <MessageSquare size={28} />,
    color: "#00d4ff",
    title: "Chat Interface — Send Prompts",
    description: "Type naturally. The gateway intercepts every message, detects PII, tokenizes it, sends the clean version to your LLM, then de-tokenizes the response for your role.",
    detail: (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ background: "rgba(255,68,68,0.07)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: "10px", padding: "12px 16px" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "6px" }}>YOU TYPE</div>
          <div style={{ fontSize: "0.81rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Review loan for <span style={{ color: "#ff8888" }}>John Smith</span>, SSN <span style={{ color: "#ff8888" }}>123-45-6789</span>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: "0.72rem", color: "#00ff88", fontFamily: "var(--font-mono)" }}>? Gateway tokenizes before LLM sees it</div>
        <div style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: "10px", padding: "12px 16px" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "6px" }}>LLM RECEIVES</div>
          <div style={{ fontSize: "0.81rem", color: "var(--text-secondary)", lineHeight: 1.6, fontFamily: "var(--font-mono)" }}>
            Review loan for <span style={{ color: "#00ff88" }}>?PERSON_1?</span>, SSN <span style={{ color: "#00ff88" }}>?SSN_1?</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "token-panel",
    target: "token-panel",
    placement: "left",
    icon: <Lock size={28} />,
    color: "#ffb800",
    title: "Tokenization Panel — Entity Map",
    description: "After each message, this panel shows every PII entity detected, the token it was replaced with, and what your role is allowed to see.",
    detail: (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "10px" }}>ENTITY MAP PREVIEW</div>
          {[
            { type: "PERSON", token: "?PERSON_1?", color: "#00d4ff", vis: "VP Risk+" },
            { type: "SSN", token: "?SSN_1?", color: "#ff4444", vis: "Admin only" },
            { type: "CURRENCY", token: "?CURRENCY_1?", color: "#00ff88", vis: "Senior+" },
          ].map(({ type, token, color, vis }) => (
            <div key={type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color }}>{type}</span>
              <span style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{token}</span>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{vis}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
          Click any chat bubble to inspect the entity map for that specific message.
        </p>
      </div>
    ),
  },
  {
    id: "activity-log",
    target: "activity-log",
    placement: "top",
    icon: <Zap size={28} />,
    color: "#00ff88",
    title: "Activity Log — Live Event Feed",
    description: "Every gateway event streams in real time: PII detected, tokens issued, LLM calls, de-tokenization, role switches.",
    detail: (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "13px 16px" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "10px" }}>SAMPLE EVENTS</div>
          {[
            { label: "PII_DETECTED", color: "#ff4444", msg: "Detected PERSON ? ?PERSON_1?" },
            { label: "MASKED", color: "#ffb800", msg: "2 entities tokenized before LLM call" },
            { label: "RECEIVED", color: "#00d4ff", msg: "LLM responded (342 chars)" },
            { label: "DETOKENIZED", color: "#00ff88", msg: "De-tokenized for role: vp_risk" },
          ].map(({ label, color, msg }) => (
            <div key={label} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color, fontFamily: "var(--font-mono)", minWidth: "90px" }}>{label}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{msg}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "done",
    target: null,
    placement: "center",
    icon: <BarChart3 size={28} />,
    color: "#00ff88",
    title: "Admin Console & You'\''re Ready",
    description: "Admin accounts get a full audit console with per-day event logs, type breakdowns, and correlation IDs.",
    detail: (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: "10px", padding: "14px 16px" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
            The <span style={{ color: "#00ff88", fontWeight: 700 }}>Admin Console</span> (navbar button) shows:
          </div>
          <ul style={{ marginTop: "10px", paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {[
              "Per-day event logs with date navigation",
              "Event type bar: AUTH ? CHAT ? PII ? SYSTEM",
              "Correlation ID and session ID per event",
              "Color-coded severity: safe ? warn ? danger",
            ].map(item => (
              <li key={item} style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{item}</li>
            ))}
          </ul>
        </div>
        <div style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: "10px", padding: "12px 16px", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          ?? <strong style={{ color: "#00d4ff" }}>Pro tip:</strong> Use <strong>Settings</strong> (navbar) to switch accent colors — the theme applies instantly across the whole app.
        </div>
      </div>
    ),
  },
];

function getTargetRect(tourId: string): DOMRect | null {
  if (typeof window === "undefined") return null;
  const el = document.querySelector(`[data-tour="${tourId}"]`);
  return el ? el.getBoundingClientRect() : null;
}

export default function ProductGuide() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [btnHovered, setBtnHovered] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const current = STEPS[step];

  const updatePosition = useCallback(() => {
    if (!open) return;
    if (!current.target) {
      setTargetRect(null);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setCardPos({ top: (vh - 520) / 2, left: (vw - 440) / 2 });
      return;
    }
    const rect = getTargetRect(current.target);
    setTargetRect(rect);
    if (!rect) { setCardPos(null); return; }

    const CARD_W = 440;
    const CARD_H = 480;
    const PAD = 18;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top: number, left: number;
    switch (current.placement) {
      case "right":
        left = Math.min(rect.right + PAD, vw - CARD_W - PAD);
        top = Math.max(PAD, Math.min(rect.top, vh - CARD_H - PAD));
        break;
      case "left":
        left = Math.max(PAD, rect.left - CARD_W - PAD);
        top = Math.max(PAD, Math.min(rect.top, vh - CARD_H - PAD));
        break;
      case "bottom":
        left = Math.max(PAD, Math.min(rect.left, vw - CARD_W - PAD));
        top = Math.min(rect.bottom + PAD, vh - CARD_H - PAD);
        break;
      case "top":
        left = Math.max(PAD, Math.min(rect.left, vw - CARD_W - PAD));
        top = Math.max(PAD, rect.top - CARD_H - PAD);
        break;
      default:
        left = (vw - CARD_W) / 2;
        top = (vh - CARD_H) / 2;
    }
    setCardPos({ top, left });
  }, [open, current]);

  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      return () => window.removeEventListener("resize", updatePosition);
    }
  }, [open, updatePosition]);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(GUIDE_KEY)) {
      const timer = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  function close() {
    localStorage.setItem(GUIDE_KEY, "1");
    setOpen(false);
    setStep(0);
  }

  const isSpotlight = open && current.target !== null && targetRect !== null;
  const PAD = 8;

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => { setOpen(true); setStep(0); }}
        onMouseEnter={() => setBtnHovered(true)}
        onMouseLeave={() => setBtnHovered(false)}
        title="Product Guide"
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          zIndex: 400,
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: btnHovered ? "linear-gradient(135deg,#00d4ff,#0066ff)" : "rgba(0,212,255,0.12)",
          border: "1px solid rgba(0,212,255,0.35)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: btnHovered ? "#000" : "#00d4ff",
          boxShadow: btnHovered ? "0 8px 32px rgba(0,212,255,0.35)" : "0 4px 16px rgba(0,0,0,0.4)",
          transition: "all 200ms ease",
        }}
      >
        <HelpCircle size={22} />
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 350, pointerEvents: "none" }}>
          {/* Scrim with spotlight cutout for targeted steps */}
          {isSpotlight && targetRect ? (
            <svg
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "all" }}
              onClick={close}
            >
              <defs>
                <mask id="spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={targetRect.left - PAD}
                    y={targetRect.top - PAD}
                    width={targetRect.width + PAD * 2}
                    height={targetRect.height + PAD * 2}
                    rx="10"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#spotlight-mask)" />
              <rect
                x={targetRect.left - PAD}
                y={targetRect.top - PAD}
                width={targetRect.width + PAD * 2}
                height={targetRect.height + PAD * 2}
                rx="10"
                fill="none"
                stroke={current.color}
                strokeWidth="2"
                strokeOpacity="0.85"
                style={{ filter: `drop-shadow(0 0 10px ${current.color}99)` }}
              />
            </svg>
          ) : (
            /* Full blur scrim for centered steps */
            <div
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)", pointerEvents: "all" }}
              onClick={close}
            />
          )}

          {/* Callout card */}
          {cardPos && (
            <div
              ref={cardRef}
              onClick={e => e.stopPropagation()}
              style={{
                position: "absolute",
                top: cardPos.top,
                left: cardPos.left,
                width: "440px",
                background: "rgba(6,10,22,0.97)",
                border: `1px solid ${current.color}33`,
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: `0 24px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.05)`,
                pointerEvents: "all",
                animation: "fade-in-up 180ms ease forwards",
              }}
            >
              {/* Accent bar */}
              <div style={{ height: "3px", background: `linear-gradient(90deg, ${current.color}, ${current.color}55, transparent)` }} />

              {/* Header */}
              <div style={{ padding: "14px 18px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "10px",
                    background: `${current.color}14`, border: `1px solid ${current.color}33`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: current.color, flexShrink: 0,
                  }}>
                    <span style={{ display: "flex", transform: "scale(0.75)", transformOrigin: "center" }}>
                      {current.icon}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                      {current.title}
                    </div>
                    <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                      STEP {step + 1} / {STEPS.length}
                    </div>
                  </div>
                </div>
                <button
                  onClick={close}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: "4px", borderRadius: "6px", flexShrink: 0 }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: "12px 18px" }}>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 14px" }}>
                  {current.description}
                </p>
                <div style={{ maxHeight: "230px", overflowY: "auto", paddingRight: "2px" }}>
                  {current.detail}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: "2px", background: "rgba(255,255,255,0.05)", margin: "0 18px" }}>
                <div style={{ height: "100%", width: `${((step + 1) / STEPS.length) * 100}%`, background: `linear-gradient(90deg, ${current.color}, ${current.color}88)`, transition: "width 300ms ease" }} />
              </div>

              {/* Footer */}
              <div style={{ padding: "12px 18px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "5px" }}>
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      style={{
                        width: i === step ? "18px" : "5px",
                        height: "5px", borderRadius: "100px",
                        background: i === step ? current.color : "rgba(255,255,255,0.15)",
                        border: "none", cursor: "pointer", padding: 0,
                        transition: "all 200ms ease",
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {step > 0 && (
                    <button
                      className="btn-ghost"
                      onClick={() => setStep(s => s - 1)}
                      style={{ padding: "6px 14px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "5px" }}
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                  )}
                  {step < STEPS.length - 1 ? (
                    <button
                      className="btn-primary"
                      onClick={() => setStep(s => s + 1)}
                      style={{ padding: "6px 16px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "5px" }}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button className="btn-primary" onClick={close} style={{ padding: "6px 16px", fontSize: "0.8rem" }}>
                      Get Started
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
