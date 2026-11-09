// Shared Google Sheets helper (service-account auth). Server-only.
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

// spreadsheetId defaults to GOOGLE_SHEET_ID (the newsletter spreadsheet)
function getDoc(spreadsheetId?: string) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const sheetId = spreadsheetId?.trim() || process.env.GOOGLE_SHEET_ID?.trim();
  // Tolerate the usual ways the key gets pasted into Vercel: wrapped in
  // quotes, with literal "\n" sequences, or with Windows line endings.
  const key = process.env.GOOGLE_PRIVATE_KEY?.trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "");

  if (!email || !key || !sheetId) {
    const missing = [
      !email && "GOOGLE_SERVICE_ACCOUNT_EMAIL",
      !key && "GOOGLE_PRIVATE_KEY",
      !sheetId && "GOOGLE_SHEET_ID",
    ].filter(Boolean);
    throw new Error(`Missing Google Sheets env vars: ${missing.join(", ")}`);
  }

  const auth = new JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return new GoogleSpreadsheet(sheetId, auth);
}

// Returns a sheet tab by title (or the first tab when no title is given),
// creating the tab and its header row when missing.
export async function getSheet(headers: string[], tabTitle?: string, spreadsheetId?: string) {
  const doc = getDoc(spreadsheetId);
  await doc.loadInfo();

  let sheet = tabTitle ? doc.sheetsByTitle[tabTitle] : doc.sheetsByIndex[0];
  if (!sheet && tabTitle) {
    sheet = await doc.addSheet({ title: tabTitle, headerValues: headers });
  }

  try {
    await sheet.loadHeaderRow();
  } catch {
    // loadHeaderRow throws on a completely empty sheet
  }

  if (!sheet.headerValues || sheet.headerValues.length === 0) {
    await sheet.setHeaderRow(headers);
  }

  return sheet;
}

export async function appendRow(
  headers: string[],
  row: Record<string, string | number>,
  tabTitle?: string,
  spreadsheetId?: string
) {
  const sheet = await getSheet(headers, tabTitle, spreadsheetId);
  await sheet.addRow(row);
}
