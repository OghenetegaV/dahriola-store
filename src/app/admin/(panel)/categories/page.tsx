import { db, unwrap } from "@/src/lib/supabase/admin";
import { PageHeader } from "@/src/components/admin/blocks";
import CategoriesManager, { type CategoryRow } from "./CategoriesManager";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdmin();
  const [categories, products] = await Promise.all([
    db().from("categories").select("id, title, slug, composition_care, size_fit").order("title").then((r) => unwrap(r, "Loading categories") as CategoryRow[]),
    db().from("products").select("category_id").not("category_id", "is", null).then((r) => unwrap(r, "Loading products") as { category_id: string }[]),
  ]);
  const usage: Record<string, number> = {};
  for (const p of products) usage[p.category_id] = (usage[p.category_id] || 0) + 1;

  return (
    <>
      <PageHeader
        title="Categories"
        description="Groups like Dresses or Pants. The care and size notes you write here show on every product in that category."
      />
      <CategoriesManager categories={categories} usage={usage} />
    </>
  );
}
