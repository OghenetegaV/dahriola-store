import Link from "next/link";
import { Plus } from "lucide-react";
import { db, unwrap } from "@/src/lib/supabase/admin";
import { searchTerm } from "@/src/lib/admin/data";
import { naira } from "@/src/lib/admin/format";
import { imageUrl } from "@/src/lib/images";
import { EmptyState, FilterTabs, PageHeader, SearchForm, Table, Td } from "@/src/components/admin/blocks";
import { Badge, Card } from "@/src/components/admin/ui";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "Products" };

type Row = {
  id: string;
  name: string;
  slug: string;
  product_type: string;
  images: string[] | null;
  price_ngn: number | null;
  is_published: boolean;
  category: { title: string } | null;
  product_prints: { print: { stock_quantity: number; is_active: boolean } | null }[];
};

const primaryLink = "inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-700";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; show?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const q = searchTerm(params.q);
  const show = ["hidden", "bespoke", "rtw"].includes(params.show || "") ? params.show! : "all";

  let query = db()
    .from("products")
    .select("id, name, slug, product_type, images, price_ngn, is_published, category:categories(title), product_prints(print:prints(stock_quantity, is_active))")
    .order("created_at", { ascending: false });
  if (q) query = query.ilike("name", `%${q}%`);
  if (show === "hidden") query = query.eq("is_published", false);
  if (show === "bespoke") query = query.eq("product_type", "bespoke");
  if (show === "rtw") query = query.neq("product_type", "bespoke");
  const products = unwrap(await query, "Loading products") as unknown as Row[];

  const href = (value: string) => {
    const sp = new URLSearchParams();
    if (value !== "all") sp.set("show", value);
    if (q) sp.set("q", q);
    const qs = sp.toString();
    return `/admin/products${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Everything in the shop. Open a product to change its photos, price, prints or description."
        action={
          <Link href="/admin/products/new" className={primaryLink}>
            <Plus size={16} /> Add product
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          tabs={[
            { value: "all", label: "All" },
            { value: "rtw", label: "Ready-to-wear" },
            { value: "bespoke", label: "Bespoke" },
            { value: "hidden", label: "Hidden" },
          ]}
          current={show}
          hrefFor={href}
        />
        <SearchForm placeholder="Search products" defaultValue={q} hidden={{ show: show === "all" ? undefined : show }} />
      </div>

      <Card padded={false}>
        {products.length === 0 ? (
          <EmptyState
            title={q || show !== "all" ? "No products match" : "No products yet"}
            text={q || show !== "all" ? "Try a different search or filter." : "Add your first piece to start selling."}
            action={
              !q && show === "all" ? (
                <Link href="/admin/products/new" className={primaryLink}>
                  <Plus size={16} /> Add product
                </Link>
              ) : undefined
            }
          />
        ) : (
          <Table head={["Product", "Category", "Price", "Prints", "Shop"]}>
            {products.map((p) => {
              const prints = p.product_prints.map((pp) => pp.print).filter((x): x is NonNullable<typeof x> => !!x && x.is_active);
              const inStock = prints.filter((x) => x.stock_quantity > 0).length;
              return (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <Td>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <span className="h-14 w-11 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                        {p.images?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl(p.images[0], { width: 120, height: 150 })} alt="" className="h-full w-full object-cover" loading="lazy" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-neutral-900 hover:underline">{p.name}</span>
                        <span className="block text-xs text-neutral-500">{p.product_type === "bespoke" ? "Bespoke" : "Ready-to-wear"}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td>{p.category?.title || <span className="text-neutral-400">None</span>}</Td>
                  <Td className="whitespace-nowrap tabular-nums">{p.price_ngn === null ? <span className="text-neutral-400">No price</span> : naira(p.price_ngn)}</Td>
                  <Td className="whitespace-nowrap">
                    {prints.length === 0 ? (
                      <span className="text-neutral-400">None</span>
                    ) : inStock === 0 ? (
                      <Badge tone="red">All sold out</Badge>
                    ) : (
                      `${inStock} of ${prints.length} in stock`
                    )}
                  </Td>
                  <Td>{p.is_published ? <Badge tone="green">Visible</Badge> : <Badge>Hidden</Badge>}</Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
