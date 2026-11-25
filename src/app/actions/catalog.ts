"use server";

// Public catalogue reads for client components. These run on the server, so
// the database stays private (orders, RSVPs and gift addresses must not be
// readable from a browser). Each query is fixed — the browser can't send its own.
import { listCategories, listProducts, productsByIds } from "@/src/lib/catalog";

export async function getCategories(): Promise<{ title: string; slug: string }[]> {
  return (await listCategories()).map((c) => ({ title: c.title, slug: c.slug }));
}

export async function getNavProducts() {
  return listProducts();
}

export async function getUpsellProducts(excludeIds: string[]) {
  const ids = (Array.isArray(excludeIds) ? excludeIds : []).map(String).slice(0, 100);
  const products = await listProducts({ excludeIds: ids, limit: 12 });
  return products
    .filter((p) => typeof p.priceNGN === "number" && p.images.length)
    .slice(0, 4)
    .map((p) => ({ _id: p._id, name: p.name, priceNGN: p.priceNGN, images: p.images, slug: p.slug }));
}

export type WishlistProductData = {
  _id: string;
  name: string;
  slug: string;
  priceNGN: number;
  images?: string[];
  productType?: string;
  categoryName?: string;
  prints?: { _id: string; name: string; image?: string | null; stockQuantity?: number; isActive?: boolean }[];
};

export async function getProductsByIds(ids: string[]): Promise<WishlistProductData[]> {
  const list = (Array.isArray(ids) ? ids : []).map(String).slice(0, 100);
  if (!list.length) return [];
  const products = await productsByIds(list, { withPrints: true });
  return products.map((p) => ({
    _id: p._id,
    name: p.name,
    slug: p.slug,
    priceNGN: p.priceNGN as number,
    images: p.images,
    productType: p.productType,
    categoryName: p.categoryName,
    prints: p.prints,
  }));
}
