// Server-only access to shared lists. The private delivery address and the
// edit-token hash are only ever read here, never sent to a visitor's browser
// (except the owner's own address, back to the owner, on the manage screen).
import { db, unwrap } from "@/src/lib/supabase/admin";
import { productsByIds } from "@/src/lib/catalog";
import { imageUrl } from "@/src/lib/images";
import { safeEqual, sha256 } from "@/src/lib/signing";

export type ListAddress = {
  name?: string;
  phone?: string;
  line1?: string;
  apartment?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  country?: string;
  postalCode?: string;
};

/** One item as stored in shared_lists.items */
export type ListItemDoc = {
  key: string;
  productId: string;
  productName?: string;
  size?: string;
  selectedPrintId?: string;
  selectedPrintName?: string;
  heightLength?: string;
  gender?: string;
  notes?: string;
  quantity?: number;
  purchased?: boolean;
  purchasedAt?: string;
  purchasedBy?: string;
  orderReference?: string;
};

export type ListDoc = {
  _id: string;
  kind: "wishlist" | "cart";
  publicId: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  message?: string | null;
  keepSurprise?: boolean;
  active?: boolean;
  editTokenHash?: string | null;
  deliveryAddress?: ListAddress | null;
  items?: ListItemDoc[] | null;
};

export const LIST_FIELDS = `_id:id, kind, publicId:public_id, ownerName:owner_name, ownerEmail:owner_email, message,
  keepSurprise:keep_surprise, active, editTokenHash:edit_token_hash, deliveryAddress:delivery_address, items`;

export async function loadListDoc(publicId: string) {
  if (!/^[A-Za-z0-9]{6,20}$/.test(publicId || "")) return null;
  return unwrap(
    await db().from("shared_lists").select(LIST_FIELDS).eq("public_id", publicId).maybeSingle(),
    "Loading the list"
  ) as ListDoc | null;
}

export function hasUsableAddress(a?: ListAddress | null) {
  return !!(a?.line1 && a?.city && a?.state && a?.country);
}

export type PublicListItem = {
  key: string;
  productId: string;
  name: string;
  slug?: string;
  image?: string;
  priceNGN?: number;
  available: boolean;
  size?: string;
  selectedPrintId?: string;
  selectedPrintName?: string;
  heightLength?: string;
  gender?: string;
  notes?: string;
  quantity: number;
  purchased: boolean;
};

export type PublicList = {
  publicId: string;
  kind: "wishlist" | "cart";
  ownerFirstName: string;
  message?: string;
  active: boolean;
  keepSurprise: boolean;
  hasAddress: boolean;
  items: PublicListItem[];
};

/** Everything a gift-buyer may see. No address, no email, no token. */
export async function getPublicList(
  publicId: string,
  opts: { includeInactive?: boolean; doc?: ListDoc | null } = {}
): Promise<PublicList | null> {
  const doc = opts.doc !== undefined ? opts.doc : await loadListDoc(publicId);
  if (!doc || (doc.active === false && !opts.includeInactive)) return null;

  const items = doc.items || [];
  const products = await productsByIds(items.map((i) => i.productId).filter(Boolean));
  const byId = new Map(products.map((p) => [p._id, p]));

  return {
    publicId: doc.publicId,
    kind: doc.kind,
    ownerFirstName: (doc.ownerName || "Someone").trim().split(/\s+/)[0],
    message: doc.message || undefined,
    active: doc.active !== false,
    keepSurprise: doc.keepSurprise !== false,
    hasAddress: hasUsableAddress(doc.deliveryAddress),
    items: items.map((i) => {
      const p = i.productId ? byId.get(i.productId) : undefined;
      return {
        key: i.key,
        productId: i.productId || "",
        name: p?.name || i.productName || "Item",
        slug: p?.slug,
        image: p?.images[0] ? imageUrl(p.images[0], { width: 700, height: 875 }) : undefined,
        priceNGN: p?.priceNGN,
        available: !!p && typeof p.priceNGN === "number",
        size: i.size,
        selectedPrintId: i.selectedPrintId,
        selectedPrintName: i.selectedPrintName,
        heightLength: i.heightLength,
        gender: i.gender,
        notes: i.notes,
        quantity: Math.max(1, Number(i.quantity) || 1),
        purchased: !!i.purchased,
      };
    }),
  };
}

/** True when `editToken` is this list's private manage token. */
export function isOwnerToken(doc: ListDoc | null, editToken?: string) {
  return !!(doc?.editTokenHash && editToken && safeEqual(doc.editTokenHash, sha256(editToken)));
}

export async function markItemsPurchased(doc: ListDoc, itemKeys: string[], buyerName: string, reference: string) {
  const keys = new Set(itemKeys.filter(Boolean));
  if (!keys.size) return;

  // Re-read so a change made since the buyer opened the list isn't overwritten
  const fresh = (await loadListDoc(doc.publicId)) || doc;
  const now = new Date().toISOString();
  let changed = false;
  const items = (fresh.items || []).map((i) => {
    if (!keys.has(i.key)) return i;
    changed = true;
    return { ...i, purchased: true, purchasedAt: now, purchasedBy: buyerName.slice(0, 80), orderReference: reference };
  });
  if (!changed) return;
  unwrap(await db().from("shared_lists").update({ items }).eq("id", fresh._id), "Updating the list");
}
