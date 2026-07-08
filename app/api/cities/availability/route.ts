import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getCache, setCache } from "@/lib/availabilityCache";

/*
 * Featured Placement on this site is sold per (city, loan product) pair —
 * see lib/config.ts's featuredScope: "city_and_specialty" and
 * lib/pricing.ts's calculateQuote()/computeExcludedFeatured(). The checkout
 * wizard's Step4Upsells therefore queries availability per (city, loan
 * product) slot via `cities` + `areas` JSON params, expecting back
 * { takenSlots: string[] } keyed as "${city}|${loanProductLabel}".
 *
 * Source of truth is the BFF featured_claims API (the directory's real
 * claims). Falls back to the legacy "Featured-Placement-City" Google Sheet
 * when BIG_SWING_BFF_URL is unset or the BFF call fails.
 *
 * KNOWN GAP (same as topinsuranceagents): the BFF's /api/v1/featured-claims
 * endpoint only returns {city, state} — it does not expose which loan
 * product was claimed, even though Featured Placement here is sold per
 * (city, loan product) pair. Until the BFF adds specialty filtering, we
 * conservatively treat any BFF-reported city as taken for *every* requested
 * loan product (never oversells a slot, but may under-sell a still-available
 * product in an already-claimed city).
 */

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  const credentials = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

/** Read taken cities from the BFF featured_claims API; null = unavailable (fall back). */
async function getTakenCitiesFromBff(): Promise<{ city: string; state: string }[] | null> {
  const base = process.env.BIG_SWING_BFF_URL;
  const platformId = process.env.BIG_SWING_PLATFORM_ID;
  if (!base || !platformId) return null;
  try {
    const res = await fetch(
      `${base.replace(/\/+$/, "")}/api/v1/featured-claims?platform_id=${Number(platformId)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.items ?? []).map((i: { city: string; state: string }) => ({
      city: (i.city ?? "").toString().trim(),
      state: (i.state ?? "").toString().trim(),
    }));
  } catch {
    return null;
  }
}

/** Read taken (city, loan product) slots from the Featured-Placement-City sheet tab (fallback). */
async function getTakenSlotsFromSheet(
  cities: { city: string; state: string }[],
  areas: string[],
): Promise<string[]> {
  const auth = getAuth();
  const sheetId = process.env.LEADS_SHEET_ID;
  if (!auth || !sheetId) return [];

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client as never });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Featured-Placement-City!A:F",
    });

    const rows = res.data.values ?? [];
    const takenSlots: string[] = [];

    for (const row of rows.slice(1)) {
      const [rowState, rowCity, rowArea, status] = row as string[];
      if (!rowState || !rowCity || !rowArea || status === "cancelled") continue;
      for (const loc of cities) {
        if (loc.city === rowCity && loc.state === rowState) {
          for (const area of areas) {
            if (area === rowArea) {
              takenSlots.push(`${rowCity}|${area}`);
            }
          }
        }
      }
    }

    return takenSlots;
  } catch (err) {
    console.error("[availability] Sheet read error:", err);
    return [];
  }
}

// GET /api/cities/availability?cities=[{"city":"Denver","state":"CO"}]&areas=["FHA Loans"]
// Returns { takenSlots: string[] } keyed as "${city}|${loanProductLabel}"
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const citiesParam = searchParams.get("cities");
  const areasParam = searchParams.get("areas");

  if (!citiesParam || !areasParam) {
    return NextResponse.json({ takenSlots: [] });
  }

  let cities: { city: string; state: string }[];
  let areas: string[];
  try {
    cities = JSON.parse(citiesParam);
    areas = JSON.parse(areasParam);
  } catch {
    return NextResponse.json({ takenSlots: [] });
  }

  const cacheKey = JSON.stringify({ cities, areas });
  const cached = getCache(cacheKey);
  if (cached !== null) {
    return NextResponse.json({ takenSlots: cached });
  }

  const takenCities = await getTakenCitiesFromBff();

  let takenSlots: string[];
  if (takenCities !== null) {
    // Conservative fallback for the BFF's missing specialty granularity: a
    // taken city blocks every requested loan product in it.
    takenSlots = [];
    for (const loc of cities) {
      const isTaken = takenCities.some((t) => t.city === loc.city && t.state === loc.state);
      if (isTaken) {
        for (const area of areas) takenSlots.push(`${loc.city}|${area}`);
      }
    }
  } else {
    takenSlots = await getTakenSlotsFromSheet(cities, areas);
  }

  const unique = [...new Set(takenSlots)];
  setCache(cacheKey, unique);
  return NextResponse.json({ takenSlots: unique });
}
