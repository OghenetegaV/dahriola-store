// Server-only catalogue reads (products, categories, prints, reviews).
// Results use the shapes the storefront components already expect
// (`_id`, `priceNGN`, `images` as URLs, …).
import "server-only";
import { db, inList, isSupabaseConfigured, unwrap } from "@/src/lib/supabase/admin";

export type CatalogPrint = {
  _id: string;
  name: string;
  image?: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
};

export type CatalogCategory = {
  _id: string;
  title: string;
  slug: string;
  compositionCare?: string | null;
  sizeFit?: string | null;
};

export type CatalogProduct = {
  _id: string;
  name: string;
  slug: string;
  briefDescription?: string | null;
  description?: string | null;
  productionTime?: string | null;
  priceNGN?: number;
  compareAtPrice?: number;
  productType?: string;
  images: string[];
  _createdAt: string;
  _updatedAt?: string;
  categoryId?: string;
  categoryName?: string;
  category?: CatalogCategory | null;
  prints?: CatalogPrint[];
};

export type CatalogReview = { _id: string; name: string; rating: number; title: string; comment: string };

const CARD_FIELDS = `
  _id:id, name, slug, briefDescription:brief_description, description, productionTime:production_time,
  priceNGN:price_ngn, compareAtPrice:compare_at_price, productType:product_type, images,
  _createdAt:created_at, _updatedAt:updated_at, categoryId:category_id,
  category:categories(_id:id, title, slug, compositionCare:composition_care, sizeFit:size_fit)`;

const PRINT_FIELDS = `_id:id, name, image:image_url, stockQuantity:stock_quantity, lowStockThreshold:low_stock_threshold, isActive:is_active`;

const WITH_PRINTS = `${CARD_FIELDS}, product_prints(position, print:prints(${PRINT_FIELDS}))`;

const num = (v: unknown) => (v === null || v === undefined || v === "" ? undefined : Number(v));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProduct(row: any): CatalogProduct {
  const { product_prints, category, ...rest } = row;
  const product: CatalogProduct = {
    ...rest,
    priceNGN: num(rest.priceNGN),
    compareAtPrice: num(rest.compareAtPrice),
    images: Array.isArray(rest.images) ? rest.images.filter(Boolean) : [],
    categoryId: rest.categoryId || undefined,
    category: category || null,
    categoryName: category?.title || undefined,
  };
  if (Array.isArray(product_prints)) {
    product.prints = product_prints
      .slice()
      .sort((a: { position: number }, b: { position: number }) => (a.position || 0) - (b.position || 0))
      .map((pp: { print: CatalogPrint | null }) => pp.print)
      .filter(Boolean) as CatalogPrint[];
  }
  return product;
}

export type ProductFilter = {
  /** "all", "rtw", "bespoke" or a category slug */
  collection?: string;
  categoryId?: string;
  ids?: string[];
  excludeIds?: string[];
  limit?: number;
  withImagesOnly?: boolean;
  includeUnpublished?: boolean;
  withPrints?: boolean;
};

/** Products, newest first. Returns [] until Supabase is connected. */
export async function listProducts(filter: ProductFilter = {}): Promise<CatalogProduct[]> {
  if (!isSupabaseConfigured()) return [];
  if (filter.ids && !filter.ids.length) return [];

  let q = db()
    .from("products")
    .select(filter.withPrints ? WITH_PRINTS : CARD_FIELDS)
    .order("created_at", { ascending: false });
  if (!filter.includeUnpublished) q = q.eq("is_published", true);

  const collection = filter.collection;
  if (collection === "rtw") q = q.in("product_type", ["ready-to-wear", "rtw"]);
  else if (collection === "bespoke") q = q.eq("product_type", "bespoke");
  else if (collection && collection !== "all") {
    const category = unwrap(
      await db().from("categories").select("id").eq("slug", collection).maybeSingle(),
      "Category lookup"
    ) as { id: string } | null;
    if (!category) return [];
    q = q.eq("category_id", category.id);
  }
  if (filter.categoryId) q = q.eq("category_id", filter.categoryId);
  if (filter.ids) q = q.in("id", filter.ids);
  if (filter.excludeIds?.length) q = q.not("id", "in", inList(filter.excludeIds));
  if (filter.withImagesOnly) q = q.neq("images", "{}");
  if (filter.limit) q = q.limit(filter.limit);

  const rows = unwrap(await q, "Loading products") as unknown[];
  return rows.map(toProduct);
}

/** Products for the given IDs, in the same order as `ids`. */
export async function productsByIds(ids: string[], opts: { withPrints?: boolean; includeUnpublished?: boolean } = {}) {
  const list = [...new Set((ids || []).map(String).filter(Boolean))].slice(0, 200);
  const rows = await listProducts({ ids: list, withPrints: opts.withPrints, includeUnpublished: opts.includeUnpublished });
  const byId = new Map(rows.map((p) => [p._id, p]));
  return list.map((id) => byId.get(id)).filter(Boolean) as CatalogProduct[];
}

export async function getProductBySlug(slug: string): Promise<(CatalogProduct & { reviews: CatalogReview[] }) | null> {
  if (!isSupabaseConfigured()) return null;
  const row = unwrap(
    await db().from("products").select(WITH_PRINTS).eq("slug", slug).eq("is_published", true).maybeSingle(),
    "Loading product"
  );
  if (!row) return null;
  const product = toProduct(row);
  const reviews = unwrap(
    await db()
      .from("reviews")
      .select("_id:id, name, rating, title, comment")
      .eq("product_id", product._id)
      .eq("approved", true)
      .order("created_at", { ascending: false }),
    "Loading reviews"
  ) as CatalogReview[];
  return { ...product, reviews: (reviews || []).map((r) => ({ ...r, title: r.title || "" })) };
}

export async function listCategories(): Promise<(CatalogCategory & { _updatedAt?: string })[]> {
  if (!isSupabaseConfigured()) return [];
  return unwrap(
    await db()
      .from("categories")
      .select("_id:id, title, slug, compositionCare:composition_care, sizeFit:size_fit, _updatedAt:updated_at")
      .order("title", { ascending: true }),
    "Loading categories"
  ) as (CatalogCategory & { _updatedAt?: string })[];
}

// ---- Small shapes for emails ----
export type ProductCardInfo = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  priceNGN?: number;
  category?: string;
  images: string[];
  briefDescription?: string | null;
};

export function toCardInfo(p: CatalogProduct): ProductCardInfo {
  return {
    _id: p._id,
    name: p.name,
    slug: p.slug || undefined,
    image: p.images[0] || undefined,
    images: p.images,
    priceNGN: p.priceNGN,
    category: p.categoryName,
    briefDescription: p.briefDescription,
  };
}

/** Newest published products as email cards, optionally leaving some out. */
export async function newestProductCards(opts: { excludeIds?: string[]; limit?: number } = {}) {
  const rows = await listProducts({ excludeIds: opts.excludeIds, limit: opts.limit ?? 4 });
  return rows.filter((p) => p.slug).map(toCardInfo);
}
