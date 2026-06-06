import type { Metadata } from "next";
import Link from "next/link";
import { Shield, BadgeCheck, FileText, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Compliance — GLBA, GDPR, CCPA — Vaultex",
  description: "How Vaultex supports GLBA Safeguards Rule compliance, GDPR Article 25 data minimization, and CCPA business obligations when using AI with financial data.",
  alternates: { canonical: "https://vaultex.space/compliance" },
};

export default function CompliancePage() {
  const sections = [
    {
      badge: "GLBA", color: "#ffb800", title: "Gramm–Leach–Bliley Act (GLBA) — Safeguards Rule",
      items: [
        { q: "What is the requirement?", a: "The FTC Safeguards Rule (16 C.F.R. Part 314) requires financial institutions to implement a written information security programme that includes administrative, technical, and physical safeguards to protect customer Nonpublic Personal Information (NPI)." },
        { q: "How Vaultex supports it", a: "Vaultex prevents NPI from being transmitted to third-party LLM APIs in plaintext form. The gateway tokenizes all GLBA-relevant identifiers (name, SSN, account number, email, phone, date of birth) before they leave your network boundary. The append-only audit trail provides evidence of what data was processed, by whom, and when — directly relevant to Safeguards Rule documentation requirements." },
        { q: "Scope of support", a: "Vaultex addresses the technical transmission control layer of Safeguards Rule compliance. An institution's full compliance programme must also address physical security, employee training, third-party service provider contracts, and periodic risk assessments. Vaultex does not replace those controls." },
      ]
    },
    {
      badge: "GDPR", color: "#00d4ff", title: "General Data Protection Regulation (GDPR)",
      items: [
        { q: "Article 25 — Data Protection by Design", a: "GDPR Article 25 requires controllers to implement data-protection principles (including data minimization) at the design stage of any processing system. Vaultex's tokenization architecture embeds data minimization into the AI request pipeline — the LLM receives the minimum data necessary (tokens for identifiers, real values for analytics fields) to perform its function." },
        { q: "Article 28 — Processor obligations", a: "When an external LLM provider (Anthropic, OpenAI) processes data on your behalf, GDPR Article 28 requires a data processing agreement. By tokenizing PII before it reaches those providers, Vaultex reduces the scope of data that is processed under such agreements — potentially excluding the interaction from Article 28 obligations entirely if the LLM cannot re-identify data subjects from tokens alone." },
        { q: "Our position", a: "Whether tokenized prompts constitute 'personal data' under GDPR Article 4(1) depends on the likelihood of re-identification and the applicable legal context. This is a legal determination for your DPO and legal counsel, not a vendor claim." },
      ]
    },
    {
      badge: "CCPA", color: "#00ff88", title: "California Consumer Privacy Act (CCPA) / CPRA",
      items: [
        { q: "Relevant obligations", a: "The CCPA (as amended by CPRA) gives California consumers rights over personal information held by businesses, including the right to know, the right to delete, and the right to opt out of sale or sharing. It also imposes obligations on businesses to implement reasonable security procedures." },
        { q: "How Vaultex supports it", a: "Vaultex's tokenization reduces the personal information footprint of AI processing by ensuring that LLM providers do not receive California consumers' personal information in a form that constitutes a 'sale' or 'share' under CCPA. The audit trail supports Data Subject Access Requests by logging what processing occurred and when." },
      ]
    },
  ];

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", color: "var(--text-primary)", padding: "80px 24px" }}>
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "44px", textDecoration: "none" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg,#00d4ff,#0066ff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={13} color="#000" />
          </div>
          <span style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem" }}>Vaultex</span>
        </Link>

        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#00d4ff", letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: "14px" }}>Compliance Documentation</p>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, letterSpacing: "-0.035em", marginBottom: "20px", lineHeight: 1.1 }}>
          GLBA · GDPR · CCPA
        </h1>
        <p style={{ fontSize: "0.96rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "16px", maxWidth: "640px" }}>
          How Vaultex's architecture supports your obligations under the three primary data privacy frameworks applicable to financial services AI deployments.
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,184,0,0.07)", border: "1px solid rgba(255,184,0,0.2)", borderRadius: "10px", padding: "10px 16px", marginBottom: "56px" }}>
          <AlertTriangle size={15} color="#ffb800" />
          <span style={{ fontSize: "0.8rem", color: "#ffb800", fontWeight: 500, lineHeight: 1.4 }}>
            This document describes technical controls only. Final compliance determination requires your legal team and applicable regulators.
          </span>
        </div>

        {sections.map(section => (
          <div key={section.badge} style={{ marginBottom: "60px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: section.color, background: section.color + "15", border: "1px solid " + section.color + "33", borderRadius: "7px", padding: "4px 10px", letterSpacing: "0.06em" }}>{section.badge}</span>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{section.title}</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {section.items.map((item, i) => (
                <div key={item.q} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "18px 0" }}>
                  <p style={{ fontSize: "0.88rem", fontWeight: 700, color: section.color, marginBottom: "8px" }}>{item.q}</p>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.75, margin: 0 }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: "16px", padding: "28px", marginBottom: "48px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#00d4ff", marginBottom: "12px" }}>Evidence Pack for Regulators</h3>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "14px" }}>
            Enterprise plan customers receive a Vaultex Compliance Evidence Pack, which includes: architecture diagram, data flow documentation, audit log schema, RBAC configuration summary, and a vendor security questionnaire (CAIQ-aligned). Contact <Link href="mailto:hello@vaultex.space" style={{ color: "#00d4ff" }}>hello@vaultex.space</Link> for access.
          </p>
        </div>

        <Link href="/security" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#00d4ff", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>
          &larr; Back to security architecture
        </Link>

      </div>
    </div>
  );
}
