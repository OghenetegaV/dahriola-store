// src/app/actions/cities.ts
// Fetches Terminal's valid states and cities so the checkout can offer them as
// dropdowns. Because the customer picks from Terminal's own lists (by code),
// Terminal never rejects the state or city again.

"use server";

import { TERMINAL } from "@/src/config/terminal";

export type TLoc = { name: string; code: string };

function tHeaders() {
  return {
    Authorization: `Bearer ${process.env.TERMINAL_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

// States for a country → [{ name: "Lagos", code: "LA" }, ...]
export async function getTerminalStates(countryCode: string): Promise<TLoc[]> {
  if (!process.env.TERMINAL_SECRET_KEY || !countryCode) return [];
  try {
    const res = await fetch(
      `${TERMINAL.BASE}/states?country_code=${encodeURIComponent(countryCode)}`,
      { method: "GET", headers: tHeaders(), cache: "no-store" },
    );
    const data = await res.json();
    const raw = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.data?.states)
      ? data.data.states
      : [];

    const states: TLoc[] = raw
      .map((s: any) => ({
        name: s?.name || s?.state || "",
        // Terminal state code lives in various keys across versions.
        code: s?.isoCode || s?.state_code || s?.code || s?.slug || "",
      }))
      .filter((s: TLoc) => s.name && s.code);

    // De-dupe by code, sort by name.
    const seen = new Set<string>();
    return states
      .filter((s) => (seen.has(s.code) ? false : (seen.add(s.code), true)))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error("getTerminalStates error:", err);
    return [];
  }
}

// Cities for a state → ["Agege", "Ajah", ...]. stateCode MUST be Terminal's
// state code (e.g. "LA"), not the state name.
export async function getTerminalCities(
  countryCode: string,
  stateCode: string,
): Promise<string[]> {
  if (!process.env.TERMINAL_SECRET_KEY || !countryCode) return [];
  try {
    const params = new URLSearchParams({ country_code: countryCode });
    if (stateCode) params.set("state_code", stateCode);

    const res = await fetch(`${TERMINAL.BASE}/cities?${params.toString()}`, {
      method: "GET",
      headers: tHeaders(),
      cache: "no-store",
    });
    const data = await res.json();

    const raw = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.data?.cities)
      ? data.data.cities
      : [];

    const cities: string[] = raw
      .map((c: any) => (typeof c === "string" ? c : c?.name || c?.city))
      .filter(Boolean);

    return Array.from(new Set(cities)).sort((a, b) => a.localeCompare(b));
  } catch (err) {
    console.error("getTerminalCities error:", err);
    return [];
  }
}
