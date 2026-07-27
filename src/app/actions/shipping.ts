// src/app/actions/shipping.ts
// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK VERSION — generates DHL-modelled rates from the hard-coded dataset
// instead of calling Terminal Africa. Same function name + return shape.
//
// Accepts the address the client already sends, plus (optionally) itemCount or
// weightKg for weight-accurate pricing. If neither is passed it assumes ~1 kg.
// Country is expected as an ISO-2 code (e.g. "NG", "NO"); a full country name
// is also tolerated as a fallback.
// ─────────────────────────────────────────────────────────────────────────────

"use server";

import {
  computeShippingRates,
  COUNTRIES,
  type ComputedRate,
} from "@/src/data/shippingRates";

type ShippingInput = {
  line1?: string;
  city?: string;
  state?: string;        // NG state name OR code
  country?: string;      // ISO-2 code preferred; full name tolerated
  postalCode?: string;
  itemCount?: number;    // optional — pass cart quantity for accurate weight
  weightKg?: number;     // optional — pass explicit parcel weight if known
};

function resolveCountryCode(country?: string): string {
  if (!country) return "";
  const c = country.trim();
  if (c.length === 2) return c.toUpperCase();            // already ISO-2
  const match = COUNTRIES.find(x => x.name.toLowerCase() === c.toLowerCase());
  return match?.code ?? c.toUpperCase();
}

export async function getShippingRates(input: ShippingInput): Promise<ComputedRate[]> {
  const countryCode = resolveCountryCode(input.country);
  if (!countryCode) return [];

  // For Nigeria, state drives the domestic tier. `state` may be a code or a name.
  const stateRaw = input.state?.trim() ?? "";
  const stateIsCode = /^[A-Z]{2}$/.test(stateRaw);

  return computeShippingRates({
    countryCode,
    stateCode: stateIsCode ? stateRaw : undefined,
    stateName: stateIsCode ? undefined : stateRaw || undefined,
    itemCount: input.itemCount,
    weightKg: input.weightKg,
  });
}
