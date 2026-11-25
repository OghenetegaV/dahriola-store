"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { deleteCoupon, saveCoupon, setCouponActive, type CouponInput } from "@/src/app/admin/actions/catalog";
import { formatDate, fromLagosInput, naira, toLagosInput } from "@/src/lib/admin/format";
import ConfirmDelete from "@/src/components/admin/ConfirmDelete";
import { Badge, Button, Card, Field, Input, Modal, Select, Toggle, cx, useAction } from "@/src/components/admin/ui";

export type CouponRow = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  is_active: boolean;
  first_order_only: boolean;
  expiry_date: string | null;
  assigned_email: string | null;
  usage_limit: number | null;
  times_used: number;
  purpose: string | null;
  created_at: string;
};

type Draft = Omit<CouponInput, "expiryDate"> & { expiryLocal: string };
const EMPTY: Draft = { code: "", discountType: "percentage", discountValue: "", isActive: true, firstOrderOnly: false, expiryLocal: "", assignedEmail: "", usageLimit: "" };

function state(c: CouponRow): { label: string; tone: "green" | "neutral" | "red" | "amber" } {
  if (!c.is_active) return { label: "Off", tone: "neutral" };
  if (c.expiry_date && new Date(c.expiry_date) < new Date()) return { label: "Expired", tone: "red" };
  if (c.usage_limit && c.times_used >= c.usage_limit) return { label: "Used up", tone: "amber" };
  return { label: "Active", tone: "green" };
}

const worth = (c: CouponRow) => (c.discount_type === "percentage" ? `${Number(c.discount_value)}% off` : `${naira(c.discount_value)} off`);

export default function CouponsManager({ coupons }: { coupons: CouponRow[] }) {
  const router = useRouter();
  const { busy, run } = useAction();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tab, setTab] = useState<"shared" | "personal">("shared");
  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  // Codes the website made for one person (birthday, anniversary, reminders)
  const personal = coupons.filter((c) => c.purpose);
  const shared = coupons.filter((c) => !c.purpose);
  const shown = tab === "shared" ? shared : personal;

  const save = async () => {
    if (!draft) return;
    const { expiryLocal, ...rest } = draft;
    const res = await run(() => saveCoupon({ ...rest, expiryDate: fromLagosInput(expiryLocal) }), draft.id ? "Code saved." : "Code created.");
    if (res?.ok) {
      setDraft(null);
      router.refresh();
    }
  };

  const tabClass = (active: boolean) =>
    cx("inline-flex items-center rounded-full px-3 py-1.5 text-[13px] font-medium", active ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50");

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          <button type="button" className={tabClass(tab === "shared")} onClick={() => setTab("shared")}>
            Your codes ({shared.length})
          </button>
          <button type="button" className={tabClass(tab === "personal")} onClick={() => setTab("personal")}>
            Automatic personal codes ({personal.length})
          </button>
        </div>
        <Button onClick={() => setDraft(EMPTY)}>
          <Plus size={16} /> Create code
        </Button>
      </div>

      <Card padded={false}>
        {shown.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-neutral-800">{tab === "shared" ? "No discount codes yet" : "No personal codes yet"}</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-neutral-500">
              {tab === "shared"
                ? "Create a code like WELCOME10 to share on Instagram or in your newsletter."
                : "These appear when the website emails someone a birthday, anniversary or reminder code."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {shown.map((c) => {
              const s = state(c);
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold tracking-wide text-neutral-900">{c.code}</span>
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {[
                        worth(c),
                        c.first_order_only && "first order only",
                        c.assigned_email && `only for ${c.assigned_email}`,
                        c.expiry_date && `ends ${formatDate(c.expiry_date)}`,
                        c.purpose,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-[13px] tabular-nums text-neutral-600">
                    Used {c.times_used}
                    {c.usage_limit ? ` of ${c.usage_limit}` : ""} time{c.times_used === 1 && !c.usage_limit ? "" : "s"}
                  </p>
                  <div className="flex items-center gap-1">
                    <Toggle
                      label=""
                      checked={c.is_active}
                      disabled={busy}
                      onChange={async (v) => {
                        const res = await run(() => setCouponActive(c.id, v), v ? `${c.code} is on.` : `${c.code} is off.`);
                        if (res?.ok) router.refresh();
                      }}
                    />
                    <button
                      type="button"
                      aria-label={`Edit ${c.code}`}
                      onClick={() =>
                        setDraft({
                          id: c.id,
                          code: c.code,
                          discountType: c.discount_type,
                          discountValue: String(Number(c.discount_value)),
                          isActive: c.is_active,
                          firstOrderOnly: c.first_order_only,
                          expiryLocal: toLagosInput(c.expiry_date),
                          assignedEmail: c.assigned_email || "",
                          usageLimit: c.usage_limit ? String(c.usage_limit) : "",
                        })
                      }
                      className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit discount code" : "Create a discount code"}
        footer={
          <>
            {draft?.id && (
              <div className="mr-auto">
                <ConfirmDelete
                  action={async () => {
                    const res = await deleteCoupon(draft.id!);
                    if (res.ok) setDraft(null);
                    return res;
                  }}
                  title="Delete this code?"
                  successText="Code deleted."
                  text={
                    <>
                      <strong>{draft.code}</strong> will stop working straight away. Past orders that used it keep their discount.
                    </>
                  }
                />
              </div>
            )}
            <Button variant="secondary" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={busy}>
              {draft?.id ? "Save" : "Create code"}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <Field label="Code" hint="What customers type at checkout. Letters and numbers, no spaces.">
              <Input value={draft.code} onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/\s+/g, "") })} placeholder="e.g. DAHRIOLA20" className="font-mono uppercase tracking-wide" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <Select value={draft.discountType} onChange={(e) => set({ discountType: e.target.value })}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed amount (₦)</option>
                </Select>
              </Field>
              <Field label={draft.discountType === "percentage" ? "Percent off" : "Naira off"} hint={draft.discountType === "percentage" ? "e.g. 10 for 10%" : "e.g. 5000 for ₦5,000"}>
                <Input type="number" min={0} step="any" inputMode="decimal" value={draft.discountValue} onChange={(e) => set({ discountValue: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ends (optional)" hint="Lagos time. Leave empty for no end date.">
                <Input type="datetime-local" value={draft.expiryLocal} onChange={(e) => set({ expiryLocal: e.target.value })} />
              </Field>
              <Field label="Usage limit (optional)" hint="Total paid orders that can use it.">
                <Input type="number" min={1} inputMode="numeric" value={draft.usageLimit ?? ""} onChange={(e) => set({ usageLimit: e.target.value })} placeholder="Unlimited" />
              </Field>
            </div>
            <Field label="Only for this email (optional)" hint="Makes it a personal code that works for one customer only.">
              <Input type="email" value={draft.assignedEmail || ""} onChange={(e) => set({ assignedEmail: e.target.value })} />
            </Field>
            <Toggle label="First order only" hint="Only works for customers who have never ordered before (checked by email)." checked={draft.firstOrderOnly} onChange={(firstOrderOnly) => set({ firstOrderOnly })} />
            <Toggle label="Active" hint="Turn off to pause the code without deleting it." checked={draft.isActive} onChange={(isActive) => set({ isActive })} />
          </div>
        )}
      </Modal>
    </>
  );
}
