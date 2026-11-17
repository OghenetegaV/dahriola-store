// Ticket QR codes for RSVP emails. Brevo can't embed inline images, so the
// email shows <img src="/api/ticket-qr?code=…&t=…">. Signed, so the route
// only renders codes the site issued.
import QRCode from "qrcode";
import { SITE_URL } from "@/src/lib/events";
import { safeEqual, ticketQrToken } from "@/src/lib/signing";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") || "").toUpperCase();
  const token = url.searchParams.get("t") || "";
  if (!/^[A-Z0-9]{4,12}$/.test(code) || !safeEqual(ticketQrToken(code), token)) {
    return new Response("Not found", { status: 404 });
  }
  const png = await QRCode.toBuffer(`${SITE_URL}/events/check-in?code=${encodeURIComponent(code)}`, { width: 360, margin: 1 });
  return new Response(new Uint8Array(png), {
    headers: { "content-type": "image/png", "cache-control": "public, max-age=31536000, immutable" },
  });
}
