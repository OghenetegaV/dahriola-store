"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { deleteCategory, saveCategory, type CategoryInput } from "@/src/app/admin/actions/catalog";
import { slugify } from "@/src/lib/admin/format";
import ConfirmDelete from "@/src/components/admin/ConfirmDelete";
import TextEditor from "@/src/components/admin/TextEditor";
import { Button, Card, Field, Input, Modal, useAction } from "@/src/components/admin/ui";

export type CategoryRow = { id: string; title: string; slug: string; composition_care: string | null; size_fit: string | null };

export default function CategoriesManager({ categories, usage }: { categories: CategoryRow[]; usage: Record<string, number> }) {
  const router = useRouter();
  const { busy, run } = useAction();
  const [draft, setDraft] = useState<CategoryInput | null>(null);
  const set = (patch: Partial<CategoryInput>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const save = async () => {
    if (!draft) return;
    const res = await run(() => saveCategory(draft), draft.id ? "Category saved." : "Category added.");
    if (res?.ok) {
      setDraft(null);
      router.refresh();
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setDraft({ title: "", slug: "", compositionCare: "", sizeFit: "" })}>
          <Plus size={16} /> Add category
        </Button>
      </div>

      <Card padded={false}>
        {categories.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-neutral-800">No categories yet</p>
            <p className="mt-1 text-[13px] text-neutral-500">Add categories such as Dresses, Pants or Jackets, then choose one on each product.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900">{c.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {usage[c.id] || 0} product{(usage[c.id] || 0) === 1 ? "" : "s"} · dahriola.com/category/{c.slug}
                    {!c.composition_care && !c.size_fit && " · no care or size notes yet"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Edit ${c.title}`}
                  onClick={() => setDraft({ id: c.id, title: c.title, slug: c.slug, compositionCare: c.composition_care || "", sizeFit: c.size_fit || "" })}
                  className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                >
                  <Pencil size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        wide
        title={draft?.id ? "Edit category" : "Add a category"}
        footer={
          <>
            {draft?.id && (
              <div className="mr-auto">
                <ConfirmDelete
                  action={async () => {
                    const res = await deleteCategory(draft.id!);
                    if (res.ok) setDraft(null);
                    return res;
                  }}
                  title="Delete this category?"
                  successText="Category deleted."
                  text={
                    <>
                      <strong>{draft.title}</strong> will be removed. Its {usage[draft.id] || 0} product{(usage[draft.id] || 0) === 1 ? "" : "s"} stay in the shop but won&apos;t have a category until
                      you pick a new one.
                    </>
                  }
                />
              </div>
            )}
            <Button variant="secondary" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={busy}>
              {draft?.id ? "Save" : "Add category"}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input value={draft.title} onChange={(e) => set({ title: e.target.value, ...(draft.id ? {} : { slug: slugify(e.target.value) }) })} placeholder="e.g. Dresses" />
              </Field>
              <Field
                label="Page link"
                hint={draft.id ? "Changing this breaks links already shared. The shop uses “dresses” and “jackets” for sizing rules." : "dahriola.com/category/…"}
              >
                <Input value={draft.slug || ""} onChange={(e) => set({ slug: e.target.value })} onBlur={() => set({ slug: slugify(draft.slug || "") })} />
              </Field>
            </div>
            <Field label="Composition & care" hint="Shown on every product in this category.">
              <TextEditor value={draft.compositionCare || ""} onChange={(compositionCare) => set({ compositionCare })} rows={5} />
            </Field>
            <Field label="Size & fit" hint="Shown on every product in this category.">
              <TextEditor value={draft.sizeFit || ""} onChange={(sizeFit) => set({ sizeFit })} rows={5} />
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}
