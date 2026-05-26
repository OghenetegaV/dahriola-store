import { NextResponse } from "next/server";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, birthday, source } = body;

    // Step 1: Check env vars are loaded
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      console.error("❌ Missing GOOGLE_SERVICE_ACCOUNT_EMAIL");
      return NextResponse.json({ success: false, error: "Missing service account email" }, { status: 500 });
    }
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      console.error("❌ Missing GOOGLE_PRIVATE_KEY");
      return NextResponse.json({ success: false, error: "Missing private key" }, { status: 500 });
    }
    if (!process.env.GOOGLE_SHEET_ID) {
      console.error("❌ Missing GOOGLE_SHEET_ID");
      return NextResponse.json({ success: false, error: "Missing sheet ID" }, { status: 500 });
    }

    console.log("✅ Env vars loaded");
    console.log("📧 Service account:", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log("📄 Sheet ID:", process.env.GOOGLE_SHEET_ID);

    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);

    console.log("🔐 Attempting to load sheet...");
    await doc.loadInfo();
    console.log("✅ Sheet loaded:", doc.title);

    const sheet = doc.sheetsByIndex[0];
    console.log("📋 Using sheet:", sheet.title);

    await sheet.loadHeaderRow();

    if (!sheet.headerValues || sheet.headerValues.length === 0) {
      console.log("⚠️ No headers found, setting them now...");
      await sheet.setHeaderRow([
        "Name",
        "Email",
        "Birthday",
        "Source",
        "Discount Code",
        "Created At",
      ]);
      await sheet.loadHeaderRow();
    }

    console.log("📝 Headers:", sheet.headerValues);

    const existing = await sheet.getRows();
    const alreadyExists = existing.some(
      (row: any) =>
        row.get("Email")?.toLowerCase() === email.toLowerCase()
    );

    if (alreadyExists) {
      console.log("ℹ️ Email already exists, returning existing code");
      return NextResponse.json({ success: true, code: "THESOUND" });
    }

    await sheet.addRow({
      Name: name,
      Email: email,
      Birthday: birthday,
      Source: source,
      "Discount Code": "THESOUND",
      "Created At": new Date().toISOString(),
    });

    console.log("✅ Row added successfully for:", email);

    return NextResponse.json({ success: true, code: "THESOUND" });

  } catch (error: any) {
    console.error("❌ NEWSLETTER ERROR:", error?.message || error);
    console.error("Full error:", JSON.stringify(error, null, 2));
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}