import { db, unwrap } from "@/src/lib/supabase/admin";
import type { ListAddress, ListItemDoc } from "@/src/lib/sharedLists";
import { formatDate } from "@/src/lib/admin/format";
import { EmptyState, PageHeader } from "@/src/components/admin/blocks";
import { Badge, Card } from "@/src/components/admin/ui";
import ListToggle from "./ListToggle";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "Gift lists" };

type Row = {
  id: string;
  kind: "wishlist" | "cart";
  public_id: string;
  owner_name: string | null;
  owner_email: string | null;
  message: string | null;
  active: boolean;
  items: ListItemDoc[] | null;
  delivery_address: ListAddress | null;
  created_at: string;
  updated_at: string;
};

export default async function ListsPage() {
  await requireAdmin();
  const lists = unwrap(
    await db()
      .from("shared_lists")
      .select("id, kind, public_id, owner_name, owner_email, message, active, items, delivery_address, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(300),
    "Loading gift lists"
  ) as Row[];

  return (
    <>
      <PageHeader
        title="Gift lists"
        description="Wishlists and carts customers have shared so someone else can buy for them. You can switch a link off here if you ever need to."
      />
      <Card padded={false}>
        {lists.length === 0 ? (
          <EmptyState title="No shared lists yet" text="When a customer shares their wishlist or cart, it appears here." />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {lists.map((l) => {
              const items = l.items || [];
              const gifted = items.filter((i) => i.purchased).length;
              return (
                <li key={l.id} className="flex flex-wrap items-start gap-x-4 gap-y-3 px-5 py-4">
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium text-neutral-900">
                        {l.owner_name || "Someone"}&apos;s {l.kind === "cart" ? "cart" : "wishlist"}
                      </span>
                      {!l.active && <Badge tone="red">Link off</Badge>}
                      {gifted > 0 && <Badge tone="violet">{gifted} gifted</Badge>}
                      {l.delivery_address?.line1 && <Badge>Address saved</Badge>}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {[l.owner_email, `${items.length} item${items.length === 1 ? "" : "s"}`, `updated ${formatDate(l.updated_at)}`].filter(Boolean).join(" · ")}
                    </p>
                    {items.length > 0 && (
                      <p className="mt-1.5 text-[13px] text-neutral-600">
                        {items
                          .slice(0, 6)
                          .map((i) => `${i.purchased ? "🎁 " : ""}${i.productName || "Item"}${i.size ? ` (${i.size})` : ""}`)
                          .join(", ")}
                        {items.length > 6 ? ` and ${items.length - 6} more` : ""}
                      </p>
                    )}
                    {l.message && <p className="mt-1.5 text-[13px] italic text-neutral-500">“{l.message}”</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <a href={`/list/${l.public_id}`} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-brand-beryl hover:underline">
                      Open list
                    </a>
                    <ListToggle id={l.id} active={l.active} owner={l.owner_name || "this customer"} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
