// src/components/CountryStateSelect.tsx
// Local country + state/province selector. Data baked in from src/data/locations.ts
// (no API, no key, no network). State options are always derived from the chosen
// country, so a country/state mismatch is impossible.
//
// Styling: uses the exact same `checkout-field` class as the other inputs — no
// wrappers, no extra styling — so it looks identical to First name, Address, etc.

"use client";

import {
  getCountryList,
  getStatesForCountry,
  countryHasStates,
} from "@/src/data/locations";

export default function CountryStateSelect({
  countryCode,
  stateCode,
  stateText,
  onCountryChange,
  onStateChange,
}: {
  countryCode: string;
  stateCode: string;
  stateText: string;
  onCountryChange: (code: string, name: string) => void;
  onStateChange: (args: { code: string; name: string }) => void;
}) {
  const countries = getCountryList();
  const states = getStatesForCountry(countryCode);
  const hasStates = countryHasStates(countryCode);

  return (
    <>
      <select
        className="checkout-field mt-3"
        value={countryCode}
        onChange={(e) => {
          const code = e.target.value;
          const name = countries.find((c) => c.code === code)?.name || "";
          onCountryChange(code, name);
        }}
      >
        <option value="" disabled>
          Select Country
        </option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>

      {hasStates ? (
        <select
          className="checkout-field mt-3"
          value={stateCode}
          onChange={(e) => {
            const code = e.target.value;
            const name = states.find((s) => s.code === code)?.name || "";
            onStateChange({ code, name });
          }}
        >
          <option value="" disabled>
            Select State / Province
          </option>
          {states.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      ) : (
        <input
          placeholder="State / Province"
          className="checkout-field mt-3"
          value={stateText}
          onChange={(e) => onStateChange({ code: "", name: e.target.value })}
        />
      )}
    </>
  );
}
