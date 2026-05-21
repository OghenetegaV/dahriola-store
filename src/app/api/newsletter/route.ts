import { NextResponse } from "next/server";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

const auth = new JWT({
  email:
    process.env
      .GOOGLE_SERVICE_ACCOUNT_EMAIL,

  key:
    process.env
      .GOOGLE_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      ),

  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
  ],
});

export async function POST(
  req: Request
) {
  try {
    const body =
      await req.json();

    const {
      name,
      email,
      birthday,
      source,
    } = body;

    const doc =
      new GoogleSpreadsheet(
        process.env
          .GOOGLE_SHEET_ID!,
        auth
      );

    await doc.loadInfo();

    const sheet =
      doc.sheetsByIndex[0];

    // REQUIRED
    await sheet.loadHeaderRow();

    if (
      !sheet.headerValues ||
      sheet.headerValues
        .length === 0
    ) {
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

    const existing =
      await sheet.getRows();

    const alreadyExists =
      existing.some(
        (
          row: any
        ) =>
          row
            .get(
              "Email"
            )
            ?.toLowerCase() ===
          email.toLowerCase()
      );

    if (
      alreadyExists
    ) {
      return NextResponse.json({
        success: true,
        code: "WELCOME10",
      });
    }

    await sheet.addRow({
      Name: name,
      Email: email,
      Birthday: birthday,
      Source: source,
      "Discount Code":
        "THESOUND",
      "Created At":
        new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      code: "THESOUND",
    });
  } catch (
    error
  ) {
    console.log(
      "NEWSLETTER ERROR",
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