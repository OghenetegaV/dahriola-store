"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ExternalLink } from "lucide-react";
import { deleteProduct, saveProduct, type ProductInput } from "@/src/app/admin/actions/catalog";
import { slugify } from "@/src/lib/admin/format";
import { imageUrl } from "@/src/lib/images";
import ConfirmDelete from "@/src/components/admin/ConfirmDelete";
import TextEditor from "@/src/components/admin/TextEditor";
import { ImageListField } from "@/src/components/admin/uploads";
import { Badge, Button, Card, Field, Input, Select, Textarea, Toggle, cx, useAction } from "@/src/components/admin/ui";

export type PrintOption = { id: string; name: string; image_url: string | null; stock_quantity: number; is_active: boolean };
export type CategoryOption = { id: string; title: string };

export default function ProductForm({
  initial,
  categories,
  prints,
}: {
  initial: ProductInput;
  categories: CategoryOption[];
  prints: PrintOption[];
}) {
  const router = useRouter();
  const { busy, run } = useAction();
  const [form, setForm] = useState<ProductInput>(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [printSearch, setPrintSearch] = useState("");
  const set = (patch: Partial<ProductInput>) => setForm((f) => ({ ...f, ...patch }));

  const isNew = !initial.id;
  const bespoke = form.productType === "bespoke";
  const slug = slugTouched ? form.slug || "" : slugify(form.name);
  const dirty = useMemo(() => JSON.stringify({ ...form, slug }) !== JSON.stringify({ ...initial, slug: initial.slug || "" }), [form, slug, initial]);

  const shownPrints = prints.filter((p) => p.name.toLowerCase().includes(printSearch.trim().toLowerCase()));
  const togglePrint = (id: string) =>
    set({ printIds: form.printIds.includes(id) ? form.printIds.filter((x) => x !== id) : [...form.printIds, id] });

  const save = async () => {
    const res = await run(() => saveProduct({ ...form, slug }), isNew ? "Product added." : "Changes saved.");
    if (!res?.ok) return;
    if (isNew) router.push(`/admin/products/${res.id}`);
    router.refresh();
  };

  return (
    <div className="grid gap-6 pb-24 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card title="Details">
          <div className="space-y-4">
            <Field label="Product name">
              <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Wura Skirt" />
            </Field>
            <Field label="Short description" hint="One line shown next to the name on the product page.">
              <Textarea rows={2} value={form.briefDescription || ""} onChange={(e) => set({ briefDescription: e.target.value })} />
            </Field>
            <Field label="Full description">
              <TextEditor value={form.description || ""} onChange={(description) => set({ description })} rows={7} placeholder="Tell customers about the piece: the cut, the fabric, how it's worn…" />
            </Field>
          </div>
        </Card>

        <Card title="Photos" description="The first photo is the one shoppers see in the shop. Use the arrows to change the order.">
          <ImageListField
            folder="products"
            value={form.images.map((url) => ({ url }))}
            onChange={(items) => set({ images: items.map((i) => i.url) })}
            make={(image) => ({ url: image.url })}
          />
        </Card>

        <Card
          title="Prints this piece comes in"
          description="Tick every print or material customers can choose. Stock is managed under Prints & stock."
          action={
            <Link href="/admin/prints" className="whitespace-nowrap text-[13px] font-medium text-brand-beryl hover:underline">
              Manage prints
            </Link>
          }
        >
          {prints.length === 0 ? (
            <p className="text-sm text-neutral-500">
              You haven&apos;t added any prints yet.{" "}
              <Link href="/admin/prints" className="font-medium text-brand-beryl hover:underline">
                Add your first print
              </Link>
              .
            </p>
          ) : (
            <>
              {prints.length > 12 && (
                <Input value={printSearch} onChange={(e) => setPrintSearch(e.target.value)} placeholder="Search prints" className="mb-3 max-w-xs" />
              )}
              <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
                {shownPrints.map((p) => {
                  const selected = form.printIds.includes(p.id);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => togglePrint(p.id)}
                        aria-pressed={selected}
                        className={cx(
                          "relative block w-full overflow-hidden rounded-lg border-2 text-left transition",
                          selected ? "border-brand-beryl" : "border-transparent ring-1 ring-neutral-200 hover:ring-neutral-400"
                        )}
                      >
                        <span className="block aspect-square bg-neutral-100">
                          {p.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imageUrl(p.image_url, { width: 200, height: 200 })} alt="" className="h-full w-full object-cover" loading="lazy" />
                          )}
                        </span>
                        <span className="block px-2 py-1.5">
                          <span className="block truncate text-xs font-medium text-neutral-900">{p.name}</span>
                          <span className={cx("block text-[11px]", p.stock_quantity > 0 ? "text-neutral-500" : "text-red-600")}>
                            {!p.is_active ? "Hidden" : p.stock_quantity > 0 ? `${p.stock_quantity} in stock` : "Sold out"}
                          </span>
                        </span>
                        {selected && (
                          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-beryl text-white">
                            <Check size={12} />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-neutral-500">{form.printIds.length} selected</p>
            </>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Shop">
          <div className="space-y-4">
            <Toggle
              label="Show in the shop"
              hint="Turn off to hide this product without deleting it."
              checked={form.isPublished}
              onChange={(isPublished) => set({ isPublished })}
            />
            {!isNew && form.isPublished && initial.isPublished && (
              <a href={`/product/${initial.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-beryl hover:underline">
                <ExternalLink size={13} /> View on the shop
              </a>
            )}
          </div>
        </Card>

        <Card title="Type and category">
          <div className="space-y-4">
            <Field label="Product type">
              <Select value={form.productType} onChange={(e) => set({ productType: e.target.value })}>
                <option value="ready-to-wear">Ready-to-wear</option>
                <option value="bespoke">Bespoke / custom</option>
              </Select>
            </Field>
            <Field label="Category" hint="Size & fit and care details come from the category.">
              <Select value={form.categoryId || ""} onChange={(e) => set({ categoryId: e.target.value })}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        <Card title="Price">
          <div className="space-y-4">
            <Field label="Price (₦)" hint={bespoke ? "Bespoke pieces without a price can't be added to the cart." : "Prices in other currencies are worked out from this."}>
              <Input type="number" min={0} step="any" inputMode="decimal" value={form.priceNGN ?? ""} onChange={(e) => set({ priceNGN: e.target.value })} placeholder="e.g. 85000" />
            </Field>
            <Field label="Was (₦), optional" hint="Shown crossed out next to the price, for a sale.">
              <Input type="number" min={0} step="any" inputMode="decimal" value={form.compareAtPrice ?? ""} onChange={(e) => set({ compareAtPrice: e.target.value })} />
            </Field>
          </div>
        </Card>

        <Card title="Production time">
          <Field label="Working days" hint="Numbers only, like 2-4. The shop shows it as “2-4 working days”.">
            <Input value={form.productionTime || ""} onChange={(e) => set({ productionTime: e.target.value })} placeholder="2-4" />
          </Field>
        </Card>

        <Card title="Page link">
          <Field label="dahriola.com/product/…" hint="Made from the name. Changing it later breaks links people have already shared.">
            <Input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                set({ slug: e.target.value });
              }}
              onBlur={() => slugTouched && set({ slug: slugify(form.slug || "") })}
            />
          </Field>
        </Card>

        {!isNew && (
          <ConfirmDelete
            action={() => deleteProduct(initial.id!)}
            title="Delete this product?"
            redirectTo="/admin/products"
            successText="Product deleted."
            text={
              <>
                <strong>{initial.name}</strong> and its reviews will be removed for good. Past orders keep their record of it. If you only want to stop selling it for now, turn off
                “Show in the shop” instead.
              </>
            }
          >
            Delete product
          </ConfirmDelete>
        )}
      </div>

      {/* Save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="text-[13px] text-neutral-500">{dirty ? <Badge tone="amber">Unsaved changes</Badge> : isNew ? "Fill in the details, then save." : "All changes saved."}</span>
          <div className="flex gap-2">
            <Link href="/admin/products" className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100">
              {dirty ? "Cancel" : "Back"}
            </Link>
            <Button onClick={save} loading={busy} disabled={!dirty && !isNew}>
              {isNew ? "Add product" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
