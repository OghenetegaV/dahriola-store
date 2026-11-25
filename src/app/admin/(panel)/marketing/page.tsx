import { ExternalLink } from "lucide-react";
import { db, unwrap } from "@/src/lib/supabase/admin";
import { getMarketingSettings } from "@/src/lib/marketing";
import type { SavedCartItem } from "@/src/lib/abandonedCarts";
import { formatDate, formatDateTime, naira, timeAgo } from "@/src/lib/admin/format";
import { EmptyState, FilterTabs, PageHeader, Table, Td } from "@/src/components/admin/blocks";
import { Badge, Card } from "@/src/components/admin/ui";
import MarketingSettingsForm from "./MarketingSettingsForm";
import ResubscribeButton from "./ResubscribeButton";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "Emails & marketing" };

// Where newsletters and campaigns are written. The website itself sends through Brevo.
const EMAIL_TOOLS = [
  { name: "Mailchimp", href: "https://login.mailchimp.com/" },
  { name: "Brevo", href: "https://app.brevo.com/" },
];

const TABS = [
  { value: "settings", label: "Automatic emails" },
  { value: "checkouts", label: "Abandoned checkouts" },
  { value: "stock", label: "Back-in-stock requests" },
  { value: "sent", label: "Emails sent" },
  { value: "browsing", label: "Browsing follow-ups" },
  { value: "unsubscribed", label: "Unsubscribed" },
];

const KINDS: Record<string, string> = {
  birthday: "Birthday",
  anniversary: "Anniversary",
  "review-request": "Review request",
  "abandoned-cart": "Checkout reminder",
};
const kindLabel = (kind: string | null) => {
  if (!kind) return "Email";
  if (kind.startsWith("browse-")) return `Browse follow-up ${kind.split("-")[1]}`;
  return KINDS[kind] || kind;
};

export default async function MarketingPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const { tab: raw } = await searchParams;
  const tab = TABS.some((t) => t.value === raw) ? raw! : "settings";

  return (
    <>
      <PageHeader
        title="Emails & marketing"
        description="Choose which emails the website sends by itself, and see what has gone out. Newsletters and campaigns are written and sent in your email tool."
        action={
          <>
            {EMAIL_TOOLS.map((tool) => (
              <a
                key={tool.name}
                href={tool.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 hover:border-neutral-500"
              >
                Open {tool.name} <ExternalLink size={15} />
              </a>
            ))}
          </>
        }
      />
      <div className="mb-5">
        <FilterTabs tabs={TABS} current={tab} hrefFor={(v) => (v === "settings" ? "/admin/marketing" : `/admin/marketing?tab=${v}`)} />
      </div>

      {tab === "settings" && <MarketingSettingsForm initial={await getMarketingSettings()} />}
      {tab === "checkouts" && <Checkouts />}
      {tab === "stock" && <StockRequests />}
      {tab === "sent" && <Sent />}
      {tab === "browsing" && <Browsing />}
      {tab === "unsubscribed" && <Unsubscribed />}
    </>
  );
}

async function Checkouts() {
  const rows = unwrap(
    await db()
      .from("abandoned_carts")
      .select("id, email, name, subtotal, items, updated_at, reminder_sent_at, recovered_at")
      .order("updated_at", { ascending: false })
      .limit(200),
    "Loading checkouts"
  ) as { id: string; email: string; name: string | null; subtotal: number | null; items: SavedCartItem[] | null; updated_at: string; reminder_sent_at: string | null; recovered_at: string | null }[];

  return (
    <Card padded={false} title="Abandoned checkouts" description="People who entered their email at checkout. Shown newest first.">
      {rows.length === 0 ? (
        <EmptyState title="Nothing here yet" text="Checkouts that are started but not paid for will show up here." />
      ) : (
        <Table head={["Shopper", "In their bag", "Value", "Last active", "Outcome"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td>
                <span className="block font-medium text-neutral-900">{r.name || r.email}</span>
                {r.name && <span className="block text-xs text-neutral-500">{r.email}</span>}
              </Td>
              <Td className="max-w-xs text-[13px]">
                {(r.items || []).map((i) => `${i.quantity > 1 ? `${i.quantity} × ` : ""}${i.name}${i.size ? ` (${i.size})` : ""}`).join(", ") || "—"}
              </Td>
              <Td className="whitespace-nowrap tabular-nums">{naira(r.subtotal)}</Td>
              <Td className="whitespace-nowrap text-neutral-500">{timeAgo(r.updated_at)}</Td>
              <Td>{r.recovered_at ? <Badge tone="green">Bought</Badge> : r.reminder_sent_at ? <Badge tone="blue">Reminded</Badge> : <Badge tone="amber">Waiting</Badge>}</Td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}

async function StockRequests() {
  const rows = unwrap(
    await db()
      .from("stock_alerts")
      .select("id, email, created_at, notified_at, product:products(name), print:prints(name, stock_quantity)")
      .order("created_at", { ascending: false })
      .limit(300),
    "Loading requests"
  ) as unknown as { id: string; email: string; created_at: string; notified_at: string | null; product: { name: string } | null; print: { name: string; stock_quantity: number } | null }[];

  return (
    <Card padded={false} title="Back-in-stock requests" description="People waiting for a sold-out print. They're emailed the morning after you add stock under Prints & stock.">
      {rows.length === 0 ? (
        <EmptyState title="No requests yet" text="When someone taps “Notify me” on a sold-out print, it's listed here." />
      ) : (
        <Table head={["Email", "Wants", "Asked", "Status"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td className="font-medium text-neutral-900">{r.email}</Td>
              <Td>
                {r.product?.name || "A product"} · {r.print?.name || "a print"}
              </Td>
              <Td className="whitespace-nowrap text-neutral-500">{formatDate(r.created_at)}</Td>
              <Td>
                {r.notified_at ? (
                  <Badge tone="green">Emailed {formatDate(r.notified_at)}</Badge>
                ) : (r.print?.stock_quantity || 0) > 0 ? (
                  <Badge tone="blue">Email goes out tomorrow</Badge>
                ) : (
                  <Badge tone="amber">Waiting for stock</Badge>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}

async function Sent() {
  const rows = unwrap(
    await db().from("marketing_log").select("id, email, kind, coupon_code, sent_at").order("sent_at", { ascending: false }).limit(300),
    "Loading the email log"
  ) as { id: string; email: string; kind: string | null; coupon_code: string | null; sent_at: string }[];

  return (
    <Card padded={false} title="Emails sent" description="The last 300 marketing emails the website sent by itself. Order receipts and status updates aren't listed.">
      {rows.length === 0 ? (
        <EmptyState title="No emails sent yet" />
      ) : (
        <Table head={["To", "Email", "Code included", "Sent"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td className="font-medium text-neutral-900">{r.email}</Td>
              <Td>{kindLabel(r.kind)}</Td>
              <Td>{r.coupon_code ? <span className="font-mono text-[13px]">{r.coupon_code}</span> : "—"}</Td>
              <Td className="whitespace-nowrap text-neutral-500">{formatDateTime(r.sent_at)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}

async function Browsing() {
  const rows = unwrap(
    await db()
      .from("browse_activity")
      .select("id, email, views, last_viewed_at, step, converted_at")
      .order("last_viewed_at", { ascending: false, nullsFirst: false })
      .limit(200),
    "Loading browsing activity"
  ) as { id: string; email: string; views: { name: string; count: number }[] | null; last_viewed_at: string | null; step: number; converted_at: string | null }[];

  return (
    <Card padded={false} title="Browsing follow-ups" description="Known contacts who allowed personalised emails, and where they are in the five follow-up emails.">
      {rows.length === 0 ? (
        <EmptyState title="Nothing here yet" text="This fills in as subscribers who allowed personalised emails browse the shop." />
      ) : (
        <Table head={["Contact", "Looked at", "Last visit", "Follow-ups"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td className="font-medium text-neutral-900">{r.email}</Td>
              <Td className="max-w-xs text-[13px]">{(r.views || []).slice(0, 4).map((v) => v.name).join(", ") || "—"}</Td>
              <Td className="whitespace-nowrap text-neutral-500">{timeAgo(r.last_viewed_at)}</Td>
              <Td>{r.converted_at ? <Badge tone="green">Bought</Badge> : <Badge>{Math.min(5, r.step || 0)} of 5 sent</Badge>}</Td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}

async function Unsubscribed() {
  const rows = unwrap(
    await db().from("marketing_opt_outs").select("email, created_at").order("created_at", { ascending: false }).limit(500),
    "Loading unsubscribes"
  ) as { email: string; created_at: string }[];

  return (
    <Card padded={false} title="Unsubscribed" description="These people asked not to get marketing emails. They still get receipts and order updates.">
      {rows.length === 0 ? (
        <EmptyState title="Nobody has unsubscribed" />
      ) : (
        <Table head={["Email", "Unsubscribed on", ""]}>
          {rows.map((r) => (
            <tr key={r.email}>
              <Td className="font-medium text-neutral-900">{r.email}</Td>
              <Td className="whitespace-nowrap text-neutral-500">{formatDate(r.created_at)}</Td>
              <Td className="text-right">
                <ResubscribeButton email={r.email} />
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}
