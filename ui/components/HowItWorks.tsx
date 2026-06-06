"use client";

import { X, Shield, ChevronRight } from "lucide-react";

interface HowItWorksProps {
  open: boolean;
  onClose: () => void;
}

const FLOW = [
  {
    emoji: "📝",
    color: "#a0b4cc",
    title: "You type a prompt",
    desc: "Use real names, SSNs, account numbers — whatever you need. The gateway handles sanitization.",
  },
  {
    emoji: "🔍",
    color: "#ffb800",
    title: "Gateway scans for PII",
    desc: "Presidio NER + custom regex detects 9 entity types (names, SSNs, emails, account numbers, and more) in milliseconds.",
  },
  {
    emoji: "🔒",
    color: "#00d4ff",
    title: "PII → deterministic tokens",
    desc: "Jane Smith becomes {{PERSON_1}}, 123-45-6789 becomes {{SSN_1}}. Same input always produces the same token within your session.",
  },
  {
    emoji: "🤖",
    color: "#00e87a",
    title: "Tokenized prompt → LLM",
    desc: "Your AI model (OpenAI, Anthropic, or local Ollama) receives zero raw PII. It reasons over tokens, not real identifiers.",
  },
  {
    emoji: "🔓",
    color: "#00e87a",
    title: "Response detokenized by role",
    desc: "Tokens in the LLM's response are swapped back for real values — but only those your persona is authorized to see.",
  },
];

const ROLES = [
  { label: "Junior Analyst", color: "#8899bb", access: "Tokens only — no PII revealed" },
  { label: "Analyst",        color: "#66aaff", access: "Names (PERSON entities) revealed" },
  { label: "Senior Analyst", color: "#ffb800", access: "Names, emails, phones revealed" },
  { label: "VP Risk",        color: "#00d4ff", access: "Full de-tokenization" },
  { label: "Admin",          color: "#00e87a", access: "Full PII + Audit Console access" },
];

const TIPS = [
  "Switch persona in the bar above, then re-send any message to see different PII visibility.",
  "Click a chat bubble to inspect the exact entity map for that turn.",
  "Upload a CSV to inject a financial dataset as LLM context — all PII is tokenized first.",
  "The Audit Console (Admin persona) shows per-day event logs with correlation IDs.",
];

export default function HowItWorks({ open, onClose }: HowItWorksProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 500,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: "min(580px, 92vw)",
          maxHeight: "85vh",
          background: "rgba(8,12,28,0.98)",
          border: "1px solid rgba(0,212,255,0.15)",
          borderRadius: "20px",
          zIndex: 501,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Accent bar */}
        <div style={{ height: "3px", background: "linear-gradient(90deg,#00d4ff,#0055cc,transparent)", flexShrink: 0 }} />

        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px", height: "32px", borderRadius: "9px",
                background: "linear-gradient(135deg,#00d4ff,#0055cc)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 12px rgba(0,212,255,0.3)", flexShrink: 0,
              }}
            >
              <Shield size={15} color="#000" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                How PII Gateway Works
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                5-step request flow · role-based detokenization
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "6px", borderRadius: "8px", display: "flex", flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

          {/* Flow */}
          <div style={{ marginBottom: "22px" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
              Request Flow
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {FLOW.map((step, i) => (
                <div key={i}>
                  <div
                    style={{
                      display: "flex", gap: "12px", alignItems: "flex-start",
                      padding: "11px 14px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "34px", height: "34px", borderRadius: "9px",
                        background: `${step.color}12`,
                        border: `1px solid ${step.color}25`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "17px", flexShrink: 0,
                      }}
                    >
                      {step.emoji}
                    </div>
                    <div style={{ paddingTop: "1px" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.84rem", color: step.color, marginBottom: "3px" }}>
                        {step.title}
                      </div>
                      <div style={{ fontSize: "0.77rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                        {step.desc}
                      </div>
                    </div>
                  </div>
                  {i < FLOW.length - 1 && (
                    <div style={{ display: "flex", justifyContent: "center", padding: "3px 0" }}>
                      <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.1)", transform: "rotate(90deg)" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Roles */}
          <div style={{ marginBottom: "22px" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
              Persona Roles
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {ROLES.map((r) => (
                <div
                  key={r.label}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "8px 14px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    borderRadius: "8px",
                  }}
                >
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: r.color, minWidth: "118px", flexShrink: 0 }}>
                    {r.label}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.access}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div
            style={{
              background: "rgba(0,212,255,0.05)",
              border: "1px solid rgba(0,212,255,0.12)",
              borderRadius: "12px",
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#00d4ff", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
              Quick Tips
            </div>
            {TIPS.map((tip, i) => (
              <div
                key={i}
                style={{
                  display: "flex", gap: "9px",
                  padding: "5px 0",
                  borderBottom: i < TIPS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <span style={{ color: "#00d4ff", fontSize: "0.72rem", flexShrink: 0, marginTop: "2px" }}>›</span>
                <span style={{ fontSize: "0.77rem", color: "var(--text-muted)", lineHeight: 1.55 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <button className="btn-primary" onClick={onClose} style={{ padding: "8px 22px", fontSize: "0.82rem" }}>
            Got it
          </button>
        </div>
      </div>
    </>
  );
}
