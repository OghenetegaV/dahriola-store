import { NextResponse } from "next/server";
import { getSheet } from "@/src/lib/googleSheets";
import { sendNewsletterWelcome } from "@/src/app/actions/email";
import { upsertContact } from "@/src/lib/brevo";
import { optBackIn, parseBirthday } from "@/src/lib/marketing";

const DISCOUNT_CODE = process.env.NEWSLETTER_DISCOUNT_CODE?.trim() || "WELCOME10";
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

    const sheet = await getSheet([
      "Name",
      "Email",
      "Birthday",
      "Source",
      "Discount Code",
      "Created At",
    ]);

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

    // Marketing: a new sign-up is an opt-in (even if they unsubscribed before)
    try {
      await optBackIn(email);
      const { month, year } = parseBirthday(birthday);
      const [first, ...rest] = name.split(/\s+/);
      await upsertContact(
        email,
        { FIRSTNAME: first || undefined, LASTNAME: rest.join(" ") || undefined, BIRTH_MONTH: month, BIRTH_YEAR: year, SIGNUP_SOURCE: source || "Newsletter pop-up" },
        ["NEWSLETTER"],
        { resubscribe: true }
      );
    } catch (err) {
      console.error("Newsletter marketing sync failed:", err);
    }

    return NextResponse.json({ success: true, code: DISCOUNT_CODE });
  } catch (error: any) {
    console.error("❌ NEWSLETTER ERROR:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
