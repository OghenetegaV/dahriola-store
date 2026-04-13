"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import the content component with SSR disabled
const CheckoutClient = dynamic(() => import("@/src/components/CheckoutClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-neutral-900 mb-4" size={32} />
      <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400">
        Securing Checkout Session...
      </p>
    </div>
  ),
});

export default function CheckoutPage() {
  return <CheckoutClient />;
}