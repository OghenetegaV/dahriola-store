// src/components/AddressAutocomplete.tsx
// A single "search your address" input backed by Google Places Autocomplete.
// When the customer picks a suggestion, it returns fully structured, validated
// components — including the ISO-2 country code — so the checkout can populate
// every field and set the country from Google's data (not a guessable dropdown).
//
// Fails safe: if Google can't load (missing key, network), it renders a plain
// text input and calls onManualFallback so the existing manual fields take over.
//
// NOTE: this version uses local `any` types for the Google objects, so it needs
// NO @types/google.maps package. Fully self-contained.

"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { loadGoogleMaps } from "@/src/lib/googleMaps";

export type ResolvedAddress = {
  line1: string;      // street number + route
  city: string;
  state: string;      // administrative_area_level_1 (full name)
  stateCode: string;  // short form (e.g. "OH", "ON")
  postalCode: string;
  countryCode: string; // ISO-2 (e.g. "NG", "CA", "US", "NO")
  countryName: string;
  formatted: string;   // Google's full formatted string
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
  placeholder = "Start typing your address…",
}: {
  onResolved: (addr: ResolvedAddress) => void;
  onManualFallback?: () => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let autocomplete: any = null;
    let cancelled = false;

    loadGoogleMaps()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((google: any) => {
        if (cancelled || !inputRef.current) return;

        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ["address_components", "formatted_address"],
          types: ["address"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
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
            countryCode: pick(comps, "country", true), // ISO-2
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
      if (autocomplete && g?.maps?.event) {
        g.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // In fallback mode we render nothing here — the checkout's existing manual
  // fields remain visible and functional.
  if (status === "fallback") return null;

  return (
    <div className="relative">
      <MapPin
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        autoComplete="off"
        className="checkout-field"
        style={{ paddingLeft: 38 }}
      />
      {status === "loading" && (
        <Loader2
          size={15}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 animate-spin"
        />
      )}
    </div>
  );
}
