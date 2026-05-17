import { NextResponse } from "next/server";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
  ],
});

const doc = new GoogleSpreadsheet(
  process.env.GOOGLE_SHEET_ID!,
  serviceAccountAuth
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, email, birthday, source } = body;

    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];

    const rows = await sheet.getRows();

    if (rows.length === 0) {
      await sheet.setHeaderRow([
        "Name",
        "Email",
        "Birthday",
        "Source",
        "Created At",
      ]);
    }

    await sheet.addRow({
      Name: name,
      Email: email,
      Birthday: birthday,
      Source: source,
      "Created At": new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("NEWSLETTER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to save subscriber",
      },
      {
        status: 500,
      }
    );
  }
}