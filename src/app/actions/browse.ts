"use server";

// Records what known contacts look at (only after they allowed "Personalised
// emails"), for the browse follow-up emails and Brevo's product_viewed event.
import { writeClient } from "@/src/lib/sanityWrite";
import { emailFromIdentity } from "@/src/lib/identity";
import { browseDocId } from "@/src/lib/browseSequences";
import { getMarketingSettings, isOptedOut } from "@/src/lib/marketing";
import { trackBrevoEvent } from "@/src/lib/brevo";
import { SITE_URL } from "@/src/lib/events";

type View = { _key: string; productId: string; name: string; count: number; lastAt: string };
type BrowseDoc = { views?: View[]; step?: number; lastStepAt?: string; convertedAt?: string; sequenceStartedAt?: string };

export async function recordProductView(visitorId: string, productId: string) {
  try {
    const email = emailFromIdentity(visitorId);
    if (!email || !productId) return;
    const settings = await getMarketingSettings();
    if (!settings.browseEnabled || (await isOptedOut(email))) return;

    const product = await writeClient.fetch<{ _id: string; name: string; slug?: string; priceNGN?: number; image?: string; category?: string } | null>(
      `*[_type == "product" && _id == $id][0]{ _id, name, "slug": slug.current, priceNGN, "image": images[0].asset->url, "category": category->title }`,
      { id: String(productId) }
    );
    if (!product) return;

    const _id = browseDocId(email);
    const now = new Date().toISOString();
    await writeClient.createIfNotExists({ _id, _type: "browseActivity", email, views: [], step: 0, sequenceStartedAt: now });
    const doc = await writeClient.fetch<BrowseDoc | null>(`*[_id == $id][0]{ views, step, lastStepAt, convertedAt, sequenceStartedAt }`, { id: _id });

    // Most recent first, one entry per product, keep 20
    const views = (doc?.views || []).filter((v) => v.productId !== product._id);
    const previous = (doc?.views || []).find((v) => v.productId === product._id);
    // ignore rapid reloads of the same product
    if (previous && Date.now() - new Date(previous.lastAt).getTime() < 10 * 60_000) return;
    views.unshift({ _key: product._id.slice(-12), productId: product._id, name: product.name, count: (previous?.count || 0) + 1, lastAt: now });

    let patch = writeClient.patch(_id).set({ views: views.slice(0, 20), lastViewedAt: now });

    // A finished (or bought) sequence restarts when they come back to browse later
    const finished = (doc?.step ?? 0) >= 5 || !!doc?.convertedAt;
    const lastActivity = doc?.lastStepAt || doc?.convertedAt;
    if (finished && (!lastActivity || Date.now() - new Date(lastActivity).getTime() > 14 * 86_400_000)) {
      patch = patch.set({ step: 0, sequenceStartedAt: now }).unset(["convertedAt", "lastStepAt"]);
    }
    await patch.commit();

    await trackBrevoEvent(email, "product_viewed", {
      product_id: product._id,
      product_name: product.name,
      product_url: product.slug ? `${SITE_URL}/product/${product.slug}` : SITE_URL,
      product_image: product.image,
      price: product.priceNGN,
      currency: "NGN",
      category: product.category,
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
    const _id = browseDocId(email);
    const now = new Date().toISOString();
    await writeClient.createIfNotExists({ _id, _type: "browseActivity", email, views: [], step: 5, sequenceStartedAt: now });
    await writeClient.patch(_id).set({ lastEngagedAt: now }).commit();
  } catch (err) {
    console.error("markEmailClick failed:", err);
  }
}
