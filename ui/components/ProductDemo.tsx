"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, Shield, ArrowRight, Lock, Cpu } from "lucide-react";

/* ── Data ─────────────────────────────────────────────────── */

type Span = { text: string; pii?: boolean; token?: boolean; dim?: boolean };

const STEPS: {
  id: number;
  label: string;
  sublabel: string;
  accentColor: string;
  icon: React.ReactNode;
  leftTitle: string;
  leftLines: Span[][];
  rightTitle: string;
  rightLines: Span[][];
  badge?: string;
}[] = [
  {
    id: 1,
    label: "Raw Prompt",
    sublabel: "App sends prompt with PII",
    accentColor: "#ff6b6b",
    icon: <ArrowRight size={14} />,
    leftTitle: "your-app  →  vaultex-gateway :8000",
    leftLines: [
      [{ text: "POST /v1/chat/completions  HTTP/1.1", dim: true }],
      [{ text: "Authorization: Bearer sk-ant-...", dim: true }],
      [{ text: "" }],
      [{ text: '{ "messages": [{ "role": "user", "content":', dim: true }],
      [
        { text: '  "Analyse risk for ' },
        { text: "Jane Smith", pii: true },
        { text: " (SSN: " },
        { text: "123-45-6789", pii: true },
        { text: "," },
      ],
      [
        { text: "   email: " },
        { text: "jane.smith@acme.com", pii: true },
        { text: ", phone: " },
        { text: "415-555-0192", pii: true },
        { text: ")." },
      ],
      [{ text: "   Account ACC-00198234, balance $42,500." }],
      [{ text: '   Credit score 742, Risk Flag: LOW." }]', dim: true }],
    ],
    rightTitle: "presidio NER  —  entities detected",
    rightLines: [
      [{ text: "Scanning with en_core_web_lg…", dim: true }],
      [{ text: "" }],
      [{ text: "● PERSON   ", token: true }, { text: '"Jane Smith"' }],
      [{ text: "● US_SSN   ", token: true }, { text: '"123-45-6789"' }],
      [{ text: "● EMAIL    ", token: true }, { text: '"jane.smith@acme.com"' }],
      [{ text: "● PHONE    ", token: true }, { text: '"415-555-0192"' }],
      [{ text: "" }],
      [{ text: "4 entities found  ·  0 false-positives", dim: true }],
    ],
    badge: "⚠ PII Detected",
  },
  {
    id: 2,
    label: "Tokenized",
    sublabel: "PII replaced, analytics preserved",
    accentColor: "#00ff88",
    icon: <Shield size={14} />,
    leftTitle: "vaultex-gateway  →  anthropic API",
    leftLines: [
      [{ text: "POST /v1/messages  HTTP/1.1", dim: true }],
      [{ text: "" }],
      [{ text: '  "Analyse risk for ' }],
      [
        { text: "  " },
        { text: "{{PERSON_1}}", token: true },
        { text: " (SSN: " },
        { text: "{{SSN_1}}", token: true },
        { text: "," },
      ],
      [
        { text: "   email: " },
        { text: "{{EMAIL_1}}", token: true },
        { text: ", phone: " },
        { text: "{{PHONE_1}}", token: true },
        { text: ")." },
      ],
      [{ text: "   Account ACC-00198234, balance $42,500." }],
      [{ text: "   Credit score 742, Risk Flag: LOW." }],
    ],
    rightTitle: "token vault  —  encrypted map",
    rightLines: [
      [{ text: "AES-256-GCM  ·  per-request key", dim: true }],
      [{ text: "" }],
      [{ text: "{{PERSON_1}}", token: true }, { text: "  ←→  Jane Smith" }],
      [{ text: "{{SSN_1}}   ", token: true }, { text: "  ←→  123-45-6789" }],
      [{ text: "{{EMAIL_1}} ", token: true }, { text: "  ←→  jane.smith@acme.com" }],
      [{ text: "{{PHONE_1}} ", token: true }, { text: "  ←→  415-555-0192" }],
      [{ text: "" }],
      [{ text: "Vault TTL: 60 min  ·  RBAC-locked", dim: true }],
    ],
    badge: "✓ PII Shielded",
  },
  {
    id: 3,
    label: "LLM Response",
    sublabel: "Model replies with tokens intact",
    accentColor: "#00d4ff",
    icon: <Cpu size={14} />,
    leftTitle: "anthropic  →  vaultex-gateway",
    leftLines: [
      [{ text: "HTTP/1.1 200 OK", dim: true }],
      [{ text: "" }],
      [{ text: "  " }, { text: "{{PERSON_1}}", token: true }, { text: " presents LOW credit risk." }],
      [{ text: "  Credit score 742 is above prime threshold." }],
      [{ text: "  Balance $42,500 is within normal range." }],
      [{ text: "  No derogatory marks on ACC-00198234." }],
      [{ text: "" }],
      [{ text: "  Recommend: approval with standard terms.", dim: true }],
    ],
    rightTitle: "audit log  —  immutable",
    rightLines: [
      [{ text: "req_7f3a9c  ·  2024-01-15 14:22:07Z", dim: true }],
      [{ text: "" }],
      [{ text: "user     " }, { text: "analyst@acmebank.com" }],
      [{ text: "role     " }, { text: "ANALYST  (read-only)" }],
      [{ text: "entities " }, { text: "4 masked" }],
      [{ text: "model    " }, { text: "claude-3-5-sonnet" }],
      [{ text: "latency  " }, { text: "+12ms overhead" }],
      [{ text: "status   " }, { text: "✓ compliant", token: true }],
    ],
    badge: "✓ In Transit",
  },
  {
    id: 4,
    label: "Detokenized",
    sublabel: "Real names restored for authorised users",
    accentColor: "#ffb800",
    icon: <Lock size={14} />,
    leftTitle: "vaultex-gateway  →  your-app",
    leftLines: [
      [{ text: "  // RBAC check: VP_RISK role → full access", dim: true }],
      [{ text: "" }],
      [
        { text: "  " },
        { text: "Jane Smith", token: true },
        { text: " presents LOW credit risk." },
      ],
      [{ text: "  Credit score 742 is above prime threshold." }],
      [{ text: "  Balance $42,500 is within normal range." }],
      [{ text: "  No derogatory marks on ACC-00198234." }],
      [{ text: "" }],
      [{ text: "  Recommend: approval with standard terms." }],
    ],
    rightTitle: "rbac outcome  —  role-filtered",
    rightLines: [
      [{ text: "Role matrix evaluated:", dim: true }],
      [{ text: "" }],
      [{ text: "VP_RISK      " }, { text: "→ sees real names", token: true }],
      [{ text: "ANALYST      " }, { text: "→ sees {{PERSON_1}}" }],
      [{ text: "EXTERN_AUDIT " }, { text: "→ redacted" }],
      [{ text: "" }],
      [{ text: "Current session: " }, { text: "VP_RISK", token: true }],
      [{ text: "Detokenized: 4/4 entities  ·  0.4ms", dim: true }],
    ],
    badge: "✓ Delivered",
  },
];

const STEP_DURATION = 3800; // ms per step

/* ── Helpers ───────────────────────────────────────────────── */

function CodeLine({ spans, accent }: { spans: Span[]; accent: string }) {
  return (
    <div style={{ lineHeight: "1.7", minHeight: "1.5em" }}>
      {spans.map((s, i) => {
        const color = s.pii
          ? "#ff6b6b"
          : s.token
          ? accent
          : s.dim
          ? "rgba(148,163,184,0.45)"
          : "rgba(226,232,240,0.85)";
        const bg = s.pii
          ? "rgba(255,107,107,0.12)"
          : s.token
          ? `${accent}18`
          : "transparent";
        const border = s.pii
          ? "1px solid rgba(255,107,107,0.3)"
          : s.token
          ? `1px solid ${accent}40`
          : "none";
        return (
          <span
            key={i}
            style={{
              color,
              background: bg,
              border,
              borderRadius: "3px",
              padding: s.pii || s.token ? "1px 4px" : undefined,
              fontWeight: s.pii || s.token ? 600 : 400,
            }}
          >
            {s.text}
          </span>
        );
      })}
    </div>
  );
}

function TerminalPane({
  title,
  lines,
  accent,
  side,
}: {
  title: string;
  lines: Span[][];
  accent: string;
  side: "left" | "right";
}) {
  return (
    <div
      style={{
        flex: 1,
        borderRight: side === "left" ? "1px solid rgba(255,255,255,0.06)" : "none",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <div
        style={{
          padding: "9px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          fontSize: "0.65rem",
          color: "rgba(148,163,184,0.6)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </div>
      <div
        style={{
          flex: 1,
          padding: "16px 18px",
          fontFamily: "var(--font-mono)",
          fontSize: "0.76rem",
          overflowY: "auto",
        }}
      >
        {lines.map((spans, i) => (
          <CodeLine key={i} spans={spans} accent={accent} />
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────── */

export default function ProductDemo() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const TOTAL = STEPS.length;

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  const startTimers = useCallback(
    (stepIndex: number) => {
      clearTimers();
      setProgress(0);
      const tick = 50;
      progressRef.current = setInterval(() => {
        setProgress((p) => Math.min(p + (tick / STEP_DURATION) * 100, 100));
      }, tick);
      intervalRef.current = setInterval(() => {
        setCurrent((c) => (c + 1) % TOTAL);
      }, STEP_DURATION);
    },
    [clearTimers, TOTAL]
  );

  useEffect(() => {
    if (playing) startTimers(current);
    else clearTimers();
    return clearTimers;
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset progress bar when step changes
  useEffect(() => {
    setProgress(0);
  }, [current]);

  function goTo(i: number) {
    clearTimers();
    setProgress(0);
    setCurrent(i);
    if (playing) startTimers(i);
  }

  function togglePlay() {
    setPlaying((p) => !p);
  }

  function restart() {
    setProgress(0);
    setCurrent(0);
    setPlaying(true);
  }

  const step = STEPS[current];

  return (
    <section
      style={{
        padding: "100px 24px",
        background:
          "linear-gradient(180deg, rgba(0,212,255,0.03) 0%, transparent 100%)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)",
              borderRadius: "100px",
              padding: "5px 14px",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#00d4ff",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "20px",
            }}
          >
            <Cpu size={11} /> Product Walkthrough
          </div>
          <h2
            style={{
              fontSize: "clamp(1.8rem,4vw,2.6rem)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "var(--text-primary)",
              marginBottom: "14px",
              lineHeight: 1.15,
            }}
          >
            Every prompt. Zero PII leakage.
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.94rem",
              lineHeight: 1.65,
              maxWidth: "520px",
              margin: "0 auto",
            }}
          >
            Watch a live banking risk query flow through the Vaultex gateway —
            tokenized on the way out, detokenized on the way back, fully
            audit-logged throughout.
          </p>
        </div>

        {/* Step tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 18px",
                borderRadius: "100px",
                border: `1px solid ${i === current ? s.accentColor + "60" : "rgba(255,255,255,0.1)"}`,
                background:
                  i === current ? `${s.accentColor}12` : "rgba(255,255,255,0.03)",
                color: i === current ? s.accentColor : "var(--text-muted)",
                fontSize: "0.78rem",
                fontWeight: i === current ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <span
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background:
                    i === current ? s.accentColor : "rgba(255,255,255,0.1)",
                  color: i === current ? "#000" : "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.65rem",
                  fontWeight: 800,
                }}
              >
                {i + 1}
              </span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Main terminal window */}
        <div
          style={{
            background: "rgba(6,10,20,0.95)",
            border: `1px solid ${step.accentColor}30`,
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: `0 0 60px ${step.accentColor}10, 0 24px 48px rgba(0,0,0,0.5)`,
            transition: "border-color 0.4s, box-shadow 0.4s",
          }}
        >
          {/* Title bar */}
          <div
            style={{
              padding: "12px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {["#ff4444", "#ffb800", "#00ff88"].map((c) => (
              <span
                key={c}
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: c,
                }}
              />
            ))}
            <span
              style={{
                marginLeft: "6px",
                fontSize: "0.7rem",
                color: "rgba(148,163,184,0.5)",
                fontFamily: "var(--font-mono)",
              }}
            >
              vaultex — privacy gateway
            </span>

            {/* Step badge */}
            <span
              style={{
                marginLeft: "auto",
                fontSize: "0.68rem",
                fontWeight: 700,
                color: step.accentColor,
                background: `${step.accentColor}15`,
                border: `1px solid ${step.accentColor}30`,
                borderRadius: "100px",
                padding: "3px 10px",
                fontFamily: "var(--font-mono)",
              }}
            >
              {step.badge}
            </span>
          </div>

          {/* Sub-header showing current step context */}
          <div
            style={{
              padding: "10px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: step.accentColor,
              }}
            >
              {step.icon} Step {step.id} / {TOTAL} — {step.label}
            </span>
            <span
              style={{
                fontSize: "0.72rem",
                color: "rgba(148,163,184,0.5)",
              }}
            >
              {step.sublabel}
            </span>
          </div>

          {/* Content panes */}
          <div
            style={{
              display: "flex",
              minHeight: "260px",
              transition: "opacity 0.3s",
            }}
          >
            <TerminalPane
              title={step.leftTitle}
              lines={step.leftLines}
              accent={step.accentColor}
              side="left"
            />
            <TerminalPane
              title={step.rightTitle}
              lines={step.rightLines}
              accent={step.accentColor}
              side="right"
            />
          </div>

          {/* Progress bar + controls */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              padding: "10px 20px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "rgba(0,0,0,0.2)",
            }}
          >
            <button
              onClick={togglePlay}
              style={{
                background: "none",
                border: `1px solid rgba(255,255,255,0.15)`,
                color: "var(--text-secondary)",
                borderRadius: "6px",
                padding: "5px 8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button
              onClick={restart}
              style={{
                background: "none",
                border: `1px solid rgba(255,255,255,0.15)`,
                color: "var(--text-secondary)",
                borderRadius: "6px",
                padding: "5px 8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Restart"
            >
              <RotateCcw size={12} />
            </button>

            {/* Progress track */}
            <div
              style={{
                flex: 1,
                height: "4px",
                background: "rgba(255,255,255,0.07)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${((current + (playing ? progress / 100 : 0)) / TOTAL) * 100}%`,
                  background: `linear-gradient(90deg, ${step.accentColor}, ${step.accentColor}aa)`,
                  borderRadius: "2px",
                  transition: "width 0.05s linear",
                }}
              />
            </div>

            <span
              style={{
                fontSize: "0.68rem",
                color: "rgba(148,163,184,0.4)",
                fontFamily: "var(--font-mono)",
                whiteSpace: "nowrap",
              }}
            >
              {current + 1} / {TOTAL}
            </span>
          </div>
        </div>

        {/* Caption */}
        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "0.78rem",
            color: "rgba(148,163,184,0.45)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Simulated walkthrough · Real gateway uses Microsoft Presidio NER with 14+
          entity types · avg +12ms overhead
        </p>
      </div>
    </section>
  );
}
