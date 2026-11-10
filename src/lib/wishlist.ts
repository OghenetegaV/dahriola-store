// Browser wishlist. Each entry remembers the options the shopper picked, so the
// list can be shared and bought exactly as wanted. Older wishlists stored only
// product IDs; those are converted automatically.
export const WISHLIST_KEY = "dahriola_wishlist";
const SHARED_LISTS_KEY = "dahriola_shared_lists";

export type WishlistEntry = {
  productId: string;
  size?: string;
  selectedPrintId?: string;
  selectedPrintName?: string;
  heightLength?: string;
  gender?: string;
  notes?: string;
  quantity?: number;
  addedAt?: number;
};

function readEntries(): WishlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const entries: WishlistEntry[] = [];
    for (const item of parsed) {
      const entry: WishlistEntry | null =
        typeof item === "string"
          ? { productId: item }
          : item && typeof item.productId === "string"
            ? item
            : null;
      if (entry && !seen.has(entry.productId)) {
        seen.add(entry.productId);
        entries.push(entry);
      }
    }
    return entries;
  } catch {
    return [];
  }
}

function writeEntries(entries: WishlistEntry[]) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(entries));
  } catch {}
  window.dispatchEvent(new CustomEvent("wishlistUpdated", { detail: entries.map((e) => e.productId) }));
}

export function getWishlistEntries(): WishlistEntry[] {
  return readEntries();
}

/** Product IDs only (used for counts and heart icons). */
export function getWishlist(): string[] {
  return readEntries().map((e) => e.productId);
}

export function isInWishlist(productId: string): boolean {
  return readEntries().some((e) => e.productId === productId);
}

export function addToWishlist(productId: string, options: Omit<WishlistEntry, "productId"> = {}): string[] {
  const current = readEntries();
  if (current.some((e) => e.productId === productId)) return current.map((e) => e.productId);
  const updated = [...current, { productId, ...options, addedAt: Date.now() }];
  writeEntries(updated);
  return updated.map((e) => e.productId);
}

export function updateWishlistEntry(productId: string, updates: Omit<WishlistEntry, "productId">) {
  const updated = readEntries().map((e) => (e.productId === productId ? { ...e, ...updates } : e));
  writeEntries(updated);
  return updated;
}

export function removeFromWishlist(productId: string): string[] {
  const updated = readEntries().filter((e) => e.productId !== productId);
  writeEntries(updated);
  return updated.map((e) => e.productId);
}

export function toggleWishlist(productId: string): { updated: string[]; isWishlisted: boolean } {
  const alreadyExists = isInWishlist(productId);
  const updated = alreadyExists ? removeFromWishlist(productId) : addToWishlist(productId);
  return { updated, isWishlisted: !alreadyExists };
}

export function clearWishlist(): void {
  writeEntries([]);
}

// ---- Links to lists this shopper has shared (so re-sharing updates the same link) ----
export type SharedListRef = { publicId: string; editToken: string };

export function getSharedListRef(kind: "wishlist" | "cart"): SharedListRef | null {
  if (typeof window === "undefined") return null;
  try {
    const all = JSON.parse(localStorage.getItem(SHARED_LISTS_KEY) || "{}");
    const ref = all?.[kind];
    return ref?.publicId && ref?.editToken ? ref : null;
  } catch {
    return null;
  }
}

export function setSharedListRef(kind: "wishlist" | "cart", ref: SharedListRef | null) {
  try {
    const all = JSON.parse(localStorage.getItem(SHARED_LISTS_KEY) || "{}");
    if (ref) all[kind] = ref;
    else delete all[kind];
    localStorage.setItem(SHARED_LISTS_KEY, JSON.stringify(all));
  } catch {}
}
