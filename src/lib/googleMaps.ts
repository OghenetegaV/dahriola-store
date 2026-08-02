// src/lib/googleMaps.ts
// Loads the Google Maps JS API (Places library) once, on demand.
// Safe to call multiple times — returns the same promise.
// If the key is missing, it rejects, and callers fall back to manual entry.
//
// Uses `any` for the resolved google object so it needs no @types/google.maps.

/* eslint-disable @typescript-eslint/no-explicit-any */

let loadPromise: Promise<any> | null = null;

export function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }

  if ((window as any).google?.maps?.places) {
    return Promise.resolve((window as any).google);
  }

  if (loadPromise) return loadPromise;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set"));
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google?.maps?.places) {
        resolve((window as any).google);
      } else {
        reject(new Error("Google Maps loaded but Places library is unavailable"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
