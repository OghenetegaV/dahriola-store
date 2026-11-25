import { db, unwrap } from "@/src/lib/supabase/admin";
import { isLowStock, listPrints } from "@/src/lib/admin/data";
import { PageHeader } from "@/src/components/admin/blocks";
import PrintsManager from "./PrintsManager";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "Prints & stock" };

export default async function PrintsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireAdmin();
  const { show } = await searchParams;
  const [prints, links] = await Promise.all([
    listPrints(),
    db().from("product_prints").select("print_id").then((r) => unwrap(r, "Loading print usage") as { print_id: string }[]),
  ]);
  const usage: Record<string, number> = {};
  for (const l of links) usage[l.print_id] = (usage[l.print_id] || 0) + 1;

  return (
    <>
      <PageHeader
        title="Prints & stock"
        description="Each print or material, and how many outfits can still be made from it. Stock goes down by itself when an order comes in."
      />
      <PrintsManager prints={prints} usage={usage} lowCount={prints.filter(isLowStock).length} startOnLow={show === "low"} />
    </>
  );
}
