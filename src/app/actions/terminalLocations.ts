// src/app/actions/terminalLocations.ts
// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK VERSION — serves the checkout country/state dropdowns from the
// hard-coded DHL dataset instead of Terminal Africa (which was down).
//
// Same function names + return shapes as before, so CheckoutClient needs no
// import changes. When Terminal is back, restore the original file.
// ─────────────────────────────────────────────────────────────────────────────

"use server";

import { getCountries, getStates } from "@/src/data/shippingRates";

export async function getTerminalCountries(): Promise<{ code: string; name: string }[]> {
  return getCountries();
}

export async function getTerminalStates(countryCode: string): Promise<{ code: string; name: string }[]> {
  return getStates(countryCode);
}

// Cities aren't enumerated in the fallback (rates are computed at country/state
// level). Returning [] keeps the signature; the checkout treats city as free text.
export async function getTerminalCities(
  _countryCode: string,
  _stateCode?: string,
): Promise<{ name: string; stateCode?: string }[]> {
  return [];
}
