import { notFound } from "next/navigation";
import { db, unwrap } from "@/src/lib/supabase/admin";
import { PageHeader } from "@/src/components/admin/blocks";
import ProductForm from "../ProductForm";
import { loadFormOptions } from "../options";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "Product" };

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  brief_description: string | null;
  product_type: string;
  category_id: string | null;
  images: string[] | null;
  price_ngn: number | null;
  compare_at_price: number | null;
  production_time: string | null;
  description: string | null;
  is_published: boolean;
  updated_at: string;
  product_prints: { print_id: string; position: number }[];
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [product, options] = await Promise.all([
    db()
      .from("products")
      .select("*, product_prints(print_id, position)")
      .eq("id", id)
      .maybeSingle()
      .then((r) => unwrap(r, "Loading the product") as ProductRow | null),
    loadFormOptions(),
  ]);
  if (!product) notFound();

  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "All products" }} title={product.name} />
      <ProductForm
        key={`${product.id}-${product.updated_at}`}
        {...options}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          briefDescription: product.brief_description || "",
          productType: product.product_type === "bespoke" ? "bespoke" : "ready-to-wear",
          categoryId: product.category_id || "",
          images: product.images || [],
          printIds: product.product_prints.slice().sort((a, b) => a.position - b.position).map((p) => p.print_id),
          priceNGN: product.price_ngn === null ? "" : String(product.price_ngn),
          compareAtPrice: product.compare_at_price === null ? "" : String(product.compare_at_price),
          productionTime: product.production_time || "",
          description: product.description || "",
          isPublished: product.is_published,
        }}
      />
    </>
  );
}
