import { NextRequest, NextResponse } from "next/server";
import { applySchema, contactSchema } from "@/lib/schema";
import { appendLead, appendContact } from "@/lib/sheets";
import { sendLeadEmail, sendContactEmail } from "@/lib/email";
import { sendApplyToBff, sendContactToBff } from "@/lib/bff";
import { clearCache } from "@/lib/availabilityCache";

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 5;
const ipCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const meta = {
    referer: req.headers.get("x-traffic-source") ?? req.headers.get("referer") ?? "",
    landingPage: req.headers.get("x-landing-page") ?? "/",
  };

  const type = (body as { type?: string }).type;

  if (type === "contact") {
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid submission.", details: result.error.flatten() },
        { status: 422 },
      );
    }
    const data = result.data;
    if (data._honeypot) {
      return NextResponse.json({ ok: true });
    }
    // The BFF owns persistence: it writes the contact to Postgres AND mirrors the
    // row to the platform's Google Sheet Contact tab (resolved from platform_id).
    // Awaited + fail-open so it reliably sends but never 500s the visitor.
    try {
      await sendContactToBff(data, meta);
    } catch (e) {
      console.error("[bff] contact submission failed:", e);
    }
    await Promise.allSettled([
      appendContact(data, meta),
      sendContactEmail(data, meta),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (type === "apply") {
    const result = applySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid submission.", details: result.error.flatten() },
        { status: 422 },
      );
    }
    const data = result.data;
    if (data._honeypot) {
      return NextResponse.json({ ok: true });
    }
    // The BFF owns persistence now: it writes the deal to Postgres AND mirrors the
    // row to the platform's Google Sheet (resolved from platform_id). Awaited +
    // fail-open so it reliably sends but never 500s the applicant.
    try {
      await sendApplyToBff(data, meta);
    } catch (e) {
      console.error("[bff] apply submission failed:", e);
    }
    await Promise.allSettled([
      appendLead(data, meta),
      sendLeadEmail(data, meta),
    ]);
    if (data.featuredPlacement) {
      clearCache();
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown submission type." }, { status: 400 });
}
