import { notFound } from "next/navigation";
import { db, unwrap } from "@/src/lib/supabase/admin";
import Link from "next/link";
import { PageHeader } from "@/src/components/admin/blocks";
import { Badge, Card } from "@/src/components/admin/ui";
import { formatDate } from "@/src/lib/admin/format";
import ReviewActions from "../../reviews/ReviewActions";
import ProductForm from "../ProductForm";
import { loadFormOptions } from "../options";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "Product" };

type ReviewRow = { id: string; name: string; rating: number; title: string | null; comment: string; approved: boolean; created_at: string };

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
  const [product, options, reviews] = await Promise.all([
    db()
      .from("products")
      .select("*, product_prints(print_id, position)")
      .eq("id", id)
      .maybeSingle()
      .then((r) => unwrap(r, "Loading the product") as ProductRow | null),
    loadFormOptions(),
    db()
      .from("reviews")
      .select("id, name, rating, title, comment, approved, created_at")
      .eq("product_id", id)
      .order("approved", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(100)
      .then((r) => unwrap(r, "Loading reviews") as ReviewRow[]),
  ]);
  const waiting = reviews.filter((r) => !r.approved).length;
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

      <Card
        title="Customer reviews"
        description={
          reviews.length === 0
            ? "No one has reviewed this product yet."
            : waiting
              ? `${waiting} waiting for your approval. A review only shows on the shop after you approve it.`
              : "A review only shows on the shop after you approve it."
        }
        className="mt-6"
        padded={false}
        action={
          <Link href="/admin/reviews" className="text-[13px] font-medium text-brand-beryl hover:underline">
            All reviews
          </Link>
        }
      >
        {reviews.length > 0 && (
          <ul className="divide-y divide-neutral-100">
            {reviews.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="tracking-tight text-amber-500" aria-label={`${r.rating} out of 5 stars`}>
                      {"★".repeat(r.rating)}
                      <span className="text-neutral-300">{"★".repeat(Math.max(0, 5 - r.rating))}</span>
                    </span>
                    <span className="font-medium text-neutral-900">{r.name}</span>
                    {r.approved ? <Badge tone="green">On the shop</Badge> : <Badge tone="amber">Waiting</Badge>}
                  </p>
                  {r.title && r.title !== "Customer Review" && <p className="mt-1.5 text-sm font-medium text-neutral-800">{r.title}</p>}
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-neutral-700">{r.comment}</p>
                  <p className="mt-2 text-xs text-neutral-500">{formatDate(r.created_at)}</p>
                </div>
                <ReviewActions id={r.id} approved={r.approved} name={r.name} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
