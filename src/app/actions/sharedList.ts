"use server";

import { writeClient } from "@/src/lib/sanityWrite";
import { randomId, safeEqual, sha256 } from "@/src/lib/signing";
import { SITE_URL } from "@/src/lib/events";
import { sendListCreatedEmail } from "@/src/lib/mailer";
import { hasUsableAddress, loadListDoc, type ListAddress, type ListItemDoc } from "@/src/lib/sharedLists";

export type ShareItemInput = {
  key?: string;
  productId: string;
  size?: string;
  selectedPrintId?: string;
  selectedPrintName?: string;
  heightLength?: string;
  gender?: string;
  notes?: string;
  quantity?: number;
};

export type SaveListInput = {
  publicId?: string;
  editToken?: string;
  kind: "wishlist" | "cart";
  ownerName: string;
  ownerEmail?: string;
  message?: string;
  keepSurprise?: boolean;
  items: ShareItemInput[];
  /** undefined = leave as is, null = remove */
  deliveryAddress?: ListAddress | null;
};

const clean = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanAddress(a: ListAddress): ListAddress {
  return {
    name: clean(a.name, 100),
    phone: clean(a.phone, 40),
    line1: clean(a.line1, 160),
    apartment: clean(a.apartment, 100),
    city: clean(a.city, 80),
    state: clean(a.state, 80),
    stateCode: clean(a.stateCode, 20),
    country: clean(a.country, 2).toUpperCase(),
    postalCode: clean(a.postalCode, 20),
  };
}

export async function saveSharedList(input: SaveListInput): Promise<
  | { success: true; publicId: string; editToken: string; shareUrl: string; itemKeys: { productId: string; key: string }[] }
  | { success: false; message: string }
> {
  try {
    const kind = input.kind === "cart" ? "cart" : "wishlist";
    const ownerName = clean(input.ownerName, 80);
    const ownerEmail = clean(input.ownerEmail, 120).toLowerCase();
    if (!ownerName) return { success: false, message: "Please add your name so people know whose list it is." };
    if (ownerEmail && !EMAIL_RE.test(ownerEmail)) return { success: false, message: "Please enter a valid email address." };

    const rawItems = Array.isArray(input.items) ? input.items.slice(0, 60) : [];
    if (!rawItems.length) return { success: false, message: "Add at least one item before sharing." };

    // Only real products can go on a list
    const ids = [...new Set(rawItems.map((i) => clean(i.productId, 100)))];
    const products = await writeClient.fetch<{ _id: string; name: string }[]>(
      `*[_type == "product" && _id in $ids]{ _id, name }`,
      { ids }
    );
    const names = new Map(products.map((p) => [p._id, p.name]));

    let address: ListAddress | null | undefined = undefined;
    if (input.deliveryAddress === null) address = null;
    else if (input.deliveryAddress) {
      address = cleanAddress(input.deliveryAddress);
      if (!hasUsableAddress(address)) {
        return { success: false, message: "Please complete the delivery address (country, state, city and street)." };
      }
    }

    // ---- update an existing list ----
    if (input.publicId && input.editToken) {
      const existing = await loadListDoc(clean(input.publicId, 20));
      if (!existing || !existing.editTokenHash || !safeEqual(existing.editTokenHash, sha256(input.editToken))) {
        return { success: false, message: "This list can't be edited from here. Share it again to create a new link." };
      }
      const oldByKey = new Map((existing.items || []).map((i) => [i._key, i]));
      const items: ListItemDoc[] = rawItems
        .filter((i) => names.has(clean(i.productId, 100)))
        .map((i) => {
          const old = i.key ? oldByKey.get(i.key) : undefined;
          return {
            ...buildItem(i, names),
            _key: old?._key || randomId(10),
            // keep "already bought" status on items that stay on the list
            ...(old?.purchased
              ? { purchased: true, purchasedAt: old.purchasedAt, purchasedBy: old.purchasedBy, orderReference: old.orderReference }
              : {}),
          };
        });

      let patch = writeClient.patch(existing._id).set({
        ownerName,
        ownerEmail: ownerEmail || undefined,
        message: clean(input.message, 400) || "",
        keepSurprise: input.keepSurprise !== false,
        items,
        active: true,
        updatedAt: new Date().toISOString(),
      });
      if (address) patch = patch.set({ deliveryAddress: address });
      if (address === null) patch = patch.unset(["deliveryAddress"]);
      await patch.commit();
      return {
        success: true,
        publicId: existing.publicId,
        editToken: input.editToken,
        shareUrl: `${SITE_URL}/list/${existing.publicId}`,
        itemKeys: items.map((i) => ({ productId: i.product?._ref || "", key: i._key })),
      };
    }

    // ---- create a new list ----
    // Light abuse guard: at most 5 new lists per email address per hour
    if (ownerEmail) {
      const recent = await writeClient.fetch<number>(
        `count(*[_type == "sharedList" && ownerEmail == $email && createdAt > $since])`,
        { email: ownerEmail, since: new Date(Date.now() - 3600_000).toISOString() }
      );
      if (recent >= 5) return { success: false, message: "You've created several lists recently. Please try again later." };
    }

    const publicId = randomId(10);
    const editToken = randomId(32);
    const now = new Date().toISOString();
    const newItems = rawItems
      .filter((i) => names.has(clean(i.productId, 100)))
      .map((i) => ({ ...buildItem(i, names), _key: randomId(10) }));
    await writeClient.create({
      _type: "sharedList",
      kind,
      publicId,
      editTokenHash: sha256(editToken),
      ownerName,
      ownerEmail: ownerEmail || undefined,
      message: clean(input.message, 400) || "",
      keepSurprise: input.keepSurprise !== false,
      active: true,
      items: newItems,
      deliveryAddress: address || undefined,
      createdAt: now,
      updatedAt: now,
    });

    const shareUrl = `${SITE_URL}/list/${publicId}`;
    if (ownerEmail) {
      await sendListCreatedEmail({
        to: ownerEmail,
        ownerName,
        kind,
        shareUrl,
        manageUrl: `${shareUrl}?manage=${editToken}`,
      });
    }
    return {
      success: true,
      publicId,
      editToken,
      shareUrl,
      itemKeys: newItems.map((i) => ({ productId: i.product?._ref || "", key: i._key })),
    };
  } catch (err) {
    console.error("saveSharedList failed:", err);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}

function buildItem(i: ShareItemInput, names: Map<string, string>): Omit<ListItemDoc, "_key"> {
  const productId = clean(i.productId, 100);
  return {
    product: { _ref: productId, _type: "reference" } as ListItemDoc["product"],
    productName: names.get(productId),
    size: clean(i.size, 20) || undefined,
    selectedPrintId: clean(i.selectedPrintId, 100) || undefined,
    selectedPrintName: clean(i.selectedPrintName, 80) || undefined,
    heightLength: clean(i.heightLength, 80) || undefined,
    gender: clean(i.gender, 40) || undefined,
    notes: clean(i.notes, 400) || undefined,
    quantity: Math.min(20, Math.max(1, Math.floor(Number(i.quantity) || 1))),
    purchased: false,
  };
}

/** The owner's own view of their list, including their saved address. */
export async function getListForOwner(publicId: string, editToken: string) {
  const doc = await loadListDoc(clean(publicId, 20));
  if (!doc || !doc.editTokenHash || !editToken || !safeEqual(doc.editTokenHash, sha256(editToken))) return null;
  return {
    publicId: doc.publicId,
    kind: doc.kind,
    ownerName: doc.ownerName || "",
    ownerEmail: doc.ownerEmail || "",
    message: doc.message || "",
    keepSurprise: doc.keepSurprise !== false,
    active: doc.active !== false,
    deliveryAddress: doc.deliveryAddress || null,
    items: (doc.items || []).map((i) => ({
      key: i._key,
      productId: i.product?._ref || "",
      size: i.size,
      selectedPrintId: i.selectedPrintId,
      selectedPrintName: i.selectedPrintName,
      heightLength: i.heightLength,
      gender: i.gender,
      notes: i.notes,
      quantity: i.quantity || 1,
      // keepSurprise hides what was bought, even from the owner
      purchased: doc.keepSurprise === false ? !!i.purchased : undefined,
    })),
  };
}

export async function setListActive(publicId: string, editToken: string, active: boolean) {
  const doc = await loadListDoc(clean(publicId, 20));
  if (!doc || !doc.editTokenHash || !safeEqual(doc.editTokenHash, sha256(editToken || ""))) {
    return { success: false };
  }
  await writeClient.patch(doc._id).set({ active: !!active, updatedAt: new Date().toISOString() }).commit();
  return { success: true };
}
