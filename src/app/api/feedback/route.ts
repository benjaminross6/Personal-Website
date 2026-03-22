import { NextResponse } from "next/server";
import { Resend } from "resend";

import { site } from "@/lib/site";

export const runtime = "nodejs";

type Body = {
  message?: string;
  pathname?: string;
  /** Honeypot — must be empty */
  website?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot: bots often fill hidden fields
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Feedback is not configured (missing RESEND_API_KEY)." },
      { status: 503 },
    );
  }

  const raw = typeof body.message === "string" ? body.message.trim() : "";
  if (!raw || raw.length > 8000) {
    return NextResponse.json({ error: "Message is required (max 8000 chars)." }, { status: 400 });
  }

  const pathname =
    typeof body.pathname === "string" ? body.pathname.slice(0, 500) : "";
  const pathLabel = pathname || "(unknown)";

  const to =
    process.env.FEEDBACK_TO_EMAIL?.trim() || site.email?.trim() || "";
  if (!to) {
    return NextResponse.json(
      { error: "No recipient email (set site.email or FEEDBACK_TO_EMAIL)." },
      { status: 503 },
    );
  }

  const from =
    process.env.FEEDBACK_FROM?.trim() ||
    "Portfolio feedback <onboarding@resend.dev>";

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: `[Site feedback] ${pathLabel}`,
    text: `Page path: ${pathLabel}\n\n---\n\n${raw}`,
  });

  if (error) {
    console.error("[feedback]", error);
    return NextResponse.json({ error: "Could not send email." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
