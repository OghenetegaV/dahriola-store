"use server";

// Records what known contacts look at (only after they allowed "Personalised
// emails"), for the browse follow-up emails and Brevo's product_viewed event.
import { db, unwrap } from "@/src/lib/supabase/admin";
import { productsByIds } from "@/src/lib/catalog";
import { emailFromIdentity } from "@/src/lib/identity";
import { browseDocId } from "@/src/lib/browseSequences";
import { getMarketingSettings, isOptedOut } from "@/src/lib/marketing";
import { trackBrevoEvent } from "@/src/lib/brevo";
import { SITE_URL } from "@/src/lib/events";

type View = { productId: string; name: string; count: number; lastAt: string };
type BrowseRow = {
  views: View[] | null;
  step: number | null;
  last_step_at: string | null;
  converted_at: string | null;
  sequence_started_at: string | null;
};

export async function recordProductView(visitorId: string, productId: string) {
  try {
    const email = emailFromIdentity(visitorId);
    if (!email || !productId) return;
    const settings = await getMarketingSettings();
    if (!settings.browseEnabled || (await isOptedOut(email))) return;

    const [product] = await productsByIds([String(productId)]);
    if (!product) return;

    const id = browseDocId(email);
    const now = new Date().toISOString();
    const doc = unwrap(
      await db()
        .from("browse_activity")
        .select("views, step, last_step_at, converted_at, sequence_started_at")
        .eq("id", id)
        .maybeSingle(),
      "Loading browsing activity"
    ) as BrowseRow | null;

    // Most recent first, one entry per product, keep 20
    const existing = Array.isArray(doc?.views) ? doc!.views! : [];
    const previous = existing.find((v) => v.productId === product._id);
    // ignore rapid reloads of the same product
    if (previous && Date.now() - new Date(previous.lastAt).getTime() < 10 * 60_000) return;
    const views: View[] = [
      { productId: product._id, name: product.name, count: (previous?.count || 0) + 1, lastAt: now },
      ...existing.filter((v) => v.productId !== product._id),
    ].slice(0, 20);

    if (!doc) {
      unwrap(
        await db()
          .from("browse_activity")
          .upsert({ id, email, views, step: 0, sequence_started_at: now, last_viewed_at: now }, { onConflict: "id" }),
        "Saving browsing activity"
      );
    } else {
      // A finished (or bought) sequence restarts when they come back to browse later
      const finished = (doc.step ?? 0) >= 5 || !!doc.converted_at;
      const lastActivity = doc.last_step_at || doc.converted_at;
      const restart = finished && (!lastActivity || Date.now() - new Date(lastActivity).getTime() > 14 * 86_400_000);
      unwrap(
        await db()
          .from("browse_activity")
          .update({
            views,
            last_viewed_at: now,
            ...(restart ? { step: 0, sequence_started_at: now, converted_at: null, last_step_at: null } : {}),
            ...(!doc.sequence_started_at && !restart ? { sequence_started_at: now } : {}),
          })
          .eq("id", id),
        "Saving browsing activity"
      );
    }

    await trackBrevoEvent(email, "product_viewed", {
      product_id: product._id,
      product_name: product.name,
      product_url: product.slug ? `${SITE_URL}/product/${product.slug}` : SITE_URL,
      product_image: product.images[0],
      price: product.priceNGN,
      currency: "NGN",
      category: product.categoryName,
    });
  } catch (err) {
    console.error("recordProductView failed:", err);
  }
}

/** A known contact arrived from one of our email links. */
export async function markEmailClick(visitorId: string) {
  try {
    const email = emailFromIdentity(visitorId);
    if (!email) return;
    const id = browseDocId(email);
    const now = new Date().toISOString();
    const updated = unwrap(
      await db().from("browse_activity").update({ last_engaged_at: now }).eq("id", id).select("id"),
      "Saving the email click"
    ) as { id: string }[];
    if (!updated.length) {
      unwrap(
        await db()
          .from("browse_activity")
          .upsert({ id, email, views: [], step: 5, sequence_started_at: now, last_engaged_at: now }, { onConflict: "id", ignoreDuplicates: true }),
        "Saving the email click"
      );
    }
  } catch (err) {
    console.error("markEmailClick failed:", err);
  }
}
