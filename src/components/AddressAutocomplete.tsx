// src/components/AddressAutocomplete.tsx
// A prominent "search your address" input backed by Google Places Autocomplete.
// When the customer picks a suggestion it returns fully structured, validated
// components — including the ISO-2 country code — so checkout can populate every
// field and set the country from Google's data (not a guessable dropdown).
//
// Fails safe: if Google can't load (missing key, blocked network, outage), it
// renders nothing and calls onManualFallback so the manual fields take over.
//
// Zero type dependencies: uses local `any` for Google objects, so NO
// @types/google.maps package is required.

"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { loadGoogleMaps } from "@/src/lib/googleMaps";

export type ResolvedAddress = {
  line1: string;
  city: string;
  state: string;
  stateCode: string;
  postalCode: string;
  countryCode: string; // ISO-2
  countryName: string;
  formatted: string;
};

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

function pick(components: AddressComponent[], type: string, useShort = false) {
  const c = components.find((x) => x.types.includes(type));
  return c ? (useShort ? c.short_name : c.long_name) : "";
}

export default function AddressAutocomplete({
  onResolved,
  onManualFallback,
  placeholder = "Start typing your street, city or postcode…",
}: {
  onResolved: (addr: ResolvedAddress) => void;
  onManualFallback?: () => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    let ac: any = null;
    let cancelled = false;

    loadGoogleMaps()
      .then((google: any) => {
        if (cancelled || !inputRef.current) return;

        ac = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ["address_components", "formatted_address"],
          types: ["address"],
        });

        // `ac` is guaranteed non-null here — capture it in a local const so the
        // closure below doesn't see the outer nullable variable.
        const instance = ac;
        instance.addListener("place_changed", () => {
          const place = instance.getPlace();
          const comps: AddressComponent[] = place.address_components || [];
          if (!comps.length) return;

          const streetNumber = pick(comps, "street_number");
          const route = pick(comps, "route");
          const line1 = [streetNumber, route].filter(Boolean).join(" ");

          const resolved: ResolvedAddress = {
            line1: line1 || place.formatted_address?.split(",")[0] || "",
            city:
              pick(comps, "locality") ||
              pick(comps, "postal_town") ||
              pick(comps, "sublocality") ||
              pick(comps, "administrative_area_level_2"),
            state: pick(comps, "administrative_area_level_1"),
            stateCode: pick(comps, "administrative_area_level_1", true),
            postalCode: pick(comps, "postal_code"),
            countryCode: pick(comps, "country", true),
            countryName: pick(comps, "country"),
            formatted: place.formatted_address || "",
          };

          onResolved(resolved);
        });

        setStatus("ready");
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("Address autocomplete unavailable, using manual entry:", msg);
        setStatus("fallback");
        onManualFallback?.();
      });

    return () => {
      cancelled = true;
      const g = (window as unknown as { google?: any }).google;
      if (ac && g?.maps?.event) {
        g.maps.event.clearInstanceListeners(ac);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // In fallback mode render nothing — the checkout's manual fields take over.
  if (status === "fallback") return null;

  return (
    <div className="relative">
      <MapPin
        size={18}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-beryl pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        autoComplete="off"
        className="w-full h-[52px] rounded-lg border-2 border-brand-beryl/50 bg-white pl-11 pr-10 text-[14px] outline-none transition focus:border-brand-beryl focus:ring-2 focus:ring-brand-beryl/20 placeholder:text-neutral-400"
      />
      {status === "loading" && (
        <Loader2
          size={16}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-beryl animate-spin"
        />
      )}
    </div>
  );
}
