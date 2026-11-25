"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Pencil, Plus } from "lucide-react";
import { deletePrint, savePrint, setPrintStock } from "@/src/app/admin/actions/catalog";
import type { PrintRow } from "@/src/lib/admin/data";
import { imageUrl } from "@/src/lib/images";
import ConfirmDelete from "@/src/components/admin/ConfirmDelete";
import { SingleImageField } from "@/src/components/admin/uploads";
import { Badge, Button, Card, Field, Input, Modal, Toggle, cx, useAction } from "@/src/components/admin/ui";

type Draft = { id?: string; name: string; imageUrl: string | null; stockQuantity: string; lowStockThreshold: string; isActive: boolean };
const EMPTY: Draft = { name: "", imageUrl: null, stockQuantity: "0", lowStockThreshold: "2", isActive: true };

function StockStepper({ print }: { print: PrintRow }) {
  const router = useRouter();
  const { busy, run } = useAction();
  const [value, setValue] = useState(String(print.stock_quantity));
  const number = Math.max(0, Math.floor(Number(value) || 0));
  const dirty = number !== print.stock_quantity;

  const commit = async (next: number) => {
    const safe = Math.max(0, next);
    setValue(String(safe));
    if (safe === print.stock_quantity) return;
    const res = await run(() => setPrintStock(print.id, safe), `${print.name}: stock set to ${safe}.`);
    if (res?.ok) router.refresh();
    else setValue(String(print.stock_quantity));
  };

  const step = "flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40";
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" className={step} disabled={busy || number === 0} onClick={() => commit(number - 1)} aria-label={`One fewer ${print.name}`}>
        <Minus size={14} />
      </button>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        disabled={busy}
        aria-label={`Stock for ${print.name}`}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => dirty && commit(number)}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className="h-8 w-16 rounded-md border border-neutral-300 bg-white text-center text-sm tabular-nums outline-none focus:border-brand-beryl focus:ring-2 focus:ring-brand-beryl/20"
      />
      <button type="button" className={step} disabled={busy} onClick={() => commit(number + 1)} aria-label={`One more ${print.name}`}>
        <Plus size={14} />
      </button>
    </div>
  );
}

export default function PrintsManager({
  prints,
  usage,
  lowCount,
  startOnLow,
}: {
  prints: PrintRow[];
  usage: Record<string, number>;
  lowCount: number;
  startOnLow: boolean;
}) {
  const router = useRouter();
  const { busy, run } = useAction();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");
  const [onlyLow, setOnlyLow] = useState(startOnLow && lowCount > 0);
  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const shown = prints
    .filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((p) => !onlyLow || (p.is_active && p.stock_quantity <= p.low_stock_threshold));

  const save = async () => {
    if (!draft) return;
    const res = await run(() => savePrint(draft), draft.id ? "Print saved." : "Print added.");
    if (res?.ok) {
      setDraft(null);
      router.refresh();
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search prints" className="max-w-xs" />
          {lowCount > 0 && (
            <button
              type="button"
              onClick={() => setOnlyLow((v) => !v)}
              className={cx(
                "inline-flex h-10 items-center rounded-full px-3.5 text-[13px] font-medium",
                onlyLow ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50"
              )}
            >
              Running low ({lowCount})
            </button>
          )}
        </div>
        <Button onClick={() => setDraft(EMPTY)}>
          <Plus size={16} /> Add print
        </Button>
      </div>

      <Card padded={false}>
        {shown.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-neutral-800">{prints.length ? "No prints match" : "No prints yet"}</p>
            <p className="mt-1 text-[13px] text-neutral-500">
              {prints.length ? "Try a different search." : "Add the fabrics and prints your pieces come in, then tick them on each product."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {shown.map((p) => {
              const low = p.is_active && p.stock_quantity <= p.low_stock_threshold;
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3.5">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {p.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl(p.image_url, { width: 140, height: 140 })} alt="" className="h-full w-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate text-sm font-medium text-neutral-900">{p.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
                      Used on {usage[p.id] || 0} product{(usage[p.id] || 0) === 1 ? "" : "s"}
                      {!p.is_active && <Badge>Hidden</Badge>}
                      {p.is_active && p.stock_quantity === 0 && <Badge tone="red">Sold out</Badge>}
                      {low && p.stock_quantity > 0 && <Badge tone="amber">Running low</Badge>}
                    </p>
                  </div>
                  <StockStepper key={`${p.id}-${p.stock_quantity}`} print={p} />
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        id: p.id,
                        name: p.name,
                        imageUrl: p.image_url,
                        stockQuantity: String(p.stock_quantity),
                        lowStockThreshold: String(p.low_stock_threshold),
                        isActive: p.is_active,
                      })
                    }
                    aria-label={`Edit ${p.name}`}
                    className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    <Pencil size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit print" : "Add a print"}
        footer={
          <>
            {draft?.id && (
              <div className="mr-auto">
                <ConfirmDelete
                  action={async () => {
                    const res = await deletePrint(draft.id!);
                    if (res.ok) setDraft(null);
                    return res;
                  }}
                  title="Delete this print?"
                  successText="Print deleted."
                  text={
                    <>
                      <strong>{draft.name}</strong> will be removed from every product that offers it. If it has just sold out, set its stock to 0 instead and customers can ask to be told when
                      it&apos;s back.
                    </>
                  }
                />
              </div>
            )}
            <Button variant="secondary" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={busy}>
              {draft?.id ? "Save" : "Add print"}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <Field label="Print name">
              <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Indigo Adire" autoFocus={!draft.id} />
            </Field>
            <Field label="Photo of the print">
              <SingleImageField folder="prints" value={draft.imageUrl} onChange={(imageUrl) => set({ imageUrl })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Outfits in stock" hint="How many can still be made.">
                <Input type="number" min={0} inputMode="numeric" value={draft.stockQuantity} onChange={(e) => set({ stockQuantity: e.target.value })} />
              </Field>
              <Field label="Warn me at" hint="You get an email at this number or below.">
                <Input type="number" min={0} inputMode="numeric" value={draft.lowStockThreshold} onChange={(e) => set({ lowStockThreshold: e.target.value })} />
              </Field>
            </div>
            <Toggle label="Available on the website" hint="Turn off to hide this print from shoppers." checked={draft.isActive} onChange={(isActive) => set({ isActive })} />
          </div>
        )}
      </Modal>
    </>
  );
}
