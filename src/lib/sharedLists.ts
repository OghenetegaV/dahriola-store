// Server-only access to shared lists. The private delivery address and the
// edit-token hash are only ever read here, never sent to a visitor's browser
// (except the owner's own address, back to the owner, on the manage screen).
import { writeClient } from "@/src/lib/sanityWrite";
import { urlFor } from "@/src/lib/sanity";
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

export type ListItemDoc = {
  _key: string;
  product?: { _ref: string };
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
  ownerName?: string;
  ownerEmail?: string;
  message?: string;
  keepSurprise?: boolean;
  active?: boolean;
  editTokenHash?: string;
  deliveryAddress?: ListAddress;
  items?: ListItemDoc[];
};

export async function loadListDoc(publicId: string) {
  if (!/^[A-Za-z0-9]{6,20}$/.test(publicId || "")) return null;
  return writeClient.fetch<ListDoc | null>(`*[_type == "sharedList" && publicId == $publicId][0]`, { publicId });
}

export function hasUsableAddress(a?: ListAddress) {
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

type ProductInfo = { _id: string; name: string; slug?: string; priceNGN?: number; images?: unknown[] };

/** Everything a gift-buyer may see. No address, no email, no token. */
export async function getPublicList(
  publicId: string,
  opts: { includeInactive?: boolean; doc?: ListDoc | null } = {}
): Promise<PublicList | null> {
  const doc = opts.doc !== undefined ? opts.doc : await loadListDoc(publicId);
  if (!doc || (doc.active === false && !opts.includeInactive)) return null;

  const ids = [...new Set((doc.items || []).map((i) => i.product?._ref).filter(Boolean))] as string[];
  const products = ids.length
    ? await writeClient.fetch<ProductInfo[]>(
        `*[_type == "product" && _id in $ids]{ _id, name, "slug": slug.current, priceNGN, images }`,
        { ids }
      )
    : [];
  const byId = new Map(products.map((p) => [p._id, p]));

  return {
    publicId: doc.publicId,
    kind: doc.kind,
    ownerFirstName: (doc.ownerName || "Someone").trim().split(/\s+/)[0],
    message: doc.message || undefined,
    active: doc.active !== false,
    keepSurprise: doc.keepSurprise !== false,
    hasAddress: hasUsableAddress(doc.deliveryAddress),
    items: (doc.items || []).map((i) => {
      const p = i.product?._ref ? byId.get(i.product._ref) : undefined;
      return {
        key: i._key,
        productId: i.product?._ref || "",
        name: p?.name || i.productName || "Item",
        slug: p?.slug,
        image: p?.images?.[0] ? urlFor(p.images[0]).width(700).height(875).fit("crop").url() : undefined,
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
  const keys = [...new Set(itemKeys.filter(Boolean))].filter((k) => doc.items?.some((i) => i._key === k));
  if (!keys.length) return;
  let patch = writeClient.patch(doc._id).set({ updatedAt: new Date().toISOString() });
  for (const key of keys) {
    patch = patch.set({
      [`items[_key=="${key}"].purchased`]: true,
      [`items[_key=="${key}"].purchasedAt`]: new Date().toISOString(),
      [`items[_key=="${key}"].purchasedBy`]: buyerName.slice(0, 80),
      [`items[_key=="${key}"].orderReference`]: reference,
    });
  }
  await patch.commit();
}
