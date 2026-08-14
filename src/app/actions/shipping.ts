// src/app/actions/shipping.ts
// ─────────────────────────────────────────────────────────────────────────────
// getShippingRates — tries Terminal Africa LIVE multi-courier rates first (for
// BOTH domestic Nigeria and international), and automatically falls back to the
// hard-coded DHL data if Terminal isn't configured, returns nothing, or errors.
// Same return shape as the checkout expects: { rates, source, requestToken }.
// ─────────────────────────────────────────────────────────────────────────────

"use server";

import {
  computeShippingRates,
  COUNTRIES,
  type ComputedRate,
} from "@/src/data/shippingRates";
import { getTerminalRates } from "@/src/app/actions/terminal";

type ShippingInput = {
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  itemCount?: number;
  weightKg?: number;

  // Needed by Terminal (ignored by the DHL fallback):
  receiverName?: string;
  receiverEmail?: string;
  receiverPhone?: string;
  items?: { name: string; price: number; quantity: number }[];
  currency?: string;
};

export type ShippingRatesResponse = {
  rates: ComputedRate[];
  source: "terminal" | "dhl-fallback";
  requestToken?: string;
};

function resolveCountryCode(country?: string): string {
  if (!country) return "";
  const c = country.trim();
  if (c.length === 2) return c.toUpperCase();
  const match = COUNTRIES.find((x) => x.name.toLowerCase() === c.toLowerCase());
  return match?.code ?? c.toUpperCase();
}

export async function getShippingRates(
  input: ShippingInput,
): Promise<ShippingRatesResponse> {
  const countryCode = resolveCountryCode(input.country);

  // ── Try Terminal first (live multi-courier, NG + international) ──
  if (countryCode && input.items && input.items.length > 0) {
    try {
      const tm = await getTerminalRates({
        receiverName: input.receiverName || "Customer",
        receiverEmail: input.receiverEmail || "",
        receiverPhone: input.receiverPhone || "",
        line1: input.line1 || "",
        city: input.city || "",
        state: input.state || "",
        countryCode,
        postalCode: input.postalCode,
        items: input.items,
        currency: input.currency,
      });

      if (tm.rates.length > 0) {
        return {
          rates: tm.rates,
          source: "terminal",
          requestToken: tm.requestToken,
        };
      }
    } catch (err) {
      console.error("Terminal failed, falling back to DHL:", err);
    }
  }

  // ── Fallback: hard-coded DHL data ──
  if (!countryCode) return { rates: [], source: "dhl-fallback" };

  const stateRaw = input.state?.trim() ?? "";
  const stateIsCode = /^[A-Z]{2}$/.test(stateRaw);

  const rates = computeShippingRates({
    countryCode,
    stateCode: stateIsCode ? stateRaw : undefined,
    stateName: stateIsCode ? undefined : stateRaw || undefined,
    itemCount: input.itemCount,
    weightKg: input.weightKg,
  });

  return { rates, source: "dhl-fallback" };
}
