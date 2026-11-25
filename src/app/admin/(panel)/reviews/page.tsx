import Link from "next/link";
import { db, unwrap } from "@/src/lib/supabase/admin";
import { formatDate } from "@/src/lib/admin/format";
import { EmptyState, FilterTabs, PageHeader } from "@/src/components/admin/blocks";
import { Badge, Card } from "@/src/components/admin/ui";
import ReviewActions from "./ReviewActions";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "Reviews" };

type Row = {
  id: string;
  name: string;
  rating: number;
  title: string | null;
  comment: string;
  approved: boolean;
  created_at: string;
  product: { id: string; name: string; slug: string } | null;
};

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireAdmin();
  const { show: raw } = await searchParams;
  const all = unwrap(
    await db()
      .from("reviews")
      .select("id, name, rating, title, comment, approved, created_at, product:products(id, name, slug)")
      .order("created_at", { ascending: false })
      .limit(500),
    "Loading reviews"
  ) as unknown as Row[];

  const waiting = all.filter((r) => !r.approved);
  const show = raw === "published" || raw === "all" ? raw : "waiting";
  const reviews = show === "waiting" ? waiting : show === "published" ? all.filter((r) => r.approved) : all;

  return (
    <>
      <PageHeader title="Reviews" description="Reviews only show on the shop after you approve them." />

      <div className="mb-4">
        <FilterTabs
          tabs={[
            { value: "waiting", label: "Waiting for approval", count: waiting.length },
            { value: "published", label: "On the shop" },
            { value: "all", label: "All" },
          ]}
          current={show}
          hrefFor={(v) => (v === "waiting" ? "/admin/reviews" : `/admin/reviews?show=${v}`)}
        />
      </div>

      <Card padded={false}>
        {reviews.length === 0 ? (
          <EmptyState
            title={show === "waiting" ? "You're all caught up" : "No reviews yet"}
            text={show === "waiting" ? "New reviews will wait here for you to approve." : "Reviews customers leave on product pages will appear here."}
          />
        ) : (
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
                  <p className="mt-2 text-xs text-neutral-500">
                    {formatDate(r.created_at)}
                    {r.product && (
                      <>
                        {" · on "}
                        <Link href={`/admin/products/${r.product.id}`} className="text-brand-beryl hover:underline">
                          {r.product.name}
                        </Link>
                      </>
                    )}
                  </p>
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
