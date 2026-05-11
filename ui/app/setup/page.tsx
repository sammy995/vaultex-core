"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Zap,
  Server,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Terminal,
  Info,
  ExternalLink,
  Lock,
} from "lucide-react";
import { configureSession, listOllamaModels, healthCheck, OllamaModel } from "@/lib/api";
import { setSessionId, initSession } from "@/lib/session";
import ProductGuide from "@/components/ProductGuide";

type Provider = "anthropic" | "openai" | "ollama";

const PROVIDERS = [
  {
    id: "anthropic" as Provider,
    name: "Anthropic",
    subtitle: "Claude models — cloud, PII-stripped",
    icon: <Shield size={28} />,
    description: "The gateway tokenizes all PII before the request leaves your machine. Anthropic's API only ever receives {{PERSON_1}}-style tokens — never raw names, SSNs, or emails.",
    caveat: "Prompts travel to Anthropic's cloud (tokenized). Requires Pro plan for production use.",
    defaultModel: "claude-sonnet-4-5",
    requiresKey: true,
    keyLabel: "Anthropic API Key",
    keyPlaceholder: "sk-ant-...",
    proOnly: true,
  },
  {
    id: "openai" as Provider,
    name: "OpenAI",
    subtitle: "GPT models — cloud, PII-stripped",
    icon: <Zap size={28} />,
    description: "Same intercept model as Anthropic — Presidio NER strips PII locally, then the tokenized prompt is forwarded to OpenAI. GPT never sees a single real identifier.",
    caveat: "Prompts travel to OpenAI's cloud (tokenized). Requires Pro plan for production use.",
    defaultModel: "gpt-4o",
    requiresKey: true,
    keyLabel: "OpenAI API Key",
    keyPlaceholder: "sk-...",
    proOnly: true,
  },
  {
    id: "ollama" as Provider,
    name: "Ollama",
    subtitle: "Local models — zero cloud egress",
    icon: <Server size={28} />,
    description: "Everything runs on your own hardware. Zero API cost, zero cloud egress, zero data ever leaves your network. Strongest compliance posture. Included in the free Starter tier.",
    caveat: "",
    defaultModel: "",
    requiresKey: false,
    keyLabel: "",
    keyPlaceholder: "",
    proOnly: false,
  },
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [configuring, setConfiguring] = useState(false);
  const [error, setError] = useState("");

  const selectedProvider = PROVIDERS.find((p) => p.id === provider);
  const [gatewayNotLocal, setGatewayNotLocal] = useState(false);

  // Detect if the user is visiting from a non-localhost origin
  useEffect(() => {
    if (typeof window !== "undefined") {
      const h = window.location.hostname;
      setGatewayNotLocal(h !== "localhost" && h !== "127.0.0.1");
    }
  }, []);

  // When provider is selected, set the default model
  useEffect(() => {
    if (selectedProvider) {
      setModel(selectedProvider.defaultModel || "");
    }
  }, [provider]);

  // Fetch Ollama models when user switches to Ollama provider or URL changes
  async function fetchOllamaModels() {
    setLoadingModels(true);
    setModelError("");
    try {
      const models = await listOllamaModels(ollamaUrl);
      setOllamaModels(models);
      if (models.length > 0 && !model) {
        setModel(models[0].name);
      }
    } catch (e: unknown) {
      setModelError(String(e));
    } finally {
      setLoadingModels(false);
    }
  }

  useEffect(() => {
    if (provider === "ollama" && step === 2) {
      fetchOllamaModels();
    }
  }, [provider, step]);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const ok = await healthCheck();
    setTestResult(ok ? "ok" : "fail");
    setTesting(false);
  }

  async function handleFinish() {
    if (!provider || !model) return;
    setConfiguring(true);
    setError("");
    try {
      const sessionId = await configureSession({
        provider,
        model,
        api_key: apiKey || undefined,
        ollama_url: provider === "ollama" ? ollamaUrl : undefined,
      });
      setSessionId(sessionId);
      await initSession("junior_analyst");
      router.push("/chat");
    } catch (e: unknown) {
      setError(String(e));
      setConfiguring(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--bg-base)",
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,212,255,0.08) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: "640px", position: "relative" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "var(--color-primary-dim)",
              border: "1px solid var(--border-primary)",
              borderRadius: "100px",
              padding: "6px 16px",
              marginBottom: "20px",
            }}
          >
            <Shield size={14} style={{ color: "var(--color-primary)" }} />
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--color-primary)",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              PII Tokenization Gateway
            </span>
          </div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "0 0 8px",
              lineHeight: 1.2,
            }}
          >
            Connect your LLM
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.95rem" }}>
            All PII is tokenized locally before it reaches any model provider.
          </p>
        </div>

        {/* ── Banner: visiting from Vercel / non-localhost ── */}
        {gatewayNotLocal && (
          <div style={{
            background: "rgba(0,212,255,0.06)",
            border: "1px solid rgba(0,212,255,0.25)",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "28px",
            display: "flex",
            gap: "14px",
            alignItems: "flex-start",
          }}>
            <Info size={16} style={{ color: "#00d4ff", marginTop: "2px", flexShrink: 0 }} />
            <div style={{ fontSize: "0.83rem", lineHeight: 1.65 }}>
              <div style={{ fontWeight: 700, color: "#00d4ff", marginBottom: "6px" }}>
                You are visiting from the hosted site — the gateway must run on your machine
              </div>
              <div style={{ color: "var(--text-secondary)", marginBottom: "10px" }}>
                Vaultex tokenizes data <em>locally</em> — the Python gateway and Redis run in Docker on your own machine.
                The UI (this page) just talks to <code style={{ color: "#00d4ff", fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>http://localhost:8000</code>.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {[
                  { n: "1", cmd: "git clone https://github.com/sammy995/vaultex-core && cd vaultex-core", label: "Clone the repo" },
                  { n: "2", cmd: "docker-compose up -d", label: "Start gateway + Redis" },
                  { n: "3", cmd: "cd ui && npm install && npm run dev", label: "Run UI locally at localhost:3000" },
                ].map(row => (
                  <div key={row.n} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{
                      width: "18px", height: "18px", borderRadius: "50%",
                      background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.65rem", fontWeight: 800, color: "#00d4ff", flexShrink: 0,
                    }}>{row.n}</span>
                    <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "rgba(226,232,240,0.75)" }}>{row.cmd}</code>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>— {row.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step indicators */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "32px",
          }}
        >
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  background:
                    step >= s ? "var(--color-primary)" : "var(--bg-surface)",
                  color: step >= s ? "#000" : "var(--text-muted)",
                  border:
                    step >= s
                      ? "none"
                      : "1px solid var(--border-subtle)",
                  transition: "all var(--transition-base)",
                  boxShadow:
                    step === s ? "0 0 16px var(--color-primary-glow)" : "none",
                }}
              >
                {step > s ? <CheckCircle size={14} /> : s}
              </div>
              {s < 3 && (
                <div
                  style={{
                    width: "40px",
                    height: "1px",
                    background:
                      step > s
                        ? "var(--color-primary)"
                        : "var(--border-subtle)",
                    transition: "background var(--transition-base)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Provider selection */}
        {step === 1 && (
          <div>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: "16px",
                fontSize: "0.85rem",
                textAlign: "center",
              }}
            >
              Step 1 — Choose your LLM provider
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  disabled={p.proOnly}
                  onClick={() => !p.proOnly && setProvider(p.id)}
                  style={{
                    background:
                      provider === p.id
                        ? "var(--color-primary-dim)"
                        : "var(--bg-glass)",
                    backdropFilter: "blur(20px)",
                    border:
                      provider === p.id
                        ? "1px solid var(--color-primary)"
                        : p.proOnly
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid var(--border-subtle)",
                    borderRadius: "12px",
                    padding: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    cursor: p.proOnly ? "not-allowed" : "pointer",
                    textAlign: "left",
                    transition: "all var(--transition-base)",
                    boxShadow:
                      provider === p.id
                        ? "0 0 24px var(--color-primary-glow)"
                        : "none",
                    width: "100%",
                    opacity: p.proOnly ? 0.45 : 1,
                  }}
                >
                  <div
                    style={{
                      color:
                        provider === p.id
                          ? "var(--color-primary)"
                          : "var(--text-secondary)",
                      transition: "color var(--transition-base)",
                      flexShrink: 0,
                    }}
                  >
                    {p.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "var(--text-primary)",
                        marginBottom: "2px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      {p.name}
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          fontWeight: 400,
                        }}
                      >
                        {p.subtitle}
                      </span>
                      {p.proOnly && (
                        <span style={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          background: "rgba(255,184,0,0.15)",
                          border: "1px solid rgba(255,184,0,0.35)",
                          color: "#ffb800",
                          borderRadius: "4px",
                          padding: "2px 7px",
                        }}>Pro</span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.83rem", color: "var(--text-secondary)" }}>
                      {p.description}
                    </div>
                    {p.caveat && (
                      <div style={{ marginTop: "7px", fontSize: "0.74rem", color: "#ffb800", display: "flex", alignItems: "center", gap: "5px" }}>
                        <span style={{ fontSize: "0.7rem" }}>⚠</span> {p.caveat}
                      </div>
                    )}
                  </div>
                  {p.proOnly
                    ? <Lock size={16} style={{ color: "rgba(255,184,0,0.6)", flexShrink: 0 }} />
                    : provider === p.id && (
                        <CheckCircle size={18} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                      )
                  }
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button
                className="btn-primary"
                disabled={!provider}
                onClick={() => setStep(2)}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Credentials / Model */}
        {step === 2 && selectedProvider && (
          <div>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: "16px",
                fontSize: "0.85rem",
                textAlign: "center",
              }}
            >
              Step 2 — Configure {selectedProvider.name}
            </p>
            <div className="glass-card" style={{ padding: "24px" }}>
              {selectedProvider.requiresKey && (
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      marginBottom: "8px",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {selectedProvider.keyLabel}
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={selectedProvider.keyPlaceholder}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.85rem",
                      outline: "none",
                      transition: "border-color var(--transition-base)",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "var(--color-primary)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--border-subtle)")
                    }
                  />
                </div>
              )}

              {/* Ollama URL */}
              {provider === "ollama" && (
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      marginBottom: "8px",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    Ollama URL
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.85rem",
                        outline: "none",
                      }}
                    />
                    <button
                      className="btn-ghost"
                      onClick={fetchOllamaModels}
                      style={{ whiteSpace: "nowrap", padding: "10px 14px" }}
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              )}

              {/* Model selection */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    marginBottom: "8px",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Model
                </label>
                {provider === "ollama" ? (
                  loadingModels ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "var(--text-muted)",
                        fontSize: "0.85rem",
                        padding: "10px 0",
                      }}
                    >
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      Fetching models from Ollama...
                    </div>
                  ) : modelError ? (
                    <div>
                      {/* Step-by-step Ollama help panel */}
                      <div style={{
                        background: "rgba(255,107,107,0.06)",
                        border: "1px solid rgba(255,107,107,0.2)",
                        borderRadius: "10px",
                        padding: "14px 16px",
                        marginBottom: "14px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
                          <Terminal size={13} style={{ color: "#ff6b6b" }} />
                          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#ff6b6b" }}>Cannot list Ollama models — try one of these fixes:</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.78rem" }}>
                          <div style={{ color: "var(--text-secondary)" }}>
                            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Option A — Run UI locally</span> (recommended)
                            <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "3px" }}>
                              {["docker-compose up -d", "cd ui && npm run dev"].map(cmd => (
                                <code key={cmd} style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "#00d4ff", background: "rgba(0,212,255,0.07)", borderRadius: "4px", padding: "2px 7px", display: "block" }}>{cmd}</code>
                              ))}
                            </div>
                          </div>
                          <div style={{ color: "var(--text-secondary)" }}>
                            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Option B — Allow direct browser access</span> (no gateway needed)
                            <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "3px" }}>
                              <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "#00ff88", background: "rgba(0,255,136,0.07)", borderRadius: "4px", padding: "2px 7px", display: "block" }}>OLLAMA_ORIGINS=* ollama serve</code>
                              <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>Then click Refresh — your models will appear without needing the gateway.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Or type model name manually</label>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. llama3.2:3b, qwen3:4b, phi4:latest"
                        style={{
                          width: "100%",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "8px",
                          padding: "10px 14px",
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.85rem",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  ) : (
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      style={{
                        width: "100%",
                        background: "rgba(10,14,26,0.9)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.85rem",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      {ollamaModels.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  )
                ) : (
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.85rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </div>
            </div>

            {/* Ollama legal disclaimer */}
            {provider === "ollama" && (
              <div style={{
                background: "rgba(255,184,0,0.05)",
                border: "1px solid rgba(255,184,0,0.2)",
                borderRadius: "10px",
                padding: "14px 16px",
                marginTop: "20px",
                fontSize: "0.76rem",
                color: "var(--text-muted)",
                lineHeight: 1.65,
              }}>
                <div style={{ fontWeight: 700, color: "#ffb800", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.7rem" }}>⚠</span> Important — Your Responsibility
                </div>
                Vaultex tokenizes PII locally using Microsoft Presidio before any data reaches your Ollama instance.
                The token vault and all decrypted values remain on your own machine.{" "}
                <strong style={{ color: "var(--text-secondary)" }}>You are solely responsible</strong>{" "}
                for securing your local infrastructure, enforcing data governance policies, and ensuring compliance
                with applicable laws (GLBA, GDPR, HIPAA, CCPA, etc.) in your jurisdiction.
                Vaultex is provided as-is, without warranties of any kind. It is not a substitute for qualified legal
                or compliance counsel. By proceeding you acknowledge that you have read and accepted our{" "}
                <a href="/terms" style={{ color: "#ffb800", textDecoration: "underline" }}>Terms of Use</a>.
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
              <button
                className="btn-ghost"
                onClick={() => setStep(1)}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                className="btn-primary"
                disabled={!model || (selectedProvider.requiresKey && !apiKey)}
                onClick={() => setStep(3)}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Test + Launch */}
        {step === 3 && (
          <div>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: "16px",
                fontSize: "0.85rem",
                textAlign: "center",
              }}
            >
              Step 3 — Verify gateway connection
            </p>
            <div className="glass-card" style={{ padding: "28px", textAlign: "center" }}>
              <div style={{ marginBottom: "20px" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 4px" }}>
                  Provider
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-primary)",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  {provider} / {model}
                </p>
              </div>
              <div className="glow-divider" style={{ margin: "20px 0" }} />
              <button
                className="btn-ghost"
                onClick={handleTest}
                disabled={testing}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "20px",
                }}
              >
                {testing ? (
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Zap size={16} />
                )}
                Ping Gateway
              </button>

              {testResult === "ok" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    color: "var(--color-safe)",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    margin: "0 0 20px",
                  }}
                >
                  <CheckCircle size={18} /> Gateway reachable — ready to go
                </div>
              )}
              {testResult === "fail" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    color: "var(--color-danger)",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    margin: "0 0 8px",
                  }}
                >
                  <XCircle size={18} /> Gateway unreachable — is it running?
                </div>
              )}
              {testResult === "fail" && (
                <div style={{
                  background: "rgba(255,107,107,0.06)",
                  border: "1px solid rgba(255,107,107,0.18)",
                  borderRadius: "10px",
                  padding: "14px 18px",
                  margin: "0 0 20px",
                  textAlign: "left",
                  fontSize: "0.8rem",
                }}>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "7px" }}>
                    <Terminal size={13} style={{ color: "#ff6b6b" }} /> How to start the gateway
                  </div>
                  {[
                    { cmd: "git clone https://github.com/your-org/vaultex", note: "Clone repo" },
                    { cmd: "cd vaultex", note: "" },
                    { cmd: "docker-compose up -d", note: "Starts gateway on :8000 + Redis" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                      <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem", color: "#00d4ff", background: "rgba(0,212,255,0.07)", borderRadius: "4px", padding: "2px 8px", flex: 1 }}>{r.cmd}</code>
                      {r.note && <span style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>— {r.note}</span>}
                    </div>
                  ))}
                  <div style={{ marginTop: "10px", color: "var(--text-muted)", fontSize: "0.76rem" }}>
                    Then click <strong style={{ color: "var(--text-secondary)" }}>Ping Gateway</strong> again. If still failing, check <code style={{ fontFamily: "var(--font-mono)", color: "#00d4ff" }}>docker ps</code> to confirm both containers are healthy.
                  </div>
                </div>
              )}

              {error && (
                <p style={{ color: "var(--color-danger)", fontSize: "0.85rem", marginBottom: "16px" }}>
                  {error}
                </p>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
              <button
                className="btn-ghost"
                onClick={() => setStep(2)}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                className="btn-primary"
                disabled={configuring}
                onClick={handleFinish}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {configuring ? (
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Shield size={16} />
                )}
                Launch Gateway
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <ProductGuide />
    </div>
  );
}
