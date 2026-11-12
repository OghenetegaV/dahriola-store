"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { OPEN_CONSENT_EVENT, readConsent, saveConsent } from "@/src/lib/consent";

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    const saved = readConsent();
    // First visit: show after a moment so it doesn't fight the page load
    const timer = saved ? undefined : setTimeout(() => setOpen(true), 1500);
    const reopen = () => {
      setAnalytics(readConsent()?.analytics ?? true);
      setShowDetails(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
    };
  }, []);

  const decide = (allowAnalytics: boolean) => {
    saveConsent(allowAnalytics);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="Cookie preferences"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 right-4 z-[250] sm:right-auto sm:max-w-[400px]"
        >
          <div className="relative rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)]">
            <button
              onClick={() => decide(false)}
              aria-label="Close and decline optional cookies"
              className="absolute right-3 top-3 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-black"
            >
              <X size={15} />
            </button>

            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-beryl/10 text-brand-beryl">
                <Cookie size={15} />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-900">Cookies</p>
            </div>

            <p className="mt-3 pr-4 text-[13px] leading-relaxed text-neutral-600">
              We use essential cookies to keep your bag and wishlist working. With your permission, we&apos;d also like to use
              analytics cookies to understand how the site is used, so we can improve it.
            </p>

            {showDetails && (
              <div className="mt-4 space-y-3 rounded-xl bg-[#F7F6F5] p-4 text-[12px]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-900">Essential</p>
                    <p className="text-neutral-500">Bag, wishlist, currency and checkout. Always on.</p>
                  </div>
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.15em] text-neutral-400">On</span>
                </div>
                <label className="flex cursor-pointer items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-900">Analytics</p>
                    <p className="text-neutral-500">Google Analytics: which pages are visited, anonymously.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#778472]"
                  />
                </label>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {showDetails ? (
                <button
                  onClick={() => decide(analytics)}
                  className="h-10 flex-1 rounded-full bg-neutral-950 px-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white"
                >
                  Save choices
                </button>
              ) : (
                <>
                  <button
                    onClick={() => decide(true)}
                    className="h-10 flex-1 rounded-full bg-neutral-950 px-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => decide(false)}
                    className="h-10 flex-1 rounded-full border border-neutral-300 px-5 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-900 hover:border-neutral-950"
                  >
                    Decline
                  </button>
                </>
              )}
            </div>
            {!showDetails && (
              <button onClick={() => setShowDetails(true)} className="mt-3 text-[11px] text-neutral-500 underline underline-offset-4 hover:text-black">
                Choose what to allow
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
