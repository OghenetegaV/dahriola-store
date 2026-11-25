import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db, unwrap } from "@/src/lib/supabase/admin";
import { productsByIds } from "@/src/lib/catalog";
import { effectiveStatus, type OrderRow } from "@/src/lib/admin/data";
import { STATUS_TONES, formatDateTime, naira } from "@/src/lib/admin/format";
import { courierTrackingUrl, statusLabel } from "@/src/lib/orderSteps";
import { trackUrl } from "@/src/lib/orderStatus";
import { imageUrl } from "@/src/lib/images";
import { DetailList, PageHeader } from "@/src/components/admin/blocks";
import { Badge, Card } from "@/src/components/admin/ui";
import { ConfirmPaymentButton, CustomerEditor, InternalNote, StatusForm } from "./OrderControls";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = unwrap(await db().from("orders").select("*").eq("id", id).maybeSingle(), "Loading the order") as OrderRow | null;
  if (!order) notFound();

  const items = Array.isArray(order.items) ? order.items : [];
  const products = await productsByIds(items.map((i) => i.productId || "").filter(Boolean), { includeUnpublished: true });
  const byId = new Map(products.map((p) => [p._id, p]));
  const status = effectiveStatus(order);
  const history = (order.status_history || []).slice().reverse();
  const tracking = order.tracking_url || courierTrackingUrl(order.courier || undefined, order.tracking_number || undefined);
  const yesNo = (v: boolean) => (v ? "Yes" : "No");

  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "All orders" }}
        title={`Order ${order.order_number}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            Placed {formatDateTime(order.created_at)}
            <Badge tone={STATUS_TONES[status]}>{statusLabel(status)}</Badge>
            {order.is_gift && <Badge tone="violet">Gift</Badge>}
            {order.payment_verified ? <Badge tone="green">Paid</Badge> : <Badge tone="red">Payment unconfirmed</Badge>}
          </span>
        }
        action={
          <a
            href={trackUrl(order.order_number).replace(/^https?:\/\/[^/]+/, "")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            <ExternalLink size={15} /> Customer&apos;s tracking page
          </a>
        }
      />

      {!order.payment_verified && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">This payment couldn&apos;t be confirmed automatically</p>
          <p className="mt-1 text-sm text-amber-900/80">
            {order.verification_note || "Check it in your Paystack dashboard before making the order."}
            {order.payment_reference && (
              <>
                {" "}
                Paystack reference: <span className="font-mono">{order.payment_reference}</span>
              </>
            )}
          </p>
          <div className="mt-3">
            <ConfirmPaymentButton id={order.id} />
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Items" padded={false}>
            <ul className="divide-y divide-neutral-100">
              {items.map((item, i) => {
                const product = item.productId ? byId.get(item.productId) : undefined;
                const details = [
                  item.size && `Size ${item.size}`,
                  item.selectedPrintName && `Print: ${item.selectedPrintName}`,
                  item.heightLength && `Height / length: ${item.heightLength}`,
                  item.gender && `Fit: ${item.gender}`,
                ].filter(Boolean);
                return (
                  <li key={i} className="flex gap-4 px-5 py-4">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      {product?.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl(product.images[0], { width: 160, height: 200 })} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-neutral-900">
                          {item.name} <span className="font-normal text-neutral-500">× {item.quantity || 1}</span>
                        </p>
                        <p className="shrink-0 text-sm tabular-nums text-neutral-900">{naira((Number(item.price) || 0) * (Number(item.quantity) || 1))}</p>
                      </div>
                      {details.length > 0 && <p className="mt-1 text-[13px] text-neutral-600">{details.join(" · ")}</p>}
                      {item.notes && <p className="mt-1.5 rounded-md bg-neutral-50 px-2.5 py-1.5 text-[13px] text-neutral-700">Note: {item.notes}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
            <dl className="space-y-1.5 border-t border-neutral-100 px-5 py-4 text-sm">
              <div className="flex justify-between text-neutral-600">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{naira(order.subtotal)}</dd>
              </div>
              {!!Number(order.discount_amount) && (
                <div className="flex justify-between text-neutral-600">
                  <dt>Discount{order.discount_code ? ` (${order.discount_code})` : ""}</dt>
                  <dd className="tabular-nums">−{naira(order.discount_amount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <dt>Shipping{order.shipping_method ? ` · ${order.shipping_method}` : ""}</dt>
                <dd className="tabular-nums">{naira(order.shipping_fee)}</dd>
              </div>
              <div className="flex justify-between border-t border-neutral-100 pt-2 text-base font-semibold text-neutral-900">
                <dt>Total</dt>
                <dd className="tabular-nums">{naira(order.total_amount)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Update this order" description="Choose where the order is up to. The customer gets an email and their tracking page updates.">
            <StatusForm
              id={order.id}
              initial={{
                status,
                courier: order.courier || "",
                trackingNumber: order.tracking_number || "",
                trackingUrl: order.tracking_url || "",
              }}
              hasEmail={!!order.customer_email}
            />
          </Card>

          <Card title="Timeline">
            {history.length === 0 ? (
              <p className="text-sm text-neutral-500">No updates recorded yet.</p>
            ) : (
              <ol className="space-y-4">
                {history.map((h, i) => (
                  <li key={i} className="flex gap-3">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? "bg-brand-beryl" : "bg-neutral-300"}`} />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{statusLabel(h.status)}</p>
                      <p className="text-xs text-neutral-500">{formatDateTime(h.at)}</p>
                      {h.note && <p className="mt-1 text-[13px] text-neutral-600">“{h.note}”</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title="Customer"
            action={
              <CustomerEditor
                id={order.id}
                initial={{
                  name: order.customer_name || "",
                  email: order.customer_email || "",
                  phone: order.customer_phone || "",
                  address: order.shipping_address || "",
                }}
              />
            }
          >
            <DetailList
              rows={[
                ["Name", order.customer_name],
                ["Email", order.customer_email && <a href={`mailto:${order.customer_email}`} className="text-brand-beryl hover:underline">{order.customer_email}</a>],
                ["Phone", order.customer_phone && <a href={`tel:${order.customer_phone}`} className="text-brand-beryl hover:underline">{order.customer_phone}</a>],
                ["Deliver to", order.shipping_address],
                ["Shipping", order.shipping_method],
              ]}
            />
            {order.customer_email && (
              <Link href={`/admin/orders?q=${encodeURIComponent(order.customer_email)}`} className="mt-3 inline-block text-[13px] font-medium text-brand-beryl hover:underline">
                See all orders from this customer
              </Link>
            )}
          </Card>

          {order.is_gift && (
            <Card title="Gift order">
              <DetailList
                rows={[
                  ["For", order.gift_recipient],
                  ["Delivery", order.gift_deliver_to_owner ? "To the recipient's saved address" : "To the address the buyer entered"],
                  ["Message", order.gift_message],
                  ["Gift list", order.gift_list_id && <Link href={`/list/${order.gift_list_id}`} target="_blank" className="text-brand-beryl hover:underline">Open the list</Link>],
                ]}
              />
            </Card>
          )}

          <Card title="Delivery">
            <DetailList
              rows={[
                ["Courier", order.courier],
                ["Tracking no.", order.tracking_number],
                ["Tracking link", tracking && <a href={tracking} target="_blank" rel="noopener noreferrer" className="break-all text-brand-beryl hover:underline">Open courier tracking</a>],
                ["Delivered", order.delivered_at && formatDateTime(order.delivered_at)],
              ]}
            />
            {!order.courier && !order.tracking_number && <p className="text-sm text-neutral-500">No courier details yet. Add them when you mark the order as shipped.</p>}
          </Card>

          <Card title="Payment">
            <DetailList
              rows={[
                ["Paid", order.amount_paid !== null ? naira(order.amount_paid) : "—"],
                ["Reference", order.payment_reference && <span className="font-mono text-[13px]">{order.payment_reference}</span>],
                ["Shopper saw", order.display_currency && `${order.display_currency} ${Number(order.display_total || 0).toLocaleString()}`],
                ["Note", order.verification_note],
                ["Receipt emailed", order.receipt_sent_at && formatDateTime(order.receipt_sent_at)],
                ["Review request", order.review_request_sent_at && formatDateTime(order.review_request_sent_at)],
              ]}
            />
          </Card>

          <Card title="Marketing">
            <DetailList rows={[["Email offers", yesNo(order.email_opt_in)], ["Text offers", yesNo(order.text_opt_in)]]} />
          </Card>

          <Card title="Private note" description="Only your team sees this.">
            <InternalNote id={order.id} initial={order.internal_note || ""} />
          </Card>
        </div>
      </div>
    </>
  );
}
