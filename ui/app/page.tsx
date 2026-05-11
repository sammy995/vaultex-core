"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, Zap, Eye, EyeOff, BarChart3, Lock, Server, ArrowRight,
  ChevronRight, CheckCircle, Database, ChevronDown, FileText,
  Users, Globe, Terminal, Building2, TrendingUp, Fingerprint,
  RefreshCw, BadgeCheck, AlertTriangle, Mail, Code2, Sparkles
} from "lucide-react";
import ProductDemo from "@/components/ProductDemo";

// ── static data ─────────────────────────────────────────────────────────────

const HOW_TO_USE = [
  {
    mode: "REST API Proxy",
    color: "#00d4ff",
    icon: "api",
    badge: "Drop-in",
    headline: "One line change. Your existing SDK.",
    desc: "Point any Anthropic, OpenAI, or Ollama SDK at the Vaultex gateway URL. Every outbound prompt is auto-tokenized. Every response is auto-detokenized. Zero refactoring.",
    code: `# Before\nclient = anthropic.Anthropic(api_key="sk-ant-...")\n\n# After — one change\nclient = anthropic.Anthropic(\n  base_url="https://your-vaultex-host:8000",\n  api_key="sk-ant-..."\n)`,
  },
  {
    mode: "Chat UI",
    color: "#00ff88",
    icon: "chat",
    badge: "No code",
    headline: "Browser-based. Upload CSV. Ask questions.",
    desc: "Open the built-in web interface at /chat. Upload a CSV of customer records, start a conversation, and watch PII get masked in real time — role-filtered per your RBAC config.",
    code: null,
  },
  {
    mode: "CSV Analytics Mode",
    color: "#ffb800",
    icon: "csv",
    badge: "Analytics",
    headline: "Upload data. Query at scale. PII stays masked.",
    desc: "Drop a CSV with thousands of loan records into the /chat interface. Ask portfolio-level questions. The LLM sees tokens, computes real analytics, and you see role-filtered answers.",
    code: null,
  },
];

const STATS = [
  { value: "<8ms", label: "Added latency per request", color: "#00d4ff" },
  { value: "14+", label: "PII entity types detected", color: "#00ff88" },
  { value: "100%", label: "Prompts tokenized before LLM", color: "#ffb800" },
  { value: "0", label: "PII stored in plaintext", color: "#00ff88" },
];

const PAIN_POINTS = [
  {
    color: "#ff4444",
    title: "Analysts paste SSNs into ChatGPT",
    desc: "Every time a team member copies customer data into an AI prompt, your org risks a GLBA violation with no log of what left your network or which model processed it.",
  },
  {
    color: "#ffb800",
    title: "No audit trail for regulators",
    desc: "Cloud LLMs process and may retain prompt data. Without a proxy layer, you have zero regulator-ready evidence of what sensitive information reached which external model.",
  },
  {
    color: "#ff4444",
    title: "Junior staff see VP-level data",
    desc: "Most AI tools have no row-level access control. A junior analyst sees the exact same AI response as a VP — including full PII they should never be authorized to access.",
  },
];

const FEATURES = [
  { color: "#00d4ff", title: "Presidio NER Detection",   desc: "Microsoft Presidio NER catches PERSON, SSN, ACCOUNT_NUMBER, LOAN_ID, EMAIL, PHONE, and DATE_OF_BIRTH before any prompt crosses your network boundary." },
  { color: "#00ff88", title: "Reversible Tokenization",  desc: "PII becomes {{PERSON_1}} — not random noise. The same person gets the same token in every message. Responses auto-detokenize on the way back." },
  { color: "#ffb800", title: "Analytics Preserved",      desc: "Balances, credit scores, rates, and risk flags are NEVER masked. Your LLM can still compute averages, flag high-risk loans, and run full distributions." },
  { color: "#00d4ff", title: "Multi-LLM Routing — PII-stripped",        desc: "Route to Anthropic Claude, OpenAI GPT-4, or self-hosted Ollama. The gateway tokenizes PII locally before any request reaches a cloud API — so neither Anthropic nor OpenAI ever sees a real name, SSN, or account number." },
  { color: "#00ff88", title: "Role-Based Decryption",    desc: "Junior analysts see {{PERSON_1}}. Senior analysts see the name. VPs see everything. RBAC enforced at the token level, not the application layer." },
  { color: "#ffb800", title: "Append-Only Audit Trail",  desc: "Every request, PII detection event, and auth failure is logged with correlation IDs. 30-day retention. Regulator-ready admin console included." },
];

const COMPARE_ROWS = [
  { feature: "Reversible tokenization",       v: true,  dlp: false, direct: false, manual: false },
  { feature: "Analytics fields preserved",    v: true,  dlp: false, direct: true,  manual: null },
  { feature: "Role-level PII decryption",     v: true,  dlp: false, direct: false, manual: false },
  { feature: "Append-only audit trail",       v: true,  dlp: true,  direct: false, manual: false },
  { feature: "On-premise / self-hosted",      v: true,  dlp: false, direct: false, manual: true },
  { feature: "Multi-LLM routing",             v: true,  dlp: false, direct: null,  manual: null },
  { feature: "Zero code changes required",    v: true,  dlp: false, direct: true,  manual: false },
  { feature: "GLBA evidence pack",            v: true,  dlp: null,  direct: false, manual: null },
];

const PRICING = [
  {
    name: "Starter", price: "Free", period: "", badge: "", color: "#8899aa", highlight: false,
    desc: "Self-host with Ollama. Full tokenization engine, no credit card, no time limit.",
    cta: "Deploy Now", ctaHref: "/setup",
    features: ["Ollama (local models) only", "Up to 3 users", "Core PII tokenization (6 entity types)", "7-day audit log retention", "Community support", "MIT open-source license"],
  },
  {
    name: "Professional", price: "$299", period: "/mo", badge: "Most Popular", color: "#00d4ff", highlight: true,
    desc: "Unlock Anthropic + OpenAI routing, full compliance tooling, and team access.",
    cta: "Join Waitlist", ctaHref: "#waitlist",
    features: ["Anthropic Claude + OpenAI GPT + Ollama", "Up to 25 users", "Full PII entity coverage (14 types)", "90-day audit retention", "CSV analytics mode", "Role-based export controls", "Priority email support"],
  },
  {
    name: "Enterprise", price: "Custom", period: "", badge: "", color: "#00ff88", highlight: false,
    desc: "For regulated institutions — on-prem VPC, SOC 2, GLBA evidence packs, and SLAs.",
    cta: "Contact Sales", ctaHref: "#waitlist",
    features: ["Unlimited users", "On-prem / private VPC deploy", "SOC 2 Type II report", "Custom RBAC policies", "GLBA / GDPR evidence pack", "Dedicated Slack support channel", "99.9% uptime SLA"],
  },
];

const FAQ_ITEMS = [
  { q: "Does the LLM ever see raw PII?", a: "No — regardless of provider. Whether you use Anthropic, OpenAI, or Ollama, the gateway intercepts the outbound message and replaces all detected PII with deterministic tokens before forwarding it. For cloud providers (Anthropic, OpenAI), the tokenized prompt travels to their API but no raw PII is included. For Ollama, nothing leaves your machine at all. The token-to-value vault is Fernet-encrypted and never transmitted to any external service." },
  { q: "How is tokenization reversed?", a: "Each token maps to the original value in a session-scoped, Fernet-encrypted Redis store. On the return path, the gateway re-substitutes tokens for real values — but only for entity types your JWT role explicitly permits." },
  { q: "Does masking break analytics?", a: "No — this is the core design principle. Financial values (balances, credit scores, rates, payments, risk flags), geographic dimensions, and behavioral data are preserved in full. Only direct personal identifiers are tokenized." },
  { q: "What LLM providers are supported?", a: "Anthropic Claude, OpenAI GPT (all versions), and any Ollama-compatible local model (Llama 3, Mistral, Gemma, Phi, etc.). API keys are Fernet-encrypted at rest and never stored in plaintext." },
  { q: "Is this GDPR / GLBA / CCPA compliant?", a: "Vaultex is architected to support compliance: PII never leaves your network in raw form, the audit trail provides regulator-ready evidence, and RBAC enforces need-to-know access. Final compliance determination rests with your legal team and DPO." },
  { q: "Can I run this fully on-premise?", a: "Yes — with Ollama. The Starter tier runs in a single Docker container with zero external dependencies. Ollama runs locally on the same machine or a dedicated GPU server. No data ever leaves your infrastructure. For cloud LLMs (Anthropic, OpenAI), prompts are tokenized locally before dispatch, but they do travel to those providers\u2019 servers — which is fine for most compliance postures since raw PII is never included." },
];

const DEMO_SAMPLE = "Analyze risk for Jane Smith (SSN: 123-45-6789, email: jane.smith@acme.com, phone: 415-555-0192). Account ACC-00198234 has balance $42,500, credit score 742, 0 days past due. Loan LOAN-2024-0041 is a Mortgage at 4.75% APR. Risk Flag: LOW.";

const ENTITY_PATTERNS: Array<{ re: string; flags: string; type: string; short: string }> = [
  { re: "\\b\\d{3}-\\d{2}-\\d{4}\\b", flags: "g", type: "SSN", short: "SSN" },
  { re: "[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}", flags: "g", type: "EMAIL", short: "EMAIL" },
  { re: "\\b\\d{3}[-.\\s]\\d{3}[-.\\s]\\d{4}\\b", flags: "g", type: "PHONE", short: "PHONE" },
  { re: "\\bACC-\\d{6,12}\\b", flags: "g", type: "ACCOUNT", short: "ACCT" },
  { re: "\\bLOAN-\\d{4}-\\d{3,6}\\b", flags: "g", type: "LOAN_ID", short: "LOAN" },
  { re: "\\b(?:Jane Smith|John Smith|Robert Chen|Priya Patel|Marcus Johnson|Linda Nguyen|David Kim|Sarah O.Brien|Amara Osei|Carlos Rivera|Ethan Brooks|George Tanaka)\\b", flags: "g", type: "PERSON", short: "PERSON" },
];

function clientTokenize(text: string): { out: string; hits: Array<{ type: string; token: string; original: string }> } {
  const hits: Array<{ type: string; token: string; original: string }> = [];
  const allMatches: Array<{ s: number; e: number; val: string; type: string; short: string }> = [];
  for (const p of ENTITY_PATTERNS) {
    const re = new RegExp(p.re, p.flags);
    let m;
    while ((m = re.exec(text)) !== null) {
      allMatches.push({ s: m.index, e: m.index + m[0].length, val: m[0], type: p.type, short: p.short });
    }
  }
  allMatches.sort((a, b) => b.s - a.s);
  const used = new Set<number>();
  const deduped = allMatches.filter(m => {
    for (let i = m.s; i < m.e; i++) if (used.has(i)) return false;
    for (let i = m.s; i < m.e; i++) used.add(i);
    return true;
  });
  const counters: Record<string, number> = {};
  let out = text;
  for (const m of deduped) {
    counters[m.short] = (counters[m.short] || 0) + 1;
    const token = "{{" + m.short + "_" + counters[m.short] + "}}";
    hits.push({ type: m.type, token, original: m.val });
    out = out.slice(0, m.s) + token + out.slice(m.e);
  }
  return { out, hits };
}

// ── ui atoms ────────────────────────────────────────────────────────────────

function SectionLabel({ text, color }: { text: string; color: string }) {
  return <p style={{ fontSize: "0.72rem", fontWeight: 700, color, letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: "14px" }}>{text}</p>;
}

function Token({ label }: { label: string }) {
  return (
    <span style={{ display: "inline-block", fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 600, color: "#00ff88", background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: "5px", padding: "1px 7px", verticalAlign: "middle" }}>
      {label}
    </span>
  );
}

function CompareCell({ val }: { val: boolean | null }) {
  if (val === true) return <span style={{ color: "#00ff88", fontWeight: 700, fontSize: "1rem" }}>&#10003;</span>;
  if (val === false) return <span style={{ color: "#3a4a5a", fontWeight: 700, fontSize: "1rem" }}>&#10005;</span>;
  return <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>~</span>;
}

function PainCard({ color, title, desc }: { color: string; title: string; desc: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid " + color + "33", borderRadius: "16px", padding: "28px", borderLeft: "3px solid " + color }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: color + "15", border: "1px solid " + color + "33", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
        <AlertTriangle size={18} color={color} />
      </div>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>{title}</h3>
      <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>{desc}</p>
    </div>
  );
}

function FeatureCard({ color, title, desc, idx }: { color: string; title: string; desc: string; idx: number }) {
  const [hovered, setHovered] = useState(false);
  const icons = [Fingerprint, RefreshCw, BarChart3, Server, Shield, FileText];
  const Icon = icons[idx % icons.length];
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)", border: "1px solid " + (hovered ? color + "44" : "rgba(255,255,255,0.06)"), borderRadius: "16px", padding: "28px", transition: "all 240ms ease", transform: hovered ? "translateY(-3px)" : "none", boxShadow: hovered ? "0 12px 40px " + color + "1a" : "none", cursor: "default" }}
    >
      <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: color + "15", border: "1px solid " + color + "33", display: "flex", alignItems: "center", justifyContent: "center", color, marginBottom: "18px", boxShadow: hovered ? "0 0 20px " + color + "33" : "none", transition: "box-shadow 240ms ease" }}>
        <Icon size={22} />
      </div>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>{title}</h3>
      <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>{desc}</p>
    </div>
  );
}

function PricingCard({ plan }: { plan: typeof PRICING[number] }) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: "relative", background: plan.highlight ? "rgba(0,212,255,0.04)" : "rgba(255,255,255,0.025)", border: "1px solid " + (plan.highlight ? plan.color + "55" : (hovered ? plan.color + "33" : "rgba(255,255,255,0.07)")), borderRadius: "20px", padding: "36px 32px", transition: "all 240ms ease", transform: hovered ? "translateY(-4px)" : "none", boxShadow: plan.highlight ? "0 0 40px " + plan.color + "15" : (hovered ? "0 12px 40px rgba(0,0,0,0.4)" : "none"), display: "flex", flexDirection: "column" }}
    >
      {plan.badge && (
        <div style={{ position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#000", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.08em", padding: "4px 14px", borderRadius: "100px", whiteSpace: "nowrap" }}>
          {plan.badge}
        </div>
      )}
      <div style={{ marginBottom: "8px" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: plan.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{plan.name}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "12px" }}>
        <span style={{ fontSize: "2.6rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{plan.price}</span>
        {plan.period && <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{plan.period}</span>}
      </div>
      <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "28px" }}>{plan.desc}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "11px", marginBottom: "32px", flex: 1 }}>
        {plan.features.map(f => (
          <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <CheckCircle size={15} color={plan.color} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>{f}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => { if (plan.ctaHref.startsWith("#")) { document.querySelector(plan.ctaHref)?.scrollIntoView({ behavior: "smooth" }); } else { router.push(plan.ctaHref); } }}
        style={{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", background: plan.highlight ? "linear-gradient(135deg," + plan.color + ",#0066ff)" : "rgba(255,255,255,0.06)", color: plan.highlight ? "#000" : plan.color, boxShadow: plan.highlight ? "0 4px 20px " + plan.color + "40" : "none", transition: "all 200ms ease", transform: hovered ? "scale(1.01)" : "scale(1)" }}
      >
        {plan.cta}
      </button>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", gap: "16px", textAlign: "left" }}>
        <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>{q}</span>
        <ChevronDown size={18} color="var(--text-muted)" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }} />
      </button>
      {open && <div style={{ padding: "0 0 20px", fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>{a}</div>}
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [demoText, setDemoText] = useState(DEMO_SAMPLE);
  const [demoResult, setDemoResult] = useState<{ out: string; hits: Array<{ type: string; token: string; original: string }> } | null>(null);
  const [demoRan, setDemoRan] = useState(false);
  const [waitEmail, setWaitEmail] = useState("");
  const [waitCompany, setWaitCompany] = useState("");
  const [waitRole, setWaitRole] = useState("");
  const [waitStatus, setWaitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [waitMsg, setWaitMsg] = useState("");

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  function runDemo() { setDemoResult(clientTokenize(demoText)); setDemoRan(true); }
  function resetDemo() { setDemoText(DEMO_SAMPLE); setDemoResult(null); setDemoRan(false); }

  function submitWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!waitEmail) return;
    const subject = encodeURIComponent(
      `Waitlist signup: ${waitEmail}${waitCompany ? ` (${waitCompany})` : ""}`
    );
    const body = encodeURIComponent(
      `New Vaultex waitlist signup\n\nEmail: ${waitEmail}` +
      `${waitCompany ? `\nCompany: ${waitCompany}` : ""}` +
      `${waitRole ? `\nRole: ${waitRole}` : ""}` +
      `\nTime: ${new Date().toLocaleString("en-US")}`
    );
    window.open(`mailto:hello@vaultex.space?subject=${subject}&body=${body}`);
    setWaitStatus("success");
    setWaitMsg("Your email client has opened — just hit Send to confirm your spot. We\'ll reach out at launch with 3 months free access.");
  }

  function scrollTo(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }

  const NAV_LINKS: Array<{ label: string; href: string; external?: boolean }> = [
    { label: "Features", href: "#features" },
    { label: "Security", href: "/security", external: true },
    { label: "Compliance", href: "/compliance", external: true },
    { label: "Pricing", href: "/pricing", external: true },
    { label: "About", href: "/about", external: true },
  ];

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ── NAVBAR ── */}
      <nav aria-label="Main navigation" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(16px,4vw,56px)", background: scrolled ? "rgba(0,0,0,0.9)" : "transparent", backdropFilter: scrolled ? "blur(24px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none", transition: "all 280ms ease" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "linear-gradient(135deg,#00d4ff,#0066ff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={17} color="#000" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.025em", color: "var(--text-primary)" }}>Vaultex</span>
          <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#00d4ff", background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: "100px", padding: "2px 7px", letterSpacing: "0.05em" }}>BETA</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <div className="hidden md:flex" style={{ gap: "22px" }}>
            {NAV_LINKS.map(l => (
              l.external
                ? <Link key={l.label} href={l.href} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, textDecoration: "none" }}>{l.label}</Link>
                : <button key={l.label} onClick={() => scrollTo(l.href.slice(1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, padding: 0 }}>{l.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => scrollTo("waitlist")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-primary)", borderRadius: "8px", padding: "8px 16px", fontSize: "0.84rem", fontWeight: 600, cursor: "pointer" }}>Join Waitlist</button>
            <button className="btn-primary" onClick={() => router.push("/setup")} style={{ padding: "8px 18px", fontSize: "0.84rem", display: "flex", alignItems: "center", gap: "6px" }}>Try Demo <ArrowRight size={14} /></button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section aria-label="Hero" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "8%", left: "50%", transform: "translateX(-50%)", width: "800px", height: "500px", background: "radial-gradient(ellipse, rgba(0,212,255,0.07) 0%, rgba(0,100,255,0.03) 45%, transparent 70%)" }} />
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "100px", padding: "7px 18px", fontSize: "0.77rem", fontWeight: 600, color: "#00d4ff", marginBottom: "36px", letterSpacing: "0.03em" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 8px #00ff88", display: "inline-block" }} />
          AI-Native PII Tokenization Gateway — Banking Analytics Preserved
        </div>

        <h1 style={{ fontSize: "clamp(2.8rem,7.5vw,5.4rem)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.04em", color: "var(--text-primary)", maxWidth: "920px", marginBottom: "26px" }}>
          Your LLMs.{" "}
          <span style={{ background: "linear-gradient(90deg,#00d4ff 0%,#0066ff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Zero PII.</span>
          <br />
          <span style={{ background: "linear-gradient(90deg,#00ff88 0%,#00d4aa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Full Analytics.</span>
        </h1>

        <p style={{ fontSize: "clamp(1rem,2.2vw,1.22rem)", color: "var(--text-secondary)", maxWidth: "640px", lineHeight: 1.72, marginBottom: "20px" }}>
          The drop-in AI privacy gateway that tokenizes sensitive data before any prompt leaves your organization — then reverses it on the way back. Role-aware. Audit-logged. Built for regulated finance.
        </p>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "48px" }}>
          Prevent GLBA violations · Satisfy GDPR · Preserve CCPA rights · Deploy in under 30 minutes
        </p>

        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center", marginBottom: "80px" }}>
          <button className="btn-primary" onClick={() => router.push("/setup")} style={{ padding: "15px 32px", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px", borderRadius: "11px" }}>
            Try Live Demo <ArrowRight size={16} />
          </button>
          <button onClick={() => scrollTo("waitlist")} style={{ padding: "15px 32px", fontSize: "1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-primary)", borderRadius: "11px", cursor: "pointer", fontWeight: 600 }}>
            Join Waitlist
          </button>
        </div>

        {/* Hero demo terminal */}
        <div style={{ background: "rgba(8,12,22,0.9)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "18px", width: "100%", maxWidth: "720px", textAlign: "left", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,255,0.04)" }}>
          <div style={{ padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
            {["#ff4444","#ffb800","#00ff88"].map(c => <span key={c} style={{ width: "11px", height: "11px", borderRadius: "50%", background: c, display: "inline-block" }} />)}
            <span style={{ marginLeft: "10px", fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>vaultex — tokenization gateway — live</span>
          </div>
          <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: "7px", letterSpacing: "0.06em" }}>OUTBOUND (raw prompt — your network)</span>
              <div style={{ background: "rgba(255,68,68,0.04)", border: "1px solid rgba(255,68,68,0.12)", borderRadius: "10px", padding: "13px 16px", fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                Summarize loan for{" "}<span style={{ color: "#ff8888", background: "rgba(255,68,68,0.1)", borderRadius: "3px", padding: "0 3px" }}>Jane Smith</span>{" "}— SSN{" "}<span style={{ color: "#ff8888", background: "rgba(255,68,68,0.1)", borderRadius: "3px", padding: "0 3px" }}>123-45-6789</span>, account{" "}<span style={{ color: "#ff8888", background: "rgba(255,68,68,0.1)", borderRadius: "3px", padding: "0 3px" }}>ACC-00198234</span>, email{" "}<span style={{ color: "#ff8888", background: "rgba(255,68,68,0.1)", borderRadius: "3px", padding: "0 3px" }}>jane@acme.com</span>. Balance $42,500, credit score 742, risk LOW.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(0,255,136,0.15)" }} />
              <span style={{ fontSize: "0.67rem", color: "#00ff88", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>VAULTEX GATEWAY — &lt;8ms tokenization</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(0,255,136,0.15)" }} />
            </div>
            <div>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: "7px", letterSpacing: "0.06em" }}>INBOUND TO LLM (safe — external API)</span>
              <div style={{ background: "rgba(0,255,136,0.03)", border: "1px solid rgba(0,255,136,0.12)", borderRadius: "10px", padding: "13px 16px", fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.75, fontFamily: "var(--font-mono)" }}>
                Summarise loan for <Token label="{{PERSON_1}}" /> — SSN <Token label="{{SSN_1}}" />, account <Token label="{{ACCT_1}}" />, email <Token label="{{EMAIL_1}}" />. Balance $42,500, credit score 742, risk LOW.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW TO USE / PRODUCT CLARITY ── */}
      <section id="how-to-use" style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 24px 0" }}>
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <SectionLabel text="Product" color="#00d4ff" />
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: "16px" }}>
            API proxy <em style={{ fontStyle: "normal", color: "var(--text-muted)", fontSize: "0.85em" }}>or</em> chatbot?
          </h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "540px", margin: "0 auto", fontSize: "0.95rem", lineHeight: 1.65 }}>
            Both. Vaultex is a gateway that fits into your existing workflow — no matter how you work with LLMs.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {HOW_TO_USE.map((m) => (
            <div key={m.mode} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid " + m.color + "33", borderRadius: "18px", padding: "28px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                <div style={{ background: m.color + "15", border: "1px solid " + m.color + "30", borderRadius: "9px", padding: "7px 14px", fontSize: "0.7rem", fontWeight: 800, color: m.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{m.badge}</div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>{m.mode}</span>
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, margin: 0 }}>{m.headline}</h3>
              <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>{m.desc}</p>
              {m.code && (
                <pre style={{ margin: 0, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "14px 16px", fontSize: "0.76rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", lineHeight: 1.6, overflowX: "auto" }}><code>{m.code}</code></pre>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "28px", textAlign: "center" }}>
          <button onClick={() => router.push("/setup")} className="btn-primary" style={{ padding: "12px 28px", fontSize: "0.88rem", display: "inline-flex", alignItems: "center", gap: "7px" }}>
            Try the Demo — Connect Your LLM <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* ── COMPLIANCE STRIP ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "22px 24px", marginTop: "60px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(16px,3vw,52px)", flexWrap: "wrap" }}>
          {[
            { icon: <BadgeCheck size={14} />, label: "GLBA Aligned" },
            { icon: <BadgeCheck size={14} />, label: "GDPR Ready" },
            { icon: <BadgeCheck size={14} />, label: "CCPA Aware" },
            { icon: <Shield size={14} />, label: "Microsoft Presidio NER" },
            { icon: <Server size={14} />, label: "Anthropic | OpenAI | Ollama" },
            { icon: <FileText size={14} />, label: "Append-Only Audit Trail" },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "7px", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 500, whiteSpace: "nowrap" }}>
              {icon}{label}
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section aria-label="Key metrics" style={{ maxWidth: "960px", margin: "0 auto", padding: "72px 24px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2px" }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.025)", padding: "28px 24px", textAlign: "center", borderRadius: "4px" }}>
              <div style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.03em", color: s.color, marginBottom: "6px", fontFamily: "var(--font-mono)" }}>{s.value}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <SectionLabel text="The Problem" color="#ff4444" />
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: "16px" }}>
            AI and PII are on a collision course
          </h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "520px", margin: "0 auto", fontSize: "0.95rem", lineHeight: 1.65 }}>
            Financial institutions face compounding pressure to adopt AI — but every unguarded prompt is a potential compliance incident.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {PAIN_POINTS.map(p => <PainCard key={p.title} color={p.color} title={p.title} desc={p.desc} />)}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <SectionLabel text="Capabilities" color="#00d4ff" />
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: "16px" }}>
            Enterprise-grade protection, out of the box
          </h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "520px", margin: "0 auto", fontSize: "0.95rem", lineHeight: 1.65 }}>
            Everything your team needs to safely connect to any LLM without exposing customer data, regulated PII, or financial records.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {FEATURES.map((f, i) => <FeatureCard key={f.title} color={f.color} title={f.title} desc={f.desc} idx={i} />)}
        </div>
        <div style={{ marginTop: "40px", textAlign: "center" }}>
          <Link href="/security" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#00d4ff", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>
            View full security architecture <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── INTEGRATION SNIPPET ── */}
      <section style={{ background: "rgba(255,255,255,0.012)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>
          <div>
            <SectionLabel text="Integration" color="#00d4ff" />
            <h2 style={{ fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: "20px", lineHeight: 1.15 }}>
              One line of config.
              <br />
              <span style={{ background: "linear-gradient(90deg,#00d4ff,#0066ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Everything else is automatic.</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "28px" }}>
              Vaultex is a drop-in proxy. Point your existing SDK at our gateway endpoint and every prompt is automatically tokenized — no code changes, no schema migrations, no training required.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {["Works with every Anthropic, OpenAI, and Ollama SDK", "Processes any language or framework transparently", "Deployable in Docker in under 30 minutes", "REST API for custom integrations"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <CheckCircle size={15} color="#00d4ff" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "rgba(8,12,22,0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", overflow: "hidden" }}>
            <div style={{ padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
              {["#ff4444","#ffb800","#00ff88"].map(c => <span key={c} style={{ width: "9px", height: "9px", borderRadius: "50%", background: c }} />)}
              <span style={{ marginLeft: "8px", fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>integration.py</span>
            </div>
            <pre style={{ margin: 0, padding: "22px 24px", fontSize: "0.82rem", fontFamily: "var(--font-mono)", lineHeight: 1.7, color: "var(--text-secondary)", overflowX: "auto" }}>
              <code>{"# Before Vaultex\nimport anthropic\nclient = anthropic.Anthropic(\n    api_key=\"sk-ant-...\"\n)\n\n# After Vaultex — one change\nclient = anthropic.Anthropic(\n    base_url="}<span style={{ color: "#00ff88" }}>{"\"https://your-gateway-host:8000\""}</span>{",\n    api_key=\"sk-ant-...\"\n)\n\n# Every prompt is now auto-tokenized.\n# Zero code changes beyond base_url."}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ── ANALYTICS PRESERVED ── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "100px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>
          <div>
            <SectionLabel text="Banking Analytics" color="#00ff88" />
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: "20px", lineHeight: 1.15 }}>
              Regulators want privacy.<br />Analysts want numbers.<br />
              <span style={{ background: "linear-gradient(90deg,#00ff88,#00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>You get both.</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.7, marginBottom: "28px" }}>
              Vaultex only masks direct personal identifiers. Financial dimensions — the data your analysts actually need — flow through untouched. Your LLM can compute averages, distributions, and risk clusters without ever seeing a real name or SSN.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {["Average credit score by state: computed from real values", "High-risk loan segmentation: based on actual DPD and risk flags", "Interest rate distribution: exact rates, no tokens", "Portfolio balance totals: real dollar figures, preserved"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <CheckCircle size={15} color="#00ff88" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "rgba(8,12,22,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.06em" }}>
              FIELD CLASSIFICATION — Jane Smith record
            </div>
            {[
              { label: "Balance",        value: "$42,500.00", kept: true },
              { label: "Credit Score",   value: "742",        kept: true },
              { label: "Interest Rate",  value: "4.75%",      kept: true },
              { label: "Days Past Due",  value: "0",          kept: true },
              { label: "Risk Flag",      value: "LOW",        kept: true },
              { label: "Loan Type",      value: "Mortgage",   kept: true },
              { label: "State",          value: "CA",         kept: true },
              { label: "Name",           value: "{{PERSON_1}}", kept: false },
              { label: "SSN",            value: "{{SSN_1}}",    kept: false },
              { label: "Email",          value: "{{EMAIL_1}}", kept: false },
              { label: "Account #",      value: "{{ACCT_1}}",  kept: false },
              { label: "Phone",          value: "{{PHONE_1}}", kept: false },
            ].map((row, i) => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{row.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: row.kept ? "var(--text-primary)" : "#00ff88", fontFamily: "var(--font-mono)" }}>{row.value}</span>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "2px 7px", borderRadius: "100px", background: row.kept ? "rgba(0,255,136,0.1)" : "rgba(255,184,0,0.1)", color: row.kept ? "#00ff88" : "#ffb800", border: "1px solid " + (row.kept ? "rgba(0,255,136,0.2)" : "rgba(255,184,0,0.2)"), letterSpacing: "0.05em" }}>
                    {row.kept ? "REAL" : "MASKED"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: "rgba(255,255,255,0.012)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "100px 24px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <SectionLabel text="How It Works" color="#ffb800" />
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>
              Zero to protected in 3 steps
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "48px" }}>
            {[
              { n: "01", color: "#00d4ff", title: "Connect Your LLM", desc: "Choose Anthropic, OpenAI, or a local Ollama model. Enter your API key — encrypted at rest with Fernet. Point your SDK at the Vaultex base URL. Done in 30 seconds." },
              { n: "02", color: "#00ff88", title: "Chat With Your Data", desc: "Upload a CSV with customer records. The gateway intercepts every prompt, tokenizes PII, and forwards the sanitized version to your chosen LLM. Analytics fields pass through intact." },
              { n: "03", color: "#ffb800", title: "See Role-Filtered Results", desc: "Switch personas live. Watch how a junior analyst sees tokens while a VP sees real names. RBAC enforced at the token layer — no application code changes needed." },
            ].map(step => (
              <div key={step.n}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "3rem", fontWeight: 900, color: step.color + "18", lineHeight: 1, marginBottom: "18px" }}>{step.n}</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: step.color, marginBottom: "12px" }}>{step.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "100px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <SectionLabel text="Why Vaultex" color="#00d4ff" />
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: "14px" }}>
            Purpose-built for banking. Nothing else comes close.
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "480px", margin: "0 auto" }}>
            Generic DLP tools scan files. Vaultex tokenizes live AI prompts — and preserves analytics. That is a different product entirely.
          </p>
        </div>
        <div style={{ background: "rgba(8,12,22,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
            <span>Feature</span>
            <span style={{ color: "#00d4ff", textAlign: "center" }}>Vaultex</span>
            <span style={{ textAlign: "center" }}>DLP Tools</span>
            <span style={{ textAlign: "center" }}>Direct API</span>
            <span style={{ textAlign: "center" }}>Manual</span>
          </div>
          {COMPARE_ROWS.map((row, i) => (
            <div key={row.feature} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "14px 24px", alignItems: "center", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{row.feature}</span>
              <span style={{ textAlign: "center" }}><CompareCell val={row.v} /></span>
              <span style={{ textAlign: "center" }}><CompareCell val={row.dlp} /></span>
              <span style={{ textAlign: "center" }}><CompareCell val={row.direct} /></span>
              <span style={{ textAlign: "center" }}><CompareCell val={row.manual} /></span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: "14px", textAlign: "center", fontSize: "0.73rem", color: "var(--text-muted)" }}>~ = partial / varies by vendor implementation</p>
      </section>

      {/* ── RBAC TABLE ── */}
      <section style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <SectionLabel text="Access Control" color="#00d4ff" />
          <h2 style={{ fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: "12px" }}>Who sees what</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6 }}>Role-Based Decryption — enforced at the token layer, not the application layer.</p>
        </div>
        <div style={{ background: "rgba(8,12,22,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 1fr", padding: "13px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.09em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
            <span>Role</span><span>Real PII</span><span>Entities Visible</span>
          </div>
          {[
            { name: "Junior Analyst", color: "#8899aa", pii: false, entities: "None — all tokens shown" },
            { name: "Senior Analyst", color: "#ffb800", pii: true,  entities: "PERSON, EMAIL" },
            { name: "VP Risk",        color: "#00d4ff", pii: true,  entities: "All personal entities" },
            { name: "Admin",          color: "#00ff88", pii: true,  entities: "Full PII + Audit Console" },
          ].map((role, i) => (
            <div key={role.name} style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 1fr", padding: "17px 24px", alignItems: "center", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)" }}>
              <span style={{ fontWeight: 700, color: role.color, fontSize: "0.92rem" }}>{role.name}</span>
              <span>{role.pii ? <CheckCircle size={16} color="#00ff88" /> : <EyeOff size={16} color="#4a5568" />}</span>
              <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{role.entities}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCT WALKTHROUGH ── */}
      <ProductDemo />

      {/* ── LIVE DEMO ── */}
      <section id="demo" style={{ background: "rgba(255,255,255,0.012)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "100px 24px" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <SectionLabel text="Try It Now" color="#00ff88" />
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: "14px" }}>
              See tokenization in action
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.65 }}>
              Edit the sample text, then click Tokenize. PII is detected client-side in this preview — the real gateway uses Microsoft Presidio NER with 14+ entity types.
            </p>
          </div>
          <div style={{ background: "rgba(8,12,22,0.85)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "16px", overflow: "hidden" }}>
            <div style={{ padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "10px" }}>
              {["#ff4444","#ffb800","#00ff88"].map(c => <span key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />)}
              <span style={{ marginLeft: "6px", fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>vaultex — browser preview</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                <button onClick={resetDemo} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)", borderRadius: "6px", padding: "4px 10px", fontSize: "0.72rem", cursor: "pointer" }}>Reset</button>
                <button onClick={runDemo} style={{ background: "linear-gradient(135deg,#00d4ff,#0066ff)", border: "none", color: "#000", borderRadius: "6px", padding: "4px 14px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Zap size={11} /> Tokenize
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: demoRan ? "1fr 1fr" : "1fr", gap: 0 }}>
              <div style={{ padding: "20px 22px", borderRight: demoRan ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "9px", letterSpacing: "0.06em" }}>INPUT (edit me)</div>
                <textarea value={demoText} onChange={e => { setDemoText(e.target.value); setDemoRan(false); setDemoResult(null); }} style={{ width: "100%", minHeight: "140px", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "12px", fontSize: "0.82rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", resize: "vertical", outline: "none", lineHeight: 1.6 }} />
              </div>
              {demoRan && demoResult && (
                <div style={{ padding: "20px 22px" }}>
                  <div style={{ fontSize: "0.65rem", color: "#00ff88", fontFamily: "var(--font-mono)", marginBottom: "9px", letterSpacing: "0.06em" }}>TOKENIZED OUTPUT</div>
                  <div style={{ minHeight: "140px", background: "rgba(0,255,136,0.02)", border: "1px solid rgba(0,255,136,0.12)", borderRadius: "8px", padding: "12px", fontSize: "0.82rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", lineHeight: 1.6, wordBreak: "break-word" }}>{demoResult.out}</div>
                  {demoResult.hits.length > 0 && (
                    <div style={{ marginTop: "14px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {demoResult.hits.map(h => (
                        <span key={h.token} style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: "5px", padding: "2px 8px", color: "#00ff88" }}>
                          {h.type}: {h.token}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {!demoRan && (
              <div style={{ padding: "14px 22px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
                <button onClick={runDemo} className="btn-primary" style={{ padding: "10px 28px", fontSize: "0.88rem", display: "inline-flex", alignItems: "center", gap: "7px" }}>
                  <Zap size={14} /> Run Tokenization Preview
                </button>
              </div>
            )}
          </div>
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button onClick={() => router.push("/setup")} style={{ background: "none", border: "none", cursor: "pointer", color: "#00d4ff", fontSize: "0.84rem", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
              Connect to the full Presidio NER engine <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ background: "rgba(255,255,255,0.012)", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "100px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <SectionLabel text="Pricing" color="#ffb800" />
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: "16px" }}>
              Start free. Scale with confidence.
            </h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: "520px", margin: "0 auto 12px", fontSize: "0.95rem", lineHeight: 1.65 }}>
              The core tokenization engine is{" "}
              <Link href="https://github.com/sammy995/vaultex-core" target="_blank" rel="noopener noreferrer" style={{ color: "#00d4ff", textDecoration: "none", fontWeight: 600 }}>MIT open-source</Link>
              {" "}and always will be.
            </p>
            <p style={{ color: "var(--text-muted)", maxWidth: "520px", margin: "0 auto", fontSize: "0.83rem", lineHeight: 1.65 }}>
              We earn by selling the features regulated institutions actually need: cloud LLM routing, SOC 2 reports, GLBA evidence packs, SSO, extended retention, and dedicated SLAs. Open source builds trust; enterprise features fund the team.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", alignItems: "start" }}>
            {PRICING.map(plan => <PricingCard key={plan.name} plan={plan} />)}
          </div>
          <p style={{ textAlign: "center", marginTop: "28px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            All plans include end-to-end encryption, RBAC, and audit logging.{" "}
            <Link href="/pricing" style={{ color: "#00d4ff", textDecoration: "none" }}>Compare all features in detail</Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ maxWidth: "720px", margin: "0 auto", padding: "100px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <SectionLabel text="FAQ" color="#00d4ff" />
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)" }}>Questions we get asked</h2>
        </div>
        <div>{FAQ_ITEMS.map(item => <FaqItem key={item.q} q={item.q} a={item.a} />)}</div>
        <div style={{ marginTop: "36px", textAlign: "center" }}>
          <Link href="/compliance" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#00d4ff", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>
            Read our full compliance documentation <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── WAITLIST ── */}
      <section id="waitlist" style={{ background: "rgba(255,255,255,0.012)", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "100px 24px" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(0,255,136,0.07)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: "100px", padding: "6px 16px", fontSize: "0.76rem", fontWeight: 600, color: "#00ff88", marginBottom: "28px" }}>
            <Users size={13} /> Early Access — 3 months free at launch
          </div>
          <SectionLabel text="Early Access" color="#00d4ff" />
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: "16px", lineHeight: 1.1 }}>
            Get notified when<br />Professional launches
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.65, marginBottom: "40px" }}>
            Be first to access multi-LLM routing, 90-day audit retention, and role-based export controls. Early access members receive 3 months free.
          </p>
          {waitStatus === "success" ? (
            <div style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.25)", borderRadius: "14px", padding: "28px" }}>
              <CheckCircle size={36} color="#00ff88" style={{ marginBottom: "14px" }} />
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "#00ff88", marginBottom: "8px" }}>You are on the list!</p>
              <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>{waitMsg}</p>
            </div>
          ) : (
            <form onSubmit={submitWaitlist} style={{ display: "flex", flexDirection: "column", gap: "13px", textAlign: "left" }}>
              <input type="email" required placeholder="Work email address" value={waitEmail} onChange={e => setWaitEmail(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "13px 16px", fontSize: "0.9rem", color: "var(--text-primary)", outline: "none" }} />
              <input type="text" placeholder="Company (optional)" value={waitCompany} onChange={e => setWaitCompany(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "13px 16px", fontSize: "0.9rem", color: "var(--text-primary)", outline: "none" }} />
              <select value={waitRole} onChange={e => setWaitRole(e.target.value)} style={{ width: "100%", background: "rgba(8,12,22,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "13px 16px", fontSize: "0.9rem", color: waitRole ? "var(--text-primary)" : "var(--text-muted)", outline: "none" }}>
                <option value="">Role (optional)</option>
                <option value="CTO/VP Engineering">CTO / VP Engineering</option>
                <option value="Data Privacy Officer">Data Privacy / DPO</option>
                <option value="AI/ML Engineer">AI / ML Engineer</option>
                <option value="Risk/Compliance">Risk / Compliance</option>
                <option value="Product Manager">Product Manager</option>
                <option value="Other">Other</option>
              </select>
              <button type="submit" className="btn-primary" style={{ padding: "14px", fontSize: "0.95rem", fontWeight: 700, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <Mail size={15} /> Join the Waitlist
              </button>
              <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", textAlign: "center", margin: 0 }}>Opens your email client. No spam. One update at launch.</p>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "48px 24px 36px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "32px", marginBottom: "36px" }}>
            <div style={{ maxWidth: "280px" }}>
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", marginBottom: "14px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg,#00d4ff,#0066ff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={14} color="#000" strokeWidth={2.5} />
                </div>
                <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)" }}>Vaultex</span>
              </Link>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                The AI privacy gateway purpose-built for financial services. GLBA, GDPR, and CCPA aligned.
              </p>
            </div>
            <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Product</p>
                {[["Features","#features"],["Demo","#demo"],["Pricing","/pricing"],["Security","/security"]].map(([l,h]) => (
                  <div key={l} style={{ marginBottom: "8px" }}>
                    {h.startsWith("/")
                      ? <Link href={h} style={{ fontSize: "0.82rem", color: "var(--text-muted)", textDecoration: "none" }}>{l}</Link>
                      : <button onClick={() => scrollTo(h.slice(1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", color: "var(--text-muted)", padding: 0 }}>{l}</button>}
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Company</p>
                {[["About","/about"],["Compliance","/compliance"],["Privacy","/privacy"],["Terms","/terms"],["Waitlist","#waitlist"]].map(([l,h]) => (
                  <div key={l} style={{ marginBottom: "8px" }}>
                    {h.startsWith("/")
                      ? <Link href={h} style={{ fontSize: "0.82rem", color: "var(--text-muted)", textDecoration: "none" }}>{l}</Link>
                      : <button onClick={() => scrollTo(h.slice(1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", color: "var(--text-muted)", padding: 0 }}>{l}</button>}
                  </div>
                ))}
                <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>Contact</p>
                  <a href="mailto:hello@vaultex.space" style={{ fontSize: "0.82rem", color: "var(--text-muted)", textDecoration: "none" }}>hello@vaultex.space</a>
                </div>
              </div>
              <div>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Open Source</p>
                <div style={{ marginBottom: "8px" }}>
                  <Link href="https://github.com/sammy995/vaultex-core" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.82rem", color: "var(--text-muted)", textDecoration: "none" }}>GitHub — vaultex-core</Link>
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <Link href="https://github.com/sammy995/vaultex-core/blob/master/README.md" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.82rem", color: "var(--text-muted)", textDecoration: "none" }}>Docs &amp; API Reference</Link>
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <Link href="https://github.com/sammy995/vaultex-core/issues" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.82rem", color: "var(--text-muted)", textDecoration: "none" }}>Report an Issue</Link>
                </div>
              </div>
            </div>
          </div>
          <div style={{ paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>© 2026 Vaultex. AI-Native Reversible Tokenization — GLBA / GDPR Aligned.</span>
            <Link href="https://github.com/sammy995/vaultex-core" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none" }}>MIT License — ⭐ Star on GitHub</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
