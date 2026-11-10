"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Gift, Loader2, Lock, Share2, X } from "lucide-react";
import TerminalLocationSelect from "@/src/components/TerminalLocationSelect";
import { getListForOwner, saveSharedList, type ShareItemInput } from "@/src/app/actions/sharedList";
import { getSharedListRef, setSharedListRef } from "@/src/lib/wishlist";

type Props = {
  open: boolean;
  onClose: () => void;
  kind: "wishlist" | "cart";
  items: ShareItemInput[];
  /** Called with productId → item key after saving, for per-item share links */
  onSaved?: (shareUrl: string, itemKeys: { productId: string; key: string }[]) => void;
};

const emptyAddress = {
  name: "",
  phone: "",
  line1: "",
  apartment: "",
  city: "",
  state: "",
  stateCode: "",
  country: "",
  postalCode: "",
};

export default function ShareListModal({ open, onClose, kind, items, onSaved }: Props) {
  const label = kind === "cart" ? "cart" : "wishlist";
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [message, setMessage] = useState("");
  const [keepSurprise, setKeepSurprise] = useState(true);
  const [withAddress, setWithAddress] = useState(false);
  const [hadAddress, setHadAddress] = useState(false);
  const [address, setAddress] = useState(emptyAddress);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Re-sharing: load what was saved last time so it updates the same link
  useEffect(() => {
    if (!open) return;
    const ref = getSharedListRef(kind);
    if (!ref) return;
    getListForOwner(ref.publicId, ref.editToken)
      .then((list) => {
        if (!list) {
          setSharedListRef(kind, null);
          return;
        }
        setOwnerName(list.ownerName);
        setOwnerEmail(list.ownerEmail);
        setMessage(list.message);
        setKeepSurprise(list.keepSurprise);
        if (list.deliveryAddress) {
          setWithAddress(true);
          setHadAddress(true);
          setAddress({ ...emptyAddress, ...list.deliveryAddress });
        }
      })
      .catch(() => {});
  }, [open, kind]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const set = (field: keyof typeof emptyAddress, value: string) => setAddress((a) => ({ ...a, [field]: value }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      const ref = getSharedListRef(kind);
      const res = await saveSharedList({
        publicId: ref?.publicId,
        editToken: ref?.editToken,
        kind,
        ownerName,
        ownerEmail,
        message,
        keepSurprise,
        items,
        deliveryAddress: withAddress
          ? { ...address, name: address.name || ownerName }
          : hadAddress
            ? null
            : undefined,
      });
      if (!res.success) {
        setError(res.message);
        return;
      }
      setSharedListRef(kind, { publicId: res.publicId, editToken: res.editToken });
      setShareUrl(res.shareUrl);
      onSaved?.(res.shareUrl, res.itemKeys);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: `${ownerName.split(" ")[0]}'s DAHRIOLA ${label}`, url: shareUrl });
    } catch {}
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `Here's my DAHRIOLA ${label} 🎁 — sizes and options are all saved: ${shareUrl}`
  )}`;

  const field = "w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-black";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[300] overflow-y-auto" role="dialog" aria-modal="true" aria-label={`Share your ${label}`}>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="relative min-h-full flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl p-6 md:p-8 shadow-2xl"
            >
              <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 p-2 rounded-full hover:bg-neutral-100">
                <X size={18} />
              </button>

              {!shareUrl ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">Share your {label}</p>
                    <h2 className="mt-2 font-display text-2xl">Let someone gift it to you</h2>
                    <p className="mt-2 text-[13px] text-neutral-500">
                      Anyone with the link sees your picks with your sizes and options, and can buy them for you.
                    </p>
                  </div>

                  <input required placeholder="Your name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={field} />
                  <div>
                    <input
                      type="email"
                      placeholder="Your email (recommended)"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className={field}
                    />
                    <p className="mt-1 text-[11px] text-neutral-400">We&apos;ll email you a link to manage your {label}, and let you know when someone sends a gift.</p>
                  </div>
                  <textarea
                    placeholder="A note for whoever's gifting (optional)"
                    rows={2}
                    maxLength={400}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`${field} resize-none`}
                  />

                  <label className="flex items-start gap-2 text-[13px] cursor-pointer">
                    <input type="checkbox" className="accent-black mt-0.5" checked={keepSurprise} onChange={(e) => setKeepSurprise(e.target.checked)} />
                    <span>
                      Keep it a surprise
                      <span className="block text-[11px] text-neutral-500">We won&apos;t tell you which items were bought.</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2 text-[13px] cursor-pointer">
                    <input type="checkbox" className="accent-black mt-0.5" checked={withAddress} onChange={(e) => setWithAddress(e.target.checked)} />
                    <span>
                      Save my delivery address so gifts come straight to me
                      <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                        <Lock size={10} /> Private: the person paying never sees it.
                      </span>
                    </span>
                  </label>

                  {withAddress && (
                    <div className="space-y-3 rounded-xl bg-neutral-50 p-4">
                      <TerminalLocationSelect
                        countryCode={address.country}
                        stateCode={address.stateCode}
                        stateName={address.state}
                        city={address.city}
                        onCountryChange={(code) => setAddress((a) => ({ ...a, country: code, state: "", stateCode: "", city: "" }))}
                        onStateChange={({ code, name }) => setAddress((a) => ({ ...a, state: name, stateCode: code, city: "" }))}
                        onCityChange={(c) => set("city", c)}
                      />
                      <input required placeholder="Street address" value={address.line1} onChange={(e) => set("line1", e.target.value)} className={field} />
                      <input placeholder="Apartment, suite, etc. (optional)" value={address.apartment} onChange={(e) => set("apartment", e.target.value)} className={field} />
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Postal code (optional)" value={address.postalCode} onChange={(e) => set("postalCode", e.target.value)} className={field} />
                        <input required placeholder="Phone for delivery" value={address.phone} onChange={(e) => set("phone", e.target.value)} className={field} />
                      </div>
                    </div>
                  )}

                  {error && <p className="text-[12px] text-red-600">{error}</p>}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full h-12 rounded-lg bg-black text-white text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={15} />}
                    {saving ? "Saving…" : "Create share link"}
                  </button>
                </form>
              ) : (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdf6e7] text-[#9E1B32]">
                    <Gift size={24} />
                  </div>
                  <h2 className="font-display text-2xl">Your {label} is ready to share</h2>
                  <p className="mt-2 text-[13px] text-neutral-500">
                    {ownerEmail ? "We've emailed you a private link to manage it." : "Keep this page's link to update your list later from this device."}
                  </p>

                  <div className="mt-6 flex items-center gap-2 rounded-lg border border-neutral-200 p-2 pl-3">
                    <span className="flex-1 truncate text-left text-[13px] text-neutral-700">{shareUrl}</span>
                    <button onClick={copyLink} className="shrink-0 rounded-md bg-black px-3 py-2 text-[11px] uppercase tracking-[0.15em] text-white inline-flex items-center gap-1">
                      {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-11 rounded-lg bg-[#25D366] text-white text-[12px] font-semibold flex items-center justify-center"
                    >
                      Share on WhatsApp
                    </a>
                    <button
                      onClick={typeof navigator !== "undefined" && "share" in navigator ? nativeShare : copyLink}
                      className="h-11 rounded-lg border border-neutral-300 text-[12px] font-semibold"
                    >
                      More options
                    </button>
                  </div>

                  <button onClick={() => setShareUrl("")} className="mt-5 text-[12px] underline text-neutral-500">
                    Edit details
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
