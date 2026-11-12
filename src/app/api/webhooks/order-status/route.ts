// Called by a Sanity webhook whenever an order is published, so status
// emails go out straight away (the daily job is a safety net).
//
// Sanity → API → Webhooks → Create:
//   URL:     https://www.dahriola.com/api/webhooks/order-status?secret=<SANITY_WEBHOOK_SECRET>
//   Dataset: production · Trigger on: Update · Filter: _type == "order"
//   Projection: {_id}
import { NextResponse } from "next/server";
import { safeEqual } from "@/src/lib/signing";
import { processOrderStatusUpdates } from "@/src/lib/orderStatus";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  const given = new URL(req.url).searchParams.get("secret") || "";
  if (!secret || !safeEqual(secret, given)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = typeof body?._id === "string" ? body._id : undefined;
  if (!id) return NextResponse.json({ ok: true, skipped: "no _id" });

  try {
    const result = await processOrderStatusUpdates(id);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("Order status webhook failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
