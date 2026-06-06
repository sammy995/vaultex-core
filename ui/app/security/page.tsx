import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Server, FileText, Eye, BadgeCheck, Database, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Security Architecture — Vaultex AI Privacy Gateway",
  description: "How Vaultex protects sensitive financial data: Presidio NER, Fernet encryption, append-only audit trail, RBAC, and on-premise deployment.",
  alternates: { canonical: "https://vaultex.space/security" },
};

export default function SecurityPage() {
  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", color: "var(--text-primary)", padding: "80px 24px" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "40px", textDecoration: "none" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg,#00d4ff,#0066ff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={13} color="#000" />
          </div>
          <span style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem" }}>Vaultex</span>
        </Link>

        <div style={{ marginBottom: "64px" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#00d4ff", letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: "14px" }}>Security Architecture</p>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 900, letterSpacing: "-0.035em", marginBottom: "20px", lineHeight: 1.05 }}>
            Zero PII to the cloud.<br />Every layer explained.
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.75, maxWidth: "640px" }}>
            Vaultex is designed with one mandate: sensitive financial data never reaches an external AI model in raw form. This page documents every control in the request lifecycle.
          </p>
        </div>

        {[
          {
            icon: <Eye size={22} />, color: "#00d4ff", title: "Step 1 — Detection: Microsoft Presidio NER",
            body: [
              "Every outbound prompt is passed to a local Microsoft Presidio Analyzer running the en_core_web_lg spaCy model. Presidio identifies 14+ entity types using a combination of Named Entity Recognition (NER) and rule-based pattern matching.",
              "Detected entities include: PERSON, SSN (Social Security Number), EMAIL_ADDRESS, PHONE_NUMBER, ACCOUNT_NUMBER (ACC- prefix pattern), LOAN_ID (LOAN-YYYY-NNNNNN pattern), DATE_OF_BIRTH, CREDIT_CARD, IBAN_CODE, PASSPORT, DRIVER_LICENSE, IP_ADDRESS, URL, and MEDICAL_LICENSE.",
              "The Presidio engine runs entirely on your infrastructure. No prompt text is ever sent to a third-party NER API.",
            ]
          },
          {
            icon: <Lock size={22} />, color: "#00ff88", title: "Step 2 — Tokenization: Deterministic, Session-Scoped",
            body: [
              "Each detected PII span is replaced with a deterministic token: {{ENTITY_TYPE_N}}. Determinism is guaranteed within a session — the same person gets {{PERSON_1}} in every row of a CSV upload, enabling analytics that span multiple records.",
              "The token ↔ original value mapping is stored in a Redis hash, scoped to the session UUID and Fernet-encrypted at rest. The Redis instance runs in your infrastructure — never in a shared cloud.",
              "Financial values (balances, credit scores, interest rates, risk flags, DPD counts) are explicitly preserved. They are never added to the tokenization list regardless of their proximity to PII.",
            ]
          },
          {
            icon: <Server size={22} />, color: "#ffb800", title: "Step 3 — LLM Routing: Encrypted Keys, Configurable Model",
            body: [
              "The sanitized prompt (with all PII replaced by tokens) is forwarded to your chosen LLM provider: Anthropic Claude, OpenAI GPT, or a local Ollama model. Provider API keys are stored in Redis as Fernet-encrypted blobs — never in plaintext.",
              "The gateway supports per-request model selection via the X-Provider and X-Model headers. The system prompt prepended to every call instructs the LLM to treat tokens as stable identifiers and never request clarification about their meaning.",
            ]
          },
          {
            icon: <Eye size={22} />, color: "#00d4ff", title: "Step 4 — Detokenization: Role-Gated Decryption",
            body: [
              "The LLM response is passed back through the detokenization layer. Before any original value is substituted back in, the gateway checks the user's JWT role claim against the RBAC entity permission table.",
              "Junior Analyst — no detokenization (sees all tokens).",
              "Senior Analyst — PERSON and EMAIL are restored.",
              "VP Risk — all personal entities are restored.",
              "Admin — full PII restored + access to audit console.",
              "This means role-level data access is enforced at the network layer, not the application layer. It cannot be bypassed by modifying client code.",
            ]
          },
          {
            icon: <FileText size={22} />, color: "#ff4444", title: "Step 5 — Audit Trail: Append-Only, Correlation-Tracked",
            body: [
              "Every request is logged with: timestamp, user ID, JWT role, correlation ID, provider + model used, number of PII entities detected by type, and request/response latency. No raw PII is written to the log.",
              "Logs are append-only. There is no API endpoint that allows a log record to be modified or deleted. Log retention defaults to 30 days on Starter and 90 days on Professional. Enterprise plans configure custom retention.",
              "The admin dashboard exposes log search, export (CSV), and regulator-ready summary reports.",
            ]
          },
          {
            icon: <Database size={22} />, color: "#00ff88", title: "Deployment: Self-Hosted, No Data Egress",
            body: [
              "Vaultex ships as a single Docker image. All components (FastAPI gateway, Presidio NER engine, Redis) run in your network. There is no telemetry, no usage reporting, and no callback to Vaultex infrastructure in the Starter tier.",
              "Professional and Enterprise plans connect to the Vaultex licensing API for seat validation only — no prompt data, no customer data, no PII.",
              "The full source code is available under MIT license. Your security team can audit every line.",
            ]
          },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: "52px", paddingBottom: "52px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
              <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: section.color + "15", border: "1px solid " + section.color + "33", display: "flex", alignItems: "center", justifyContent: "center", color: section.color, flexShrink: 0 }}>
                {section.icon}
              </div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, lineHeight: 1.35 }}>{section.title}</h2>
            </div>
            {section.body.map((para, i) => (
              <p key={i} style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "14px" }}>{para}</p>
            ))}
          </div>
        ))}

        <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: "16px", padding: "32px", marginBottom: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <BadgeCheck size={20} color="#00d4ff" />
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#00d4ff", margin: 0 }}>Compliance Alignment</h3>
          </div>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "14px" }}>
            <strong style={{ color: "var(--text-primary)" }}>GLBA (Gramm–Leach–Bliley Act):</strong> The Safeguards Rule requires financial institutions to implement administrative, technical, and physical safeguards for customer information. Vaultex's tokenization layer ensures that customer NPI (Nonpublic Personal Information) is not transmitted in plaintext to third-party services.
          </p>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "14px" }}>
            <strong style={{ color: "var(--text-primary)" }}>GDPR (General Data Protection Regulation):</strong> Tokenization reduces the personal-data footprint of AI processing by ensuring that data sent to a third-party LLM provider does not constitute "personal data" under GDPR Article 4(1) when the LLM cannot reasonably re-identify the data subject from tokens alone.
          </p>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: "var(--text-primary)" }}>Disclaimer:</strong> Final compliance determinations rest with your legal team, DPO, and applicable regulators. Vaultex provides technical controls — not legal compliance guarantees.
          </p>
        </div>

        <div style={{ textAlign: "center", paddingBottom: "20px" }}>
          <Link href="/compliance" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#00d4ff", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>
            Read the compliance documentation &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
}
