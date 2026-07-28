// src/app/success/page.tsx
// Payment success / order confirmation page for Dahriola.
// Reads ?reference=, verifies it with Paystack (to show the paid amount),
// and presents a warm confirmation in the brand-beryl aesthetic.
//
// Uses only what already exists in the project: verifyPayment server action
// and the same palette as CheckoutClient (brand-beryl, font-display).

"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, Mail, Loader2 } from "lucide-react";
import { verifyPayment } from "@/src/app/actions/payment";

function formatNaira(kobo?: number) {
  if (!kobo && kobo !== 0) return null;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(kobo / 100);
}

function SuccessInner() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref");

  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!reference) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await verifyPayment(reference);
        if (active && res?.amount) setAmount(formatNaira(res.amount));
      } catch {
        // Non-blocking — the order is already placed; we just can't show the amount.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reference]);

  return (
    <div className="min-h-screen bg-[#f6f6f4] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="bg-white border border-neutral-200 rounded-3xl shadow-sm px-6 py-10 md:px-10 md:py-12 text-center">

          {/* Check mark */}
          <div className="mx-auto mb-7 flex items-center justify-center">
            <span className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-20 w-20 rounded-full bg-brand-beryl/10" />
              <span className="relative inline-flex items-center justify-center h-16 w-16 rounded-full bg-brand-beryl/10">
                <CheckCircle2 className="h-9 w-9 text-brand-beryl" strokeWidth={1.6} />
              </span>
            </span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl text-black mb-3">
            Thank you for your order
          </h1>

          <p className="text-[14px] text-neutral-500 leading-relaxed max-w-sm mx-auto">
            Your payment was successful and your order is now being prepared.
            A confirmation has been sent to your email.
          </p>

          {/* Amount + reference */}
          <div className="mt-8 rounded-2xl bg-[#fbfbfa] border border-neutral-200 px-5 py-5 text-left">
            {loading ? (
              <div className="flex items-center gap-2 text-neutral-400 text-[13px]">
                <Loader2 size={14} className="animate-spin" />
                Confirming your payment…
              </div>
            ) : (
              <div className="space-y-3">
                {amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-neutral-500">Amount paid</span>
                    <span className="text-[15px] font-semibold text-black">{amount}</span>
                  </div>
                )}
                {reference && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-neutral-500">Reference</span>
                    <span className="text-[12.5px] font-medium text-black tracking-wide">
                      {reference}
                    </span>
                  </div>
                )}
                {!amount && !reference && (
                  <p className="text-[13px] text-neutral-500">
                    Your order has been received.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* What happens next */}
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="rounded-2xl border border-neutral-200 px-4 py-4 flex items-start gap-3">
              <Mail size={17} className="text-brand-beryl mt-0.5 shrink-0" />
              <div>
                <p className="text-[12.5px] font-semibold text-black">Check your email</p>
                <p className="text-[11.5px] text-neutral-500 mt-0.5 leading-snug">
                  Your receipt and order details are on the way.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 px-4 py-4 flex items-start gap-3">
              <Package size={17} className="text-brand-beryl mt-0.5 shrink-0" />
              <div>
                <p className="text-[12.5px] font-semibold text-black">We&apos;ll be in touch</p>
                <p className="text-[11.5px] text-neutral-500 mt-0.5 leading-snug">
                  Our team will reach out with delivery updates.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/category/all"
              className="w-full sm:w-auto px-8 h-12 rounded-full bg-brand-beryl text-white text-[13px] font-semibold
                flex items-center justify-center hover:opacity-95 transition"
            >
              Continue Shopping
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-8 h-12 rounded-full border border-neutral-300 text-black text-[13px] font-semibold
                flex items-center justify-center hover:border-black transition"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Support line */}
        <p className="text-center text-[12px] text-neutral-400 mt-6">
          Questions about your order? Email{" "}
          <a href="mailto:info.dahriola@gmail.com" className="underline hover:text-neutral-600">
            info.dahriola@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f6f6f4] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-beryl" />
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
