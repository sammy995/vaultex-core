import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — Vaultex AI Privacy Gateway",
  description: "Vaultex pricing: Free self-hosted Starter, Professional $299/mo, and Enterprise custom pricing for regulated financial institutions.",
  alternates: { canonical: "https://vaultex.space/pricing" },
  openGraph: { title: "Vaultex Pricing", description: "Start free, scale to enterprise. Purpose-built for banking and fintech." },
};

const PLANS = [
  {
    name: "Starter", price: "Free", period: "", color: "#8899aa", highlight: false,
    desc: "Self-host everything. Zero cost, zero lock-in. Ollama runs locally — no data ever leaves your network.",
    cta: "Deploy Now", ctaHref: "/setup",
    features: [
      { text: "Ollama (local models only)", note: "Zero cloud egress, zero API cost" },
      { text: "Up to 3 users", note: "" },
      { text: "Core PII entity types (6)", note: "SSN, EMAIL, PHONE, PERSON, ACCOUNT, LOAN_ID" },
      { text: "7-day audit log retention", note: "" },
      { text: "Docker single-container deploy", note: "" },
      { text: "Community support", note: "" },
      { text: "MIT open-source license", note: "" },
    ],
  },
  {
    name: "Professional", price: "$299", period: "/month", color: "#00d4ff", highlight: true,
    desc: "Add Anthropic & OpenAI routing with PII-stripped requests, full compliance tooling, and team scale.",
    cta: "Join Waitlist", ctaHref: "/#waitlist",
    features: [
      { text: "Anthropic Claude + OpenAI GPT + Ollama", note: "PII tokenized before leaving your gateway" },
      { text: "Up to 25 users", note: "" },
      { text: "Full 14+ PII entity coverage", note: "All core types + DOB, PASSPORT, DRIVER_LICENSE, IP, URL" },
      { text: "90-day audit log retention", note: "" },
      { text: "CSV analytics mode (bulk tokenization)", note: "" },
      { text: "Role-based export controls", note: "" },
      { text: "Priority email support", note: "Response within 8 business hours" },
      { text: "SSO (SAML 2.0)", note: "Beta Q3" },
    ],
  },
  {
    name: "Enterprise", price: "Custom", period: "", color: "#00ff88", highlight: false,
    desc: "On-prem VPC, SOC\u00a02, GLBA evidence packs, unlimited users, and dedicated SLAs for regulated institutions.",
    cta: "Contact Sales", ctaHref: "mailto:hello@vaultex.space",
    features: [
      { text: "Unlimited users", note: "" },
      { text: "On-prem / private VPC deployment", note: "" },
      { text: "SOC 2 Type II report (available)", note: "" },
      { text: "Custom RBAC policies", note: "" },
      { text: "GLBA / GDPR evidence pack", note: "" },
      { text: "Custom retention & data residency", note: "" },
      { text: "Dedicated Slack support channel", note: "" },
      { text: "99.9% uptime SLA", note: "" },
      { text: "Custom integration work", note: "On request" },
    ],
  },
];

const ALL_FEATURES = [
  { label: "LLM Providers",              s: "Ollama (local only)",  p: "Anthropic, OpenAI + Ollama",   e: "All + private endpoints" },
  { label: "Users",                      s: "3",             p: "25",                           e: "Unlimited" },
  { label: "PII entity types",           s: "6",             p: "14+",                          e: "14+ custom" },
  { label: "Audit retention",            s: "7 days",        p: "90 days",                      e: "Custom" },
  { label: "Role-based decryption",      s: "✓",             p: "✓",                            e: "✓" },
  { label: "CSV analytics mode",         s: "–",             p: "✓",                            e: "✓" },
  { label: "SOC 2 Type II",             s: "–",             p: "–",                            e: "✓" },
  { label: "GLBA evidence pack",        s: "–",             p: "–",                            e: "✓" },
  { label: "On-prem deploy",            s: "✓ (Docker)",    p: "Docker / k8s",                 e: "Full private VPC" },
  { label: "SLA",                       s: "–",             p: "Best effort",                  e: "99.9% uptime" },
  { label: "Support",                   s: "Community",     p: "Priority email",               e: "Dedicated Slack" },
];

export default function PricingPage() {
  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", color: "var(--text-primary)", padding: "80px 24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "72px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "24px", textDecoration: "none" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg,#00d4ff,#0066ff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={13} color="#000" />
            </div>
            <span style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem" }}>Vaultex</span>
          </Link>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.4rem)", fontWeight: 900, letterSpacing: "-0.035em", marginBottom: "18px" }}>
            Start free. Scale with confidence.
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--text-secondary)", maxWidth: "520px", margin: "0 auto 14px", lineHeight: 1.7 }}>
            The core tokenization engine is{" "}
            <a href="https://github.com/sammy995/vaultex-core" target="_blank" rel="noopener noreferrer" style={{ color: "#00d4ff", textDecoration: "none", fontWeight: 600 }}>MIT open-source</a>
            {" "}and always will be.
          </p>
          <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.7 }}>
            We earn by selling what regulated institutions actually need: Anthropic/OpenAI routing, SOC 2 evidence, GLBA compliance packs, SSO, extended retention, and dedicated SLAs. Open source builds trust — enterprise features fund the team.
          </p>
        </div>

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "80px", alignItems: "start" }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{ position: "relative", background: plan.highlight ? "rgba(0,212,255,0.04)" : "rgba(255,255,255,0.025)", border: "1px solid " + (plan.highlight ? plan.color + "55" : "rgba(255,255,255,0.07)"), borderRadius: "20px", padding: "36px 32px", boxShadow: plan.highlight ? "0 0 40px " + plan.color + "15" : "none" }}>
              {plan.highlight && (
                <div style={{ position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#000", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.08em", padding: "4px 14px", borderRadius: "100px" }}>
                  MOST POPULAR
                </div>
              )}
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: plan.color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>{plan.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "10px" }}>
                <span style={{ fontSize: "2.6rem", fontWeight: 800, letterSpacing: "-0.03em" }}>{plan.price}</span>
                {plan.period && <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{plan.period}</span>}
              </div>
              <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "28px" }}>{plan.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "11px", marginBottom: "32px" }}>
                {plan.features.map(f => (
                  <div key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: "9px" }}>
                    <CheckCircle size={14} color={plan.color} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <span style={{ fontSize: "0.83rem", color: "var(--text-secondary)" }}>{f.text}</span>
                      {f.note && <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>{f.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <Link href={plan.ctaHref} style={{ display: "block", width: "100%", padding: "13px", borderRadius: "10px", background: plan.highlight ? "linear-gradient(135deg,#00d4ff,#0066ff)" : "rgba(255,255,255,0.06)", color: plan.highlight ? "#000" : plan.color, fontWeight: 700, fontSize: "0.9rem", textAlign: "center", textDecoration: "none", boxShadow: plan.highlight ? "0 4px 20px #00d4ff40" : "none" }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Full feature comparison */}
        <div style={{ marginBottom: "80px" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, textAlign: "center", letterSpacing: "-0.025em", marginBottom: "36px" }}>Full feature comparison</h2>
          <div style={{ background: "rgba(8,12,22,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.09em", textTransform: "uppercase" }}>
              <span>Feature</span>
              <span style={{ color: "#8899aa", textAlign: "center" }}>Starter</span>
              <span style={{ color: "#00d4ff", textAlign: "center" }}>Pro</span>
              <span style={{ color: "#00ff88", textAlign: "center" }}>Enterprise</span>
            </div>
            {ALL_FEATURES.map((row, i) => (
              <div key={row.label} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "13px 24px", alignItems: "center", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: "0.84rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>{row.label}</span>
                <span style={{ textAlign: "center", color: row.s === "–" ? "var(--text-muted)" : "var(--text-primary)", fontFamily: row.s.length < 4 ? "var(--font-mono)" : "inherit" }}>{row.s}</span>
                <span style={{ textAlign: "center", color: row.p === "–" ? "var(--text-muted)" : "#00d4ff", fontFamily: row.p.length < 4 ? "var(--font-mono)" : "inherit" }}>{row.p}</span>
                <span style={{ textAlign: "center", color: row.e === "–" ? "var(--text-muted)" : "#00ff88", fontFamily: row.e.length < 4 ? "var(--font-mono)" : "inherit" }}>{row.e}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", paddingBottom: "40px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "20px" }}>Have questions about Enterprise pricing or compliance requirements?</p>
          <Link href="mailto:hello@vaultex.space" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(0,255,136,0.07)", border: "1px solid rgba(0,255,136,0.25)", color: "#00ff88", borderRadius: "10px", padding: "12px 24px", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none" }}>
            Talk to sales &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
}
