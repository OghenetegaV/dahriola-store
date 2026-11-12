"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { findOrderForTracking } from "@/src/app/actions/track";

export default function TrackForm() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const field = "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm focus:border-neutral-900 focus:outline-none";

  return (
    <form
      className="mx-auto mt-10 max-w-md space-y-4 rounded-3xl border border-neutral-200 bg-white p-6 md:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
          const res = await findOrderForTracking(orderNumber, email);
          if (res.success && res.url) router.push(res.url);
          else setError(res.message || "Something went wrong.");
        } catch {
          setError("Something went wrong. Please try again.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <p className="text-sm text-neutral-500">Enter the order number from your receipt email and the email you used at checkout.</p>
      <input required placeholder="Order number, e.g. DAHRIOLA-1794…" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className={field} />
      <input required type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 text-[11px] font-bold uppercase tracking-[0.2em] text-white disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <>Track order <ArrowRight size={14} /></>}
      </button>
    </form>
  );
}
