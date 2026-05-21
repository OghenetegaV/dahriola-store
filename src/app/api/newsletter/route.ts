import { NextResponse } from "next/server";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

const auth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  ),
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
  ],
});

const doc = new GoogleSpreadsheet(
  process.env.GOOGLE_SHEET_ID!,
  auth
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      birthday,
      source,
    } = body;

    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];

    try {
      await sheet.loadHeaderRow();
    } catch {
      await sheet.setHeaderRow([
        "Name",
        "Email",
        "Birthday",
        "Source",
        "Created At",
      ]);
    }

    const existing = await sheet.getRows();

    const emailExists = existing.some(
      (row) =>
        String(row.get("Email"))
          .trim()
          .toLowerCase() ===
        email.trim().toLowerCase()
    );

    if (emailExists) {
      return NextResponse.json({
        success: true,
        alreadySubscribed: true,
        discountCode: null,
      });
    }

    await sheet.addRow({
      Name: name,
      Email: email,
      Birthday: birthday,
      Source: source,
      "Created At":
        new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,

      // EXISTING SANITY CODE
      discountCode: "WELCOME10",

      alreadySubscribed: false,
    });
  } catch (error) {
    console.error(
      "NEWSLETTER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}