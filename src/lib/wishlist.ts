export const WISHLIST_KEY = "dahriola_wishlist";

export function getWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isInWishlist(productId: string): boolean {
  return getWishlist().includes(productId);
}

export function addToWishlist(productId: string): string[] {
  const current = getWishlist();
  if (current.includes(productId)) return current;

  const updated = [...current, productId];
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("wishlistUpdated", { detail: updated }));
  return updated;
}

export function removeFromWishlist(productId: string): string[] {
  const updated = getWishlist().filter((id) => id !== productId);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("wishlistUpdated", { detail: updated }));
  return updated;
}

export function toggleWishlist(productId: string): {
  updated: string[];
  isWishlisted: boolean;
} {
  const current = getWishlist();
  const alreadyExists = current.includes(productId);

  const updated = alreadyExists
    ? current.filter((id) => id !== productId)
    : [...current, productId];

  localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("wishlistUpdated", { detail: updated }));

  return {
    updated,
    isWishlisted: !alreadyExists,
  };
}

export function clearWishlist(): void {
  localStorage.removeItem(WISHLIST_KEY);
  window.dispatchEvent(new CustomEvent("wishlistUpdated", { detail: [] }));
}