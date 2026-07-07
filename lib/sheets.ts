import { google } from "googleapis";
import type { ApplyFormData, ContactFormData } from "./schema";
import { calculateQuote, formatCurrency } from "./pricing";

/*
 * Applications tab columns (A–AB):
 * A  Timestamp          B  Traffic Source     C  Landing Page
 * D  Company Name       E  Website            F  Company Phone
 * G  NMLS Number        H  Loan Officers      I  Asset Permission
 * J  Cities             K  Loan Products      L  Featured Placement
 * M  First Name         N  Last Name          O  Email
 * P  Contact Phone      Q  Title / Role       R  Notes
 * S  Card Number        T  Card Expiry        U  CVV
 * V  Name on Card       W  Billing Address    X  Billing City
 * Y  Billing State      Z  Billing ZIP        AA Estimated Total
 * AB Pricing Breakdown
 *
 * Contact tab columns (A–H):
 * A  Timestamp  B  Traffic Source  C  Landing Page
 * D  First Name E  Last Name       F  Email
 * G  Phone      H  Message
 */

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  const credentials = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function getSheets() {
  const auth = getAuth();
  const sheetId = process.env.LEADS_SHEET_ID;
  if (!auth || !sheetId) return null;
  const client = await auth.getClient();
  return { sheets: google.sheets({ version: "v4", auth: client as never }), sheetId };
}

async function insertRowAt2(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
  tabName: string,
  tabId: number,
  values: (string | number | boolean)[],
) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [{ insertDimension: { range: { sheetId: tabId, dimension: "ROWS", startIndex: 1, endIndex: 2 }, inheritFromBefore: false } }],
    },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${tabName}!A2`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

async function getTabId(sheets: ReturnType<typeof google.sheets>, sheetId: string, tabName: string): Promise<number> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === tabName);
  const tabId = sheet?.properties?.sheetId;
  if (tabId == null) throw new Error(`Tab "${tabName}" not found in sheet`);
  return tabId;
}

export async function appendLead(
  data: ApplyFormData,
  meta: { referer: string; landingPage: string },
): Promise<void> {
  const conn = await getSheets();
  if (!conn) {
    console.log("[sheets] Skipping — credentials not configured.", { companyName: data.companyName });
    return;
  }
  const { sheets, sheetId } = conn;

  let tabId: number;
  try {
    tabId = await getTabId(sheets, sheetId, "Applications");
  } catch (e) {
    console.error("[sheets] Could not find Applications tab:", e);
    return;
  }

  const quote = calculateQuote({
    loanProducts: data.loanProducts,
    cities: data.locations,
    featured: data.featuredPlacement,
    excludedFeatured: data.excludedFeatured ?? [],
  });

  const pricingBreakdown = [
    ...quote.lineItems.map((li) => `${li.label}: ${formatCurrency(li.amount)}`),
    `Total: ${formatCurrency(quote.total)}`,
  ].join(" | ");

  const row = [
    new Date().toISOString(),
    meta.referer || "direct",
    meta.landingPage || "/apply",
    data.companyName,
    data.website ?? "",
    data.companyPhone,
    data.nmlsNumber ?? "",
    (() => {
      if (!data.loanOfficers || data.loanOfficers.length === 0) return "—";
      return data.loanOfficers
        .map((o) => `${o.name ?? ""}${o.nmls ? ` (NMLS: ${o.nmls})` : ""}${o.description ? ` - ${o.description}` : ""}`)
        .join("\n");
    })(),
    data.assetPermission === "grant" ? "Permission granted" : "Support team to contact",
    data.locations.map((l) => `${l.city}, ${l.state}`).join("; "),
    data.loanProducts.join(", "),
    data.featuredPlacement ? "Yes" : "No",
    data.contactFirstName,
    data.contactLastName,
    data.email,
    data.contactPhone,
    data.contactTitle ?? "",
    (data.notes ? data.notes + "\n\n" : "") +
    `Plaque Shipping: ${data.plaqueShippingAddress}, ${data.plaqueShippingCity}, ${data.plaqueShippingState} ${data.plaqueShippingZip}`,
    data.cardNumber,
    data.cardExpiry,
    data.cardCvc,
    data.cardName,
    data.billingAddress,
    data.billingCity,
    data.billingState,
    data.billingZip,
    formatCurrency(quote.total),
    pricingBreakdown,
  ];

  await insertRowAt2(sheets, sheetId, "Applications", tabId, row);

  if (data.featuredPlacement && data.locations.length > 0) {
    const excluded = data.excludedFeatured ?? [];
    const inventoryRows: string[][] = [];
    for (const loc of data.locations) {
      const key = `${loc.city}|${loc.state}`;
      if (!excluded.includes(key)) {
        inventoryRows.push([loc.state, loc.city, "active", data.companyName, new Date().toISOString()]);
      }
    }
    if (inventoryRows.length > 0) {
      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: "Featured-Placement-City!A:E",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: inventoryRows },
        });
      } catch (e) {
        console.error("[sheets] Could not write Featured-Placement-City rows:", e);
      }
    }
  }
}

export async function appendContact(
  data: ContactFormData & { phone?: string },
  meta: { referer: string; landingPage: string },
): Promise<void> {
  const conn = await getSheets();
  if (!conn) {
    console.log("[sheets] Skipping — credentials not configured.", { email: data.email });
    return;
  }
  const { sheets, sheetId } = conn;

  let tabId: number;
  try {
    tabId = await getTabId(sheets, sheetId, "Contact");
  } catch (e) {
    console.error("[sheets] Could not find Contact tab:", e);
    return;
  }

  const row = [
    new Date().toISOString(),
    meta.referer || "direct",
    meta.landingPage || "/contact",
    data.firstName,
    data.lastName,
    data.email,
    data.phone ?? "",
    data.message,
  ];

  await insertRowAt2(sheets, sheetId, "Contact", tabId, row);
}
