"use server";

// Public catalogue reads for client components. These run on the server so the
// Sanity dataset can be private (orders, RSVPs and gift addresses must not be
// readable by anyone with the project ID). Each query is fixed — the browser
// can't send its own GROQ.
import { client } from "@/src/lib/sanity";

export async function getCategories(): Promise<{ title: string; slug: string }[]> {
  return client.fetch(`*[_type == "category"]{ title, "slug": slug.current }`);
}

export async function getNavProducts() {
  return client.fetch(`
    *[_type == "product"]{
      _id,
      name,
      briefDescription,
      description,
      priceNGN,
      images,
      _createdAt,
      productType,
      "slug": slug.current,
      "categoryName": category->title
    }
  `);
}

export async function getUpsellProducts(excludeIds: string[]) {
  const ids = (Array.isArray(excludeIds) ? excludeIds : []).map(String).slice(0, 100);
  return client.fetch(
    `*[_type == "product" && !(_id in $ids)][0...4]{ _id, name, priceNGN, images, "slug": slug.current }`,
    { ids }
  );
}

export type WishlistProductData = {
  _id: string;
  name: string;
  slug: string;
  priceNGN: number;
  images?: unknown[];
  productType?: string;
  categoryName?: string;
  prints?: { _id: string; name: string; image?: unknown; stockQuantity?: number; isActive?: boolean }[];
};

export async function getProductsByIds(ids: string[]): Promise<WishlistProductData[]> {
  const list = (Array.isArray(ids) ? ids : []).map(String).slice(0, 100);
  if (!list.length) return [];
  return client.fetch(
    `*[_type == "product" && _id in $ids]{
      _id, name, priceNGN, images, productType,
      "slug": slug.current,
      "categoryName": category->title,
      "prints": prints[]->{ _id, name, image, stockQuantity, isActive }
    }`,
    { ids: list }
  );
}
