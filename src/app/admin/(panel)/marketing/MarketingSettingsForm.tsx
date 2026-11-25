"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveMarketingSettings } from "@/src/app/admin/actions/settings";
import type { MarketingSettings } from "@/src/lib/marketing";
import { Button, Card, Input, Toggle, useAction } from "@/src/components/admin/ui";

type BoolKey = { [K in keyof MarketingSettings]: MarketingSettings[K] extends boolean ? K : never }[keyof MarketingSettings];
type NumKey = Exclude<keyof MarketingSettings, BoolKey>;

type Row = {
  toggle: BoolKey;
  label: string;
  hint: string;
  numbers?: { key: NumKey; label: string; suffix: string; min: number; max: number }[];
};

const GROUPS: { title: string; description: string; rows: Row[] }[] = [
  {
    title: "Orders",
    description: "Emails customers get about something they bought.",
    rows: [
      { toggle: "receiptsEnabled", label: "Order receipts", hint: "A thank-you email with the order details, sent right after payment." },
      { toggle: "shippingEmailsEnabled", label: "Order status updates", hint: "Emails the customer when you change an order's status (in production, shipped, delivered…)." },
      {
        toggle: "reviewRequestsEnabled",
        label: "Review requests",
        hint: "Asks for a review a few days after you mark an order as delivered.",
        numbers: [{ key: "reviewRequestDelayDays", label: "Send after", suffix: "days", min: 1, max: 60 }],
      },
      { toggle: "backInStockEnabled", label: "Back-in-stock alerts", hint: "Shows “Notify me” on sold-out prints and emails people when you add stock again." },
    ],
  },
  {
    title: "Winning shoppers back",
    description: "Gentle reminders for people who showed interest but didn't buy.",
    rows: [
      {
        toggle: "abandonedCartEnabled",
        label: "Abandoned-checkout reminders",
        hint: "One reminder, the next morning, to people who entered their email at checkout but didn't pay.",
        numbers: [{ key: "abandonedCartDiscount", label: "Include a discount of", suffix: "% (0 = none)", min: 0, max: 50 }],
      },
      {
        toggle: "browseEnabled",
        label: "Browse follow-up emails",
        hint: "For known contacts who allowed personalised emails: the pieces they looked at, styling ideas, similar items and new arrivals over 30 days. Stops when they buy.",
        numbers: [{ key: "browseDiscount", label: "Discount in the last email", suffix: "% (0 = none)", min: 0, max: 50 }],
      },
    ],
  },
  {
    title: "Celebrations",
    description: "Personal one-use codes, created and sent automatically.",
    rows: [
      {
        toggle: "birthdayEnabled",
        label: "Birthday emails",
        hint: "At the start of each month, newsletter subscribers with a birthday that month get a personal code.",
        numbers: [{ key: "birthdayDiscount", label: "Discount", suffix: "%", min: 1, max: 90 }],
      },
      {
        toggle: "anniversaryEnabled",
        label: "First-order anniversary emails",
        hint: "A year after a customer's first order (only customers who agreed to marketing emails).",
        numbers: [{ key: "anniversaryDiscount", label: "Discount", suffix: "%", min: 1, max: 90 }],
      },
    ],
  },
];

export default function MarketingSettingsForm({ initial }: { initial: MarketingSettings }) {
  const router = useRouter();
  const { busy, run } = useAction();
  const [settings, setSettings] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);
  const set = (patch: Partial<MarketingSettings>) => setSettings((s) => ({ ...s, ...patch }));

  const numberField = (n: NonNullable<Row["numbers"]>[number], disabled: boolean) => (
    <label key={n.key} className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-neutral-600">
      {n.label}
      <Input
        type="number"
        min={n.min}
        max={n.max}
        inputMode="numeric"
        disabled={disabled}
        value={Number.isFinite(settings[n.key]) ? settings[n.key] : ""}
        onChange={(e) => set({ [n.key]: e.target.value === "" ? NaN : Number(e.target.value) } as Partial<MarketingSettings>)}
        className="h-8 w-20 text-center"
      />
      {n.suffix}
    </label>
  );

  return (
    <div className="space-y-6 pb-24">
      {GROUPS.map((group) => (
        <Card key={group.title} title={group.title} description={group.description}>
          <div className="divide-y divide-neutral-100">
            {group.rows.map((row) => (
              <div key={row.toggle} className="py-4 first:pt-0 last:pb-0">
                <Toggle label={row.label} hint={row.hint} checked={settings[row.toggle]} onChange={(v) => set({ [row.toggle]: v } as Partial<MarketingSettings>)} />
                {row.numbers?.map((n) => numberField(n, !settings[row.toggle]))}
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card title="Personal codes">
        <label className="flex flex-wrap items-center gap-2 text-sm text-neutral-700">
          Birthday and anniversary codes stay valid for
          <Input
            type="number"
            min={1}
            max={365}
            inputMode="numeric"
            value={Number.isFinite(settings.codeValidDays) ? settings.codeValidDays : ""}
            onChange={(e) => set({ codeValidDays: e.target.value === "" ? NaN : Number(e.target.value) })}
            className="h-8 w-20 text-center"
          />
          days
        </label>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="text-[13px] text-neutral-500">{dirty ? "You have unsaved changes." : "All changes saved."}</span>
          <Button
            loading={busy}
            disabled={!dirty}
            onClick={async () => {
              const res = await run(() => saveMarketingSettings(settings), "Email settings saved.");
              if (res?.ok) {
                setSaved(settings);
                router.refresh();
              }
            }}
          >
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
