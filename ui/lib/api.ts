import { GATEWAY_URL } from "./session";

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

export interface SessionConfig {
  provider: "anthropic" | "openai" | "ollama";
  model: string;
  api_key?: string;
  ollama_url?: string;
}

export interface EntityFound {
  entity_type: string;
  token: string;
  start: number;
  end: number;
}

export interface ChatMeta {
  tokenized_messages: { role: string; content: string }[];
  entities_found: EntityFound[];
  role: string;
  entities_allowed: string[];
}

export interface ChatResponse {
  id: string;
  model: string;
  choices: { index: number; message: { role: string; content: string }; finish_reason: string }[];
  _meta: ChatMeta;
}

export async function configureSession(cfg: SessionConfig): Promise<string> {
  const res = await fetch(`${GATEWAY_URL}/api/session/configure`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gateway error: ${err}`);
  }
  const data = await res.json();
  return data.session_id;
}

export async function listOllamaModels(ollamaUrl: string): Promise<OllamaModel[]> {
  // Path 1: via the local gateway (works when docker-compose is running)
  try {
    const url = new URL(`${GATEWAY_URL}/api/session/models`);
    url.searchParams.set("provider", "ollama");
    url.searchParams.set("ollama_url", ollamaUrl);
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      return data.models as OllamaModel[];
    }
  } catch {
    // fall through to direct path
  }

  // Path 2: query Ollama directly from the browser (no gateway needed).
  // Requires Ollama with CORS enabled:
  //   Windows/Mac: set OLLAMA_ORIGINS=* before starting Ollama
  //   Linux:       OLLAMA_ORIGINS=* ollama serve
  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return ((data.models ?? []) as Array<{ name: string; size: number; modified_at: string }>).map(m => ({
      name: m.name,
      size: m.size,
      modified_at: m.modified_at,
    }));
  } catch (err) {
    throw new Error(
      `Cannot reach Ollama at ${ollamaUrl}.\n` +
      `Gateway path: make sure docker-compose is running.\n` +
      `Direct path: start Ollama with OLLAMA_ORIGINS=* (see setup guide).`
    );
  }
}

export async function sendChat(
  sessionId: string,
  jwt: string,
  messages: { role: string; content: string }[]
): Promise<ChatResponse> {
  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-ID": sessionId,
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gateway error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${GATEWAY_URL}/health`, { signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function loginAs(role: string): Promise<{ token: string; expires_in: number }> {
  const res = await fetch(`${GATEWAY_URL}/api/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, subject: "ui-user" }),
  });
  if (!res.ok) throw new Error(`Auth error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Audit log (admin only)
// ---------------------------------------------------------------------------

export interface AuditEntry {
  id: string;
  timestamp: string;
  event_type: string;
  correlation_id: string;
  session_id: string | null;
  role: string | null;
  details: Record<string, unknown>;
}

export async function getAuditLogs(
  jwt: string,
  date?: string,
  limit = 200
): Promise<{ logs: AuditEntry[]; count: number; date: string }> {
  const url = new URL(`${GATEWAY_URL}/api/audit/logs`);
  if (date) url.searchParams.set("date", date);
  url.searchParams.set("limit", String(limit));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(`Audit log error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// User auth (real DB — /api/users/*)
// ---------------------------------------------------------------------------

export interface UserAuthResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  token: string;
  expires_in: number;
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
  role: string
): Promise<UserAuthResponse> {
  const res = await fetch(`${GATEWAY_URL}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password, role }),
  });
  if (!res.ok) throw new Error(`Registration failed: ${await res.text()}`);
  return res.json();
}

export async function loginUser(
  email: string,
  password: string
): Promise<UserAuthResponse> {
  const res = await fetch(`${GATEWAY_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${await res.text()}`);
  return res.json();
}
