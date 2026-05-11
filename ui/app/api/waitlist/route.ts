import { NextRequest, NextResponse } from "next/server";

interface WaitlistEntry {
  email: string;
  company: string;
  role: string;
  timestamp: string;
}

// Email notification is sent to hello@vaultex.space via the Resend API.
// Set the RESEND_API_KEY environment variable in Vercel project settings.
// Get a free key (100 emails/day) at https://resend.com
//
// Optional: also set WAITLIST_WEBHOOK_URL to forward entries to any
// additional webhook (Zapier, Make, n8n, Airtable, Formspree, etc.)

async function sendEmailNotification(entry: WaitlistEntry): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // Skip silently if key not configured

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; background: #0a0f1e; color: #e2e8f0; padding: 32px; border-radius: 12px;">
      <h2 style="color: #00d4ff; margin-top: 0;">New Vaultex Waitlist Signup</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #94a3b8; width: 90px;">Email</td><td style="padding: 8px 0; font-weight: 600;">${entry.email}</td></tr>
        ${entry.company ? `<tr><td style="padding: 8px 0; color: #94a3b8;">Company</td><td style="padding: 8px 0;">${entry.company}</td></tr>` : ""}
        ${entry.role ? `<tr><td style="padding: 8px 0; color: #94a3b8;">Role</td><td style="padding: 8px 0;">${entry.role}</td></tr>` : ""}
        <tr><td style="padding: 8px 0; color: #94a3b8;">Time</td><td style="padding: 8px 0; font-size: 0.85em;">${entry.timestamp}</td></tr>
      </table>
      <p style="margin-top: 24px; font-size: 0.8em; color: #64748b;">Sent by Vaultex waitlist API · vaultex.space</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Vaultex Waitlist <waitlist@vaultex.space>",
      to: ["hello@vaultex.space"],
      subject: `New waitlist signup: ${entry.email}${entry.company ? ` (${entry.company})` : ""}`,
      html,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "unknown");
    console.error("[WAITLIST] Resend email failed:", response.status, err);
  }
}

export async function POST(req: NextRequest) {
  let body: { email?: string; company?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email || !email.includes("@") || !email.includes(".")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const entry: WaitlistEntry = {
    email,
    company: (body.company || "").trim(),
    role: (body.role || "").trim(),
    timestamp: new Date().toISOString(),
  };

  // Always log (visible in Vercel function logs)
  console.log("[WAITLIST]", JSON.stringify(entry));

  // Send email notification to hello@vaultex.space via Resend
  await sendEmailNotification(entry).catch(err =>
    console.error("[WAITLIST] Email notification error:", err)
  );

  // Also forward to optional webhook if configured
  const webhookUrl = process.env.WAITLIST_WEBHOOK_URL;
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    }).catch(err => console.error("[WAITLIST] Webhook forward failed:", err));
  }

  return NextResponse.json({
    message: "You are on the list! We will notify you at launch with 3 months free access.",
  });
}

export async function GET() {
  // Placeholder — returns 0 when no persistent store is configured.
  // Set WAITLIST_WEBHOOK_URL to a service that tracks counts if needed.
  return NextResponse.json({ count: 0 });
}
