import "server-only";
import { db, unwrap } from "@/src/lib/supabase/admin";
import type { ProductOption } from "./EventForm";

/** Products and discount codes to choose from on the event form. */
export async function loadEventOptions() {
  const [products, coupons] = await Promise.all([
    db()
      .from("products")
      .select("id, name, images")
      .order("created_at", { ascending: false })
      .then((r) => unwrap(r, "Loading products") as { id: string; name: string; images: string[] | null }[]),
    db()
      .from("coupons")
      .select("code")
      .eq("is_active", true)
      .is("purpose", null)
      .order("created_at", { ascending: false })
      .limit(200)
      .then((r) => unwrap(r, "Loading discount codes") as { code: string }[]),
  ]);
  return {
    products: products.map((p): ProductOption => ({ id: p.id, name: p.name, image: p.images?.[0] || null })),
    codes: coupons.map((c) => c.code),
  };
}
