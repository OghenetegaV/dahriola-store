import type { Metadata } from "next";
import Link from "next/link";
import { Check, ExternalLink, Gift, Package, Truck, X } from "lucide-react";
import { ORDER_STEPS, getTrackedOrder, statusLabel, verifyTrackToken } from "@/src/lib/orderStatus";
import TrackForm from "./TrackForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Track your order", robots: { index: false, follow: false } };

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" }) : "";

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ o?: string; t?: string }> }) {
  const { o = "", t = "" } = await searchParams;
  const order = o && t && verifyTrackToken(o, t) ? await getTrackedOrder(o) : null;

  return (
    <main className="min-h-screen bg-[#F7F6F5] px-4 pt-32 pb-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.4em] text-brand-beryl">DAHRIOLA</p>
        <h1 className="mt-4 text-center font-display text-4xl tracking-[-0.03em] md:text-5xl">Track your order</h1>

        {!order ? (
          <>
            {o && t && (
              <p className="mx-auto mt-6 max-w-md rounded-xl bg-white p-4 text-center text-sm text-neutral-600 border border-neutral-200">
                That tracking link isn&apos;t valid any more. Enter your details below instead.
              </p>
            )}
            <TrackForm />
          </>
        ) : (
          <OrderView order={order} />
        )}
      </div>
    </main>
  );
}

function OrderView({ order }: { order: NonNullable<Awaited<ReturnType<typeof getTrackedOrder>>> }) {
  const cancelled = order.status === "cancelled";
  const current = ORDER_STEPS.findIndex((s) => s.value === order.status);
  const when = (value: string) => [...order.history].reverse().find((h) => h.status === value)?.at;

  return (
    <div className="mt-10 space-y-6">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 md:p-10">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Order {order.orderNumber.toUpperCase()}</p>
            <p className="mt-2 font-display text-3xl tracking-[-0.02em]">{statusLabel(order.status)}</p>
          </div>
          {order.createdAt && <p className="text-sm text-neutral-500">Placed {fmtDate(order.createdAt)}</p>}
        </div>

        {order.isGift && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-beryl/10 px-4 py-2 text-xs text-brand-beryl">
            <Gift size={13} /> Gift{order.giftRecipient ? ` for ${order.giftRecipient.split(" ")[0]}` : ""}
          </p>
        )}

        {cancelled ? (
          <p className="mt-8 flex items-center gap-3 rounded-2xl bg-neutral-50 p-5 text-sm text-neutral-600">
            <X size={18} className="text-neutral-400" /> This order was cancelled. If you have questions, reply to any of our emails and we&apos;ll help.
          </p>
        ) : (
          <ol className="mt-10 space-y-0">
            {ORDER_STEPS.map((step, i) => {
              const done = i <= current;
              const isCurrent = i === current;
              const date = when(step.value);
              return (
                <li key={step.value} className="relative flex gap-4 pb-8 last:pb-0">
                  {i < ORDER_STEPS.length - 1 && (
                    <span className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px ${i < current ? "bg-brand-beryl" : "bg-neutral-200"}`} aria-hidden="true" />
                  )}
                  <span
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                      done ? "border-brand-beryl bg-brand-beryl text-white" : "border-neutral-300 bg-white text-neutral-300"
                    } ${isCurrent ? "ring-4 ring-brand-beryl/15" : ""}`}
                  >
                    {done ? <Check size={15} /> : <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />}
                  </span>
                  <div className="pt-1">
                    <p className={`text-sm ${done ? "font-semibold text-neutral-900" : "text-neutral-400"}`}>{step.label}</p>
                    {isCurrent && <p className="mt-0.5 text-sm text-neutral-500">{step.blurb}</p>}
                    {done && date && <p className="mt-0.5 text-xs text-neutral-400">{fmtDate(date)}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {(order.courier || order.trackingNumber) && (
          <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-[#F7F6F5] p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3 text-sm">
              <Truck size={18} className="mt-0.5 text-brand-beryl" />
              <div>
                {order.courier && <p className="font-medium">{order.courier}</p>}
                {order.trackingNumber && <p className="text-neutral-500">Tracking number: {order.trackingNumber}</p>}
              </div>
            </div>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-white"
              >
                Track with courier <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}
      </div>

      {order.items.length > 0 && (
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 md:p-8">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
            <Package size={13} /> Your order
          </p>
          <ul className="mt-5 divide-y divide-neutral-100">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center gap-4 py-4">
                <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${item.image}?w=160&h=200&fit=crop&auto=format`} alt={item.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="text-sm">
                  {item.slug ? (
                    <Link href={`/product/${item.slug}`} className="font-medium hover:underline">
                      {item.name}
                    </Link>
                  ) : (
                    <p className="font-medium">{item.name}</p>
                  )}
                  <p className="text-neutral-500">
                    {[item.size && `Size ${item.size}`, item.selectedPrintName, (item.quantity || 1) > 1 && `Qty ${item.quantity}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-sm text-neutral-500">
        Questions about your order? Reply to any of our emails or{" "}
        <Link href="/bespoke" className="underline">
          get in touch
        </Link>
        .
      </p>
    </div>
  );
}
