"use server";

// Products, prints, categories, discount codes and reviews.
import { db, unwrap } from "@/src/lib/supabase/admin";
import { UserError, adminAction, numberOrNull, refreshShop, text, textOrNull } from "@/src/lib/admin/action";
import { slugify } from "@/src/lib/admin/format";

const isUrl = (v: unknown): v is string => typeof v === "string" && /^https?:\/\//i.test(v);

// ───────────────────────────── Products ─────────────────────────────

export type ProductInput = {
  id?: string;
  name: string;
  slug?: string;
  briefDescription?: string;
  productType: string;
  categoryId?: string;
  images: string[];
  printIds: string[];
  priceNGN?: number | string | null;
  compareAtPrice?: number | string | null;
  productionTime?: string;
  description?: string;
  isPublished: boolean;
};

export async function saveProduct(input: ProductInput) {
  return adminAction<{ id: string }>(async () => {
    const name = text(input.name, 160);
    if (!name) throw new UserError("Give the product a name.");
    const slug = slugify(input.slug || name);
    if (!slug) throw new UserError("The page link needs at least one letter or number.");

    const productType = input.productType === "bespoke" ? "bespoke" : "ready-to-wear";
    const price = numberOrNull(input.priceNGN);
    if (price !== null && price < 0) throw new UserError("The price can't be negative.");
    const compareAt = numberOrNull(input.compareAtPrice);
    if (compareAt !== null && price !== null && compareAt <= price) {
      throw new UserError("The \"was\" price should be higher than the current price (or leave it empty).");
    }
    const productionTime = text(input.productionTime, 20);
    if (productionTime && !/^\d+(\s*-\s*\d+)?$/.test(productionTime)) {
      throw new UserError("Production time should be numbers only, like 2-4.");
    }

    const values = {
      name,
      slug,
      brief_description: textOrNull(input.briefDescription, 400),
      product_type: productType,
      category_id: text(input.categoryId, 100) || null,
      images: (Array.isArray(input.images) ? input.images : []).filter(isUrl).slice(0, 30),
      price_ngn: price,
      compare_at_price: compareAt,
      production_time: productionTime.replace(/\s+/g, "") || null,
      description: textOrNull(input.description, 8000),
      is_published: !!input.isPublished,
    };

    let id = text(input.id, 100);
    if (id) {
      unwrap(await db().from("products").update(values).eq("id", id), "Saving the product");
    } else {
      const row = unwrap(await db().from("products").insert(values).select("id").single(), "Creating the product") as { id: string };
      id = row.id;
    }

    // Replace the list of prints this product comes in
    const printIds = [...new Set((Array.isArray(input.printIds) ? input.printIds : []).map((p) => text(p, 100)).filter(Boolean))];
    unwrap(await db().from("product_prints").delete().eq("product_id", id), "Updating the prints");
    if (printIds.length) {
      unwrap(
        await db().from("product_prints").insert(printIds.map((print_id, position) => ({ product_id: id, print_id, position }))),
        "Updating the prints"
      );
    }

    refreshShop();
    return { id };
  });
}

export async function setProductPublished(id: string, isPublished: boolean) {
  return adminAction(async () => {
    unwrap(await db().from("products").update({ is_published: !!isPublished }).eq("id", id), "Updating the product");
    refreshShop();
  });
}

export async function deleteProduct(id: string) {
  return adminAction(async () => {
    unwrap(await db().from("products").delete().eq("id", id), "Deleting the product");
    refreshShop();
  });
}

// ───────────────────────────── Prints ─────────────────────────────

export type PrintInput = {
  id?: string;
  name: string;
  imageUrl?: string | null;
  stockQuantity: number | string;
  lowStockThreshold: number | string;
  isActive: boolean;
};

function wholeNumber(v: unknown, label: string) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) throw new UserError(`${label} should be a whole number, 0 or more.`);
  return n;
}

export async function savePrint(input: PrintInput) {
  return adminAction<{ id: string }>(async () => {
    const name = text(input.name, 120);
    if (!name) throw new UserError("Give the print a name.");
    const values = {
      name,
      image_url: isUrl(input.imageUrl) ? input.imageUrl : null,
      stock_quantity: wholeNumber(input.stockQuantity, "Stock"),
      low_stock_threshold: wholeNumber(input.lowStockThreshold, "The low-stock alert level"),
      is_active: !!input.isActive,
    };
    let id = text(input.id, 100);
    if (id) {
      unwrap(await db().from("prints").update(values).eq("id", id), "Saving the print");
    } else {
      const row = unwrap(await db().from("prints").insert(values).select("id").single(), "Creating the print") as { id: string };
      id = row.id;
    }
    refreshShop();
    return { id };
  });
}

/** Quick stock change from the list, without opening the print. */
export async function setPrintStock(id: string, quantity: number) {
  return adminAction(async () => {
    unwrap(
      await db().from("prints").update({ stock_quantity: wholeNumber(quantity, "Stock") }).eq("id", id),
      "Updating the stock"
    );
    refreshShop();
  });
}

export async function deletePrint(id: string) {
  return adminAction(async () => {
    unwrap(await db().from("prints").delete().eq("id", id), "Deleting the print");
    refreshShop();
  });
}

// ───────────────────────────── Categories ─────────────────────────────

export type CategoryInput = { id?: string; title: string; slug?: string; compositionCare?: string; sizeFit?: string };

const RESERVED_SLUGS = ["all", "rtw", "bespoke"];

export async function saveCategory(input: CategoryInput) {
  return adminAction<{ id: string }>(async () => {
    const title = text(input.title, 80);
    if (!title) throw new UserError("Give the category a name.");
    const slug = slugify(input.slug || title);
    if (!slug) throw new UserError("The page link needs at least one letter or number.");
    if (RESERVED_SLUGS.includes(slug)) throw new UserError(`"${slug}" is already used by a built-in shop page. Please pick another link.`);

    const values = {
      title,
      slug,
      composition_care: textOrNull(input.compositionCare, 4000),
      size_fit: textOrNull(input.sizeFit, 4000),
    };
    let id = text(input.id, 100);
    if (id) {
      unwrap(await db().from("categories").update(values).eq("id", id), "Saving the category");
    } else {
      const row = unwrap(await db().from("categories").insert(values).select("id").single(), "Creating the category") as { id: string };
      id = row.id;
    }
    refreshShop();
    return { id };
  });
}

export async function deleteCategory(id: string) {
  return adminAction(async () => {
    unwrap(await db().from("categories").delete().eq("id", id), "Deleting the category");
    refreshShop();
  });
}

// ───────────────────────────── Discount codes ─────────────────────────────

export type CouponInput = {
  id?: string;
  code: string;
  discountType: string;
  discountValue: number | string;
  isActive: boolean;
  firstOrderOnly: boolean;
  expiryDate?: string | null;
  assignedEmail?: string;
  usageLimit?: number | string | null;
};

export async function saveCoupon(input: CouponInput) {
  return adminAction<{ id: string }>(async () => {
    const code = text(input.code, 40).toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) throw new UserError("Use 3 or more letters and numbers for the code, with no spaces.");
    const discountType = input.discountType === "fixed" ? "fixed" : "percentage";
    const value = numberOrNull(input.discountValue);
    if (value === null || value <= 0) throw new UserError("Enter how much the code takes off.");
    if (discountType === "percentage" && value > 100) throw new UserError("A percentage can't be more than 100.");
    const limit = numberOrNull(input.usageLimit);
    if (limit !== null && (limit < 1 || !Number.isInteger(limit))) throw new UserError("The usage limit should be a whole number, 1 or more.");
    const email = text(input.assignedEmail, 160).toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new UserError("That email address doesn't look right.");

    const values = {
      code,
      discount_type: discountType,
      discount_value: value,
      is_active: !!input.isActive,
      first_order_only: !!input.firstOrderOnly,
      expiry_date: input.expiryDate || null,
      assigned_email: email || null,
      usage_limit: limit,
    };
    let id = text(input.id, 100);
    if (id) {
      unwrap(await db().from("coupons").update(values).eq("id", id), "Saving the code");
    } else {
      const row = unwrap(await db().from("coupons").insert(values).select("id").single(), "Creating the code") as { id: string };
      id = row.id;
    }
    return { id };
  });
}

export async function setCouponActive(id: string, isActive: boolean) {
  return adminAction(async () => {
    unwrap(await db().from("coupons").update({ is_active: !!isActive }).eq("id", id), "Updating the code");
  });
}

export async function deleteCoupon(id: string) {
  return adminAction(async () => {
    unwrap(await db().from("coupons").delete().eq("id", id), "Deleting the code");
  });
}

// ───────────────────────────── Reviews ─────────────────────────────

export async function setReviewApproved(id: string, approved: boolean) {
  return adminAction(async () => {
    unwrap(await db().from("reviews").update({ approved: !!approved }).eq("id", id), "Updating the review");
    refreshShop();
  });
}

export async function deleteReview(id: string) {
  return adminAction(async () => {
    unwrap(await db().from("reviews").delete().eq("id", id), "Deleting the review");
    refreshShop();
  });
}
