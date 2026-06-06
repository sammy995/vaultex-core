import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Vaultex Privacy Policy — how we handle data on the hosted site and what data we do not collect.",
  alternates: { canonical: "https://vaultex.space/privacy" },
};

const LAST_UPDATED = "1 May 2025";

const sections = [
  {
    title: "1. Overview",
    body: `This Privacy Policy describes how Vaultex ("we", "us", "our") handles information in connection with the Vaultex website (vaultex.space) and associated services.

Vaultex is built around a core principle: we process as little personal data as possible, and we never collect the sensitive financial data that flows through the self-hosted gateway.`,
  },
  {
    title: "2. Self-Hosted Gateway — No Data Collection",
    body: `If you deploy the Vaultex open-source gateway on your own infrastructure (the Starter / self-hosted tier), Vaultex collects zero data from your deployment.

All tokenization, PII detection, audit logs, session data, and Redis vault contents remain entirely within your network. We have no access to, and do not receive, any prompt data, customer PII, or vault contents from self-hosted deployments.`,
  },
  {
    title: "3. Website (vaultex.space)",
    body: `When you visit vaultex.space, standard web server logs may capture your IP address, browser type, referring URL, and pages visited. This information is used solely for security monitoring and aggregate analytics.

We do not use tracking cookies or third-party analytics scripts that profile individual visitors.`,
  },
  {
    title: "4. Waitlist",
    body: `If you submit your email address via the waitlist form, we collect:

• Email address (required)
• Company name (optional)
• Role (optional)

This information is used only to notify you when the Professional tier launches. We will not sell, share, or rent your contact information to third parties. You may request deletion of your waitlist entry at any time by emailing hello@vaultex.space.`,
  },
  {
    title: "5. Hosted / SaaS Tiers",
    body: `If you use a managed or hosted Vaultex tier (Professional or Enterprise), a separate Data Processing Agreement (DPA) governs the handling of any data processed through your deployment. Please contact hello@vaultex.space to request a DPA.

In hosted tiers, we process tokenized prompts on your behalf as a data processor. Raw PII never travels to our servers — it is tokenized before leaving your network boundary.`,
  },
  {
    title: "6. Data Retention",
    body: `Waitlist email addresses are retained until you request deletion or the waitlist programme ends.

Website server logs are retained for up to 30 days for security purposes and then automatically purged.

We do not retain any prompt data, customer PII, or AI responses from self-hosted gateways.`,
  },
  {
    title: "7. Your Rights",
    body: `Depending on your jurisdiction, you may have rights to access, correct, delete, or restrict processing of your personal data. To exercise any of these rights, contact us at hello@vaultex.space. We will respond within 30 days.

For EU/EEA residents, you may also lodge a complaint with your local supervisory authority.`,
  },
  {
    title: "8. Security",
    body: `We implement reasonable technical and organizational measures to protect personal data against unauthorized access, disclosure, or loss. Waitlist data is transmitted over TLS and stored with access controls.`,
  },
  {
    title: "9. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. Changes will be posted at vaultex.space/privacy with an updated "Last Updated" date. For material changes, we will make reasonable efforts to notify you.`,
  },
  {
    title: "10. Contact",
    body: `For privacy-related questions or requests, contact us at:\n\nhello@vaultex.space`,
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}>
      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, height: "60px", display: "flex", alignItems: "center", padding: "0 clamp(16px,4vw,56px)", background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg,#00d4ff,#0066ff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={14} color="#000" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)" }}>Vaultex</span>
        </Link>
      </nav>

      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "72px 24px 100px" }}>
        {/* Header */}
        <div style={{ marginBottom: "56px" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#00d4ff", letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: "14px" }}>Legal</p>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "var(--text-primary)", marginBottom: "16px", lineHeight: 1.1 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Last updated: {LAST_UPDATED}</p>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          {sections.map((s) => (
            <section key={s.title}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {s.title}
              </h2>
              <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {s.title === "10. Contact" ? (
                  <>
                    For privacy-related questions or requests, contact us at:{"\n\n"}
                    <a href="mailto:hello@vaultex.space" style={{ color: "#00d4ff", textDecoration: "none" }}>hello@vaultex.space</a>
                  </>
                ) : s.body}
              </div>
            </section>
          ))}
        </div>

        {/* Footer nav */}
        <div style={{ marginTop: "64px", paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <Link href="/" style={{ fontSize: "0.83rem", color: "#00d4ff", textDecoration: "none" }}>← Back to home</Link>
          <div style={{ display: "flex", gap: "20px" }}>
            <Link href="/terms" style={{ fontSize: "0.83rem", color: "var(--text-muted)", textDecoration: "none" }}>Terms of Use</Link>
            <Link href="/compliance" style={{ fontSize: "0.83rem", color: "var(--text-muted)", textDecoration: "none" }}>Compliance</Link>
            <a href="mailto:hello@vaultex.space" style={{ fontSize: "0.83rem", color: "var(--text-muted)", textDecoration: "none" }}>Contact</a>
          </div>
        </div>
      </main>
    </div>
  );
}
