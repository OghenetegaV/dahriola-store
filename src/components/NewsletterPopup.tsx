"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  Copy,
} from "lucide-react";
import Image from "next/image";

const CLAIMED_KEY = "dahriola_discount_claimed";
const CLOSED_KEY = "dahriola-newsletter-closed";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000; // don't auto-open again for 3 days after closing
export const OPEN_EVENT = "dahriola:open-newsletter";

export function openNewsletterPopup(email?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { email } }));
}

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    birthday: "",
    source: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let claimedCode: string | null = null;
    let closedAt = 0;
    try {
      claimedCode = localStorage.getItem(CLAIMED_KEY);
      closedAt = Number(localStorage.getItem(CLOSED_KEY) || 0);
    } catch {}

    // Anyone who already signed up sees their code when they reopen it
    if (claimedCode) {
      setSubmitted(true);
      setDiscountCode(claimedCode === "true" ? "THESOUND" : claimedCode);
    }

    const openPopup = (e: Event) => {
      const email = (e as CustomEvent<{ email?: string }>).detail?.email;
      if (email) setFormData((prev) => ({ ...prev, email }));
      setError("");
      setIsOpen(true);
    };
    window.addEventListener(OPEN_EVENT, openPopup);

    const recentlyClosed = Date.now() - closedAt < SNOOZE_MS;
    const timer =
      !claimedCode && !recentlyClosed
        ? setTimeout(() => setIsOpen(true), 5000)
        : undefined;

    return () => {
      window.removeEventListener(OPEN_EVENT, openPopup);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const closePopup = () => {
    try {
      localStorage.setItem(CLOSED_KEY, String(Date.now()));
    } catch {}
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePopup();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(discountCode || "THESOUND");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    try {
      setLoading(true);
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        const code = data.code || "THESOUND";
        setSubmitted(true);
        setDiscountCode(code);
        try {
          localStorage.setItem(CLAIMED_KEY, code);
        } catch {}
        setFormData({ name: "", email: "", birthday: "", source: "" });
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] overflow-y-auto">
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
            className="fixed inset-0 bg-black/50 backdrop-blur-md"
          />

          <div className="relative min-h-screen flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="relative bg-white rounded-2xl w-full max-w-[950px] flex flex-col md:flex-row overflow-hidden"
            >
              {/* CLOSE */}
              <button
                onClick={closePopup}
                className="absolute right-4 top-4 z-50 bg-white rounded-full p-2"
              >
                <X size={18} />
              </button>

              {/* IMAGE — full photo, no cropping */}
              <div className="relative w-full md:w-1/2 bg-neutral-100 flex items-center justify-center">
                <Image
                  src="/newsletter_2.jpg"
                  alt="Dahriola"
                  width={600}
                  height={700}
                  priority
                  className="w-full h-auto object-contain"
                />
              </div>

              {/* CONTENT — scrollable on mobile */}
              <div className="w-full md:w-1/2 overflow-y-auto max-h-[90vh] md:max-h-none">
                <div className="p-6 md:p-12">
                  {!submitted ? (
                    <>
                      <span className="text-[9px] tracking-[0.4em] uppercase text-neutral-400">
                        The Dahriola Archive
                      </span>

                      <h2 className="mt-5 text-4xl leading-none">
                        Get 10% Off
                        <br />
                        Your First Order
                      </h2>

                      <p className="mt-4 text-sm text-neutral-500">
                        Join for exclusive previews, birthday surprises and
                        early access.
                      </p>

                      <form onSubmit={handleSubmit} className="space-y-5 mt-8">
                        <input
                          required
                          placeholder="Full Name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full border-b pb-3"
                        />

                        <input
                          type="email"
                          required
                          placeholder="Email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full border-b pb-3"
                        />

                        <label className="block text-[10px] uppercase tracking-[0.25em] text-neutral-400 -mb-3">
                          Birthday month (optional)
                        </label>
                        <input
                          type="month"
                          value={formData.birthday}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              birthday: e.target.value,
                            })
                          }
                          className="w-full border-b pb-3"
                        />

                        <select
                          required
                          value={formData.source}
                          onChange={(e) =>
                            setFormData({ ...formData, source: e.target.value })
                          }
                          className="w-full border-b pb-3"
                        >
                          <option value="">How did you find us?</option>
                          <option>Instagram</option>
                          <option>TikTok</option>
                          <option>Google</option>
                          <option>Friend</option>
                          <option>Pinterest</option>
                        </select>

                        {error && (
                          <p className="text-xs text-red-600">{error}</p>
                        )}

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-black text-white py-4 flex justify-center gap-3 disabled:opacity-60"
                        >
                          {loading ? "Submitting..." : "Unlock My Discount"}
                          <ArrowRight />
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <p className="uppercase text-sm">Your discount code</p>

                      <div
                        onClick={copyCode}
                        className="cursor-pointer border py-6 mt-5"
                      >
                        <h1 className="text-4xl font-bold tracking-[0.08em]">
                          {discountCode || "THESOUND"}
                        </h1>

                        <div className="mt-4 flex justify-center gap-2 text-sm">
                          <Copy size={14} />
                          {copied ? "Copied" : "Tap to copy"}
                        </div>
                      </div>

                      <p className="mt-6 text-xs text-neutral-400 uppercase tracking-[0.25em]">
                        Apply at checkout
                      </p>
                      <p className="mt-2 text-xs text-neutral-400">
                        We&apos;ve also emailed it to you.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}