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
 * (This route previously only supported a single city/state pair and
 * returned a flat { taken: boolean } — a leftover from the old single-page
 * ApplyForm's per-city-only featured model. That contract can't express
 * per-loan-product availability, so it's replaced here to match the rest of
 * this site's per-slot model.)
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

/** Read taken (city, loan product) slots from the Featured-Placement-City sheet tab. */
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

  const takenSlots = await getTakenSlotsFromSheet(cities, areas);
  const unique = [...new Set(takenSlots)];
  setCache(cacheKey, unique);
  return NextResponse.json({ takenSlots: unique });
}
