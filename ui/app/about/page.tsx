import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Users, Globe, Code2 } from "lucide-react";

export const metadata: Metadata = {
  title: "About Vaultex — AI Privacy Gateway for Financial Services",
  description: "Vaultex was built to solve a specific problem: financial teams using AI without any control over what customer data reaches the model. We built the missing layer.",
  alternates: { canonical: "https://vaultex.space/about" },
};

export default function AboutPage() {
  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", color: "var(--text-primary)", padding: "80px 24px" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "44px", textDecoration: "none" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg,#00d4ff,#0066ff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={13} color="#000" />
          </div>
          <span style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem" }}>Vaultex</span>
        </Link>

        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#00d4ff", letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: "14px" }}>Our Story</p>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, letterSpacing: "-0.035em", marginBottom: "24px", lineHeight: 1.1 }}>
          We built the layer that was missing between banks and LLMs.
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "22px", fontSize: "0.96rem", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "64px" }}>
          <p>
            Financial institutions are under enormous pressure to adopt AI. Competitors are shipping AI-powered credit analysis, automated risk summaries, and real-time portfolio insights. The teams building those products face a question every compliance officer dreads: <em style={{ color: "var(--text-primary)" }}>"Did any customer SSNs reach OpenAI?"</em>
          </p>
          <p>
            Most teams answered that question by either avoiding AI altogether or by hoping the problem would not be noticed. Neither answer was sustainable.
          </p>
          <p>
            We built Vaultex because the missing piece was not a policy — it was a technical control. A proxy layer that intercepts every prompt, removes the personal identifiers, and lets the LLM do what it is actually good at: reasoning over numbers, patterns, and structure. The names and SSNs are noise. The balances, credit scores, and risk flags are signal.
          </p>
          <p>
            The tokenization is reversible. The same person maps to the same token in every row of your loan book, so your LLM can track {"{{PERSON_1}}"} across a portfolio analysis without ever knowing who {"{{PERSON_1}}"} is. When the response comes back, only the roles authorized to see real PII get real PII.
          </p>
          <p>
            Vaultex is open source because we believe infrastructure this important should be auditable. The core is MIT-licensed and always will be. We make money by adding the enterprise tooling that compliance and security teams need on top: extended audit retention, SOC 2 reports, GLBA evidence packs, and dedicated support.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "72px" }}>
          {[
            { icon: <Shield size={20} />, color: "#00d4ff", label: "Security-First", desc: "Every design decision starts from zero-trust." },
            { icon: <Code2 size={20} />, color: "#00ff88", label: "Open Source", desc: "MIT license. Audit every line. Fork freely." },
            { icon: <Users size={20} />, color: "#ffb800", label: "Built for Teams", desc: "RBAC from day one. Junior to admin." },
            { icon: <Globe size={20} />, color: "#00d4ff", label: "No Vendor Lock-In", desc: "Anthropic, OpenAI, or local Ollama — your choice." },
          ].map(item => (
            <div key={item.label} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "24px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "11px", background: item.color + "15", border: "1px solid " + item.color + "33", display: "flex", alignItems: "center", justifyContent: "center", color: item.color, marginBottom: "14px" }}>
                {item.icon}
              </div>
              <p style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)", marginBottom: "6px" }}>{item.label}</p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "48px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: "16px" }}>Get in touch</h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "24px" }}>
            We talk to compliance officers, CISOs, and AI engineers at financial institutions every week. If you are evaluating whether Vaultex fits your stack, we want to hear about your use case.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="mailto:hello@vaultex.space" style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.25)", color: "#00d4ff", borderRadius: "10px", padding: "11px 20px", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none" }}>
              hello@vaultex.space &rarr;
            </Link>
            <Link href="/#waitlist" style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-primary)", borderRadius: "10px", padding: "11px 20px", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none" }}>
              Join the waitlist
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
