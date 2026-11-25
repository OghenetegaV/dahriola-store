"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { confirmPayment, saveOrderNote, updateOrderCustomer, updateOrderStatus } from "@/src/app/admin/actions/orders";
import { ORDER_STEPS } from "@/src/lib/orderSteps";
import { Button, Field, Input, Modal, Select, Textarea, useAction, useToast } from "@/src/components/admin/ui";

const NEEDS_COURIER = ["shipped", "out_for_delivery", "delivered"];

export function StatusForm({
  id,
  initial,
  hasEmail,
}: {
  id: string;
  initial: { status: string; courier: string; trackingNumber: string; trackingUrl: string };
  hasEmail: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const { busy, run } = useAction();
  const [form, setForm] = useState({ ...initial, note: "" });
  const [notify, setNotify] = useState(hasEmail);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const changed = form.status !== initial.status;
  const showCourier = NEEDS_COURIER.includes(form.status) || !!form.courier || !!form.trackingNumber;
  // "Order received" is covered by the receipt, so no separate email goes out for it
  const canEmail = hasEmail && form.status !== "received";

  const save = async () => {
    const res = await run(() => updateOrderStatus(id, { ...form, notify: notify && canEmail }));
    if (!res?.ok) return;
    if (res.emailFailed) toast.error("Saved, but the email didn't send. It will be tried again tomorrow morning.");
    else toast.success(res.emailed ? "Saved, and the customer has been emailed." : "Saved.");
    set({ note: "" });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Field label="Status">
        <Select value={form.status} onChange={(e) => set({ status: e.target.value })}>
          {ORDER_STEPS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
          <option value="cancelled">Cancelled</option>
        </Select>
      </Field>

      {showCourier && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Courier" hint="e.g. DHL, GIG Logistics, UPS">
            <Input value={form.courier} onChange={(e) => set({ courier: e.target.value })} />
          </Field>
          <Field label="Tracking number">
            <Input value={form.trackingNumber} onChange={(e) => set({ trackingNumber: e.target.value })} />
          </Field>
          <Field
            label="Tracking link (optional)"
            hint="For DHL, UPS and FedEx the link is made from the tracking number for you. For other couriers, paste their tracking link."
            className="sm:col-span-2"
          >
            <Input type="url" placeholder="https://" value={form.trackingUrl} onChange={(e) => set({ trackingUrl: e.target.value })} />
          </Field>
        </div>
      )}

      {canEmail && (
        <div className="space-y-3 rounded-lg bg-neutral-50 p-4">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-neutral-800">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#778472]" />
            <span>
              Email the customer about this update
              {!changed && <span className="block text-xs text-neutral-500">The status hasn&apos;t changed, so this sends the same update again (for example, after adding a tracking number).</span>}
            </span>
          </label>
          {notify && (
            <Field label="Add a note to the email (optional)" hint='e.g. "Your outfit needs one extra day for finishing."'>
              <Textarea rows={2} value={form.note} onChange={(e) => set({ note: e.target.value })} />
            </Field>
          )}
        </div>
      )}

      <Button onClick={save} loading={busy}>
        {notify && canEmail ? "Save and email customer" : "Save"}
      </Button>
    </div>
  );
}

export function InternalNote({ id, initial }: { id: string; initial: string }) {
  const { busy, run } = useAction();
  const [note, setNote] = useState(initial);
  const [saved, setSaved] = useState(initial);
  return (
    <div className="space-y-3">
      <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Measurements to double-check, who is sewing it, anything to remember…" />
      <Button
        variant="secondary"
        size="sm"
        loading={busy}
        disabled={note === saved}
        onClick={async () => {
          const res = await run(() => saveOrderNote(id, note), "Note saved.");
          if (res?.ok) setSaved(note);
        }}
      >
        Save note
      </Button>
    </div>
  );
}

export function CustomerEditor({ id, initial }: { id: string; initial: { name: string; email: string; phone: string; address: string } }) {
  const router = useRouter();
  const { busy, run } = useAction();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setForm(initial);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-beryl hover:underline"
      >
        <Pencil size={13} /> Edit
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit customer details"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={busy}
              onClick={async () => {
                const res = await run(() => updateOrderCustomer(id, form), "Customer details saved.");
                if (res?.ok) {
                  setOpen(false);
                  router.refresh();
                }
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Email" hint="Order updates are sent here.">
            <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="Delivery address">
            <Textarea rows={3} value={form.address} onChange={(e) => set({ address: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </>
  );
}

export function ConfirmPaymentButton({ id }: { id: string }) {
  const router = useRouter();
  const { busy, run } = useAction();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        I&apos;ve checked: mark as paid
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Mark this order as paid?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Not yet
            </Button>
            <Button
              loading={busy}
              onClick={async () => {
                const res = await run(() => confirmPayment(id), "Marked as paid.");
                if (res?.ok) {
                  setOpen(false);
                  router.refresh();
                }
              }}
            >
              Yes, the money arrived
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600">
          Only do this once you can see the full payment for this order in your Paystack dashboard. It can&apos;t be undone from here.
        </p>
      </Modal>
    </>
  );
}
