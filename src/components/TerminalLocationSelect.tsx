// src/components/TerminalLocationSelect.tsx
// Country (from the local baked list — that data is reliable) → State → City,
// where STATE and CITY come live from Terminal's own lists (by code). Because
// the customer picks Terminal's exact state code and city name, Terminal never
// rejects them ("Invalid city" / missing states like Spain are both fixed).
//
// Falls back to a free-text input for state or city if Terminal returns nothing
// for that level, so checkout never blocks.

"use client";

import { useEffect, useState } from "react";
import { getCountryList } from "@/src/data/locations";
import { getTerminalStates, getTerminalCities, type TLoc } from "@/src/app/actions/cities";

export default function TerminalLocationSelect({
  countryCode,
  stateCode,
  stateName,
  city,
  onCountryChange,
  onStateChange,
  onCityChange,
}: {
  countryCode: string;
  stateCode: string;
  stateName: string;
  city: string;
  onCountryChange: (code: string, name: string) => void;
  onStateChange: (args: { code: string; name: string }) => void;
  onCityChange: (city: string) => void;
}) {
  const countries = getCountryList();

  const [states, setStates] = useState<TLoc[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Load Terminal states when the country changes.
  useEffect(() => {
    let cancelled = false;
    setStates([]);
    setCities([]);
    if (!countryCode) return;
    setLoadingStates(true);
    getTerminalStates(countryCode)
      .then((s) => {
        if (!cancelled) setStates(s);
      })
      .finally(() => !cancelled && setLoadingStates(false));
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  // Load Terminal cities when the state code changes.
  useEffect(() => {
    let cancelled = false;
    setCities([]);
    if (!countryCode || !stateCode) return;
    setLoadingCities(true);
    getTerminalCities(countryCode, stateCode)
      .then((c) => {
        if (!cancelled) setCities(c);
      })
      .finally(() => !cancelled && setLoadingCities(false));
    return () => {
      cancelled = true;
    };
  }, [countryCode, stateCode]);

  return (
    <>
      {/* Country */}
      <select
        className="checkout-field mt-3"
        style={{ color: countryCode ? "#111" : "#9ca3af" }}
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
          <option key={c.code} value={c.code} style={{ color: "#111" }}>
            {c.name}
          </option>
        ))}
      </select>

      {/* State — from Terminal */}
      {states.length > 0 ? (
        <select
          className="checkout-field mt-3"
          style={{ color: stateCode ? "#111" : "#9ca3af" }}
          value={stateCode}
          onChange={(e) => {
            const code = e.target.value;
            const name = states.find((s) => s.code === code)?.name || "";
            onStateChange({ code, name });
          }}
        >
          <option value="" disabled>
            {loadingStates ? "Loading states..." : "Select State / Province"}
          </option>
          {states.map((s) => (
            <option key={s.code} value={s.code} style={{ color: "#111" }}>
              {s.name}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="checkout-field mt-3"
          placeholder={loadingStates ? "Loading states..." : "State / Province"}
          value={stateName}
          onChange={(e) => onStateChange({ code: "", name: e.target.value })}
        />
      )}

      {/* City — from Terminal */}
      {cities.length > 0 ? (
        <select
          className="checkout-field mt-3"
          style={{ color: city ? "#111" : "#9ca3af" }}
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
        >
          <option value="" disabled>
            {loadingCities ? "Loading cities..." : "Select City"}
          </option>
          {cities.map((c) => (
            <option key={c} value={c} style={{ color: "#111" }}>
              {c}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="checkout-field mt-3"
          placeholder={loadingCities ? "Loading cities..." : "City"}
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
        />
      )}
    </>
  );
}
