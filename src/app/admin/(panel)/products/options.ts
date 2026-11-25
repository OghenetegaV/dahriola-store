import "server-only";
import { db, unwrap } from "@/src/lib/supabase/admin";
import type { CategoryOption, PrintOption } from "./ProductForm";

/** Categories and prints to choose from on the product form. */
export async function loadFormOptions() {
  const [categories, prints] = await Promise.all([
    db().from("categories").select("id, title").order("title").then((r) => unwrap(r, "Loading categories") as CategoryOption[]),
    db().from("prints").select("id, name, image_url, stock_quantity, is_active").order("name").then((r) => unwrap(r, "Loading prints") as PrintOption[]),
  ]);
  return { categories, prints };
}
