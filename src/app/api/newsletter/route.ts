import { NextResponse } from "next/server";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { sendNewsletterWelcome } from "@/src/app/actions/email";

const DISCOUNT_CODE = process.env.NEWSLETTER_DISCOUNT_CODE?.trim() || "THESOUND";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const birthday = String(body.birthday || "").trim();
    const source = String(body.source || "").trim();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      !process.env.GOOGLE_PRIVATE_KEY ||
      !process.env.GOOGLE_SHEET_ID
    ) {
      console.error("❌ Newsletter: missing Google Sheets env vars");
      return NextResponse.json(
        { success: false, error: "Sign up is unavailable right now. Please try again later." },
        { status: 500 }
      );
    }

    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    try {
      await sheet.loadHeaderRow();
    } catch {
      // loadHeaderRow throws on a completely empty sheet
    }

    if (!sheet.headerValues || sheet.headerValues.length === 0) {
      await sheet.setHeaderRow([
        "Name",
        "Email",
        "Birthday",
        "Source",
        "Discount Code",
        "Created At",
      ]);
    }

    const existing = await sheet.getRows();
    const alreadyExists = existing.some(
      (row: any) => String(row.get("Email") || "").trim().toLowerCase() === email
    );

    if (alreadyExists) {
      return NextResponse.json({ success: true, code: DISCOUNT_CODE, existing: true });
    }

    await sheet.addRow({
      Name: name,
      Email: email,
      Birthday: birthday,
      Source: source,
      "Discount Code": DISCOUNT_CODE,
      "Created At": new Date().toISOString(),
    });

    // Email failure shouldn't block the sign up — the code is shown on screen too
    await sendNewsletterWelcome({ name, email, code: DISCOUNT_CODE });

    return NextResponse.json({ success: true, code: DISCOUNT_CODE });
  } catch (error: any) {
    console.error("❌ NEWSLETTER ERROR:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
