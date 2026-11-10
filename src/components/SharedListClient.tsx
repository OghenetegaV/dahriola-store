"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Gift, Heart, Lock } from "lucide-react";
import { useStore } from "@/src/store/useStore";
import { setListActive } from "@/src/app/actions/sharedList";
import { getSharedListRef, getWishlistEntries, setSharedListRef, updateWishlistEntry, addToWishlist } from "@/src/lib/wishlist";
import type { PublicList, PublicListItem } from "@/src/lib/sharedLists";

type Props = { list: PublicList; focusKey?: string; ownerToken?: string };

export default function SharedListClient({ list, focusKey, ownerToken }: Props) {
  const { cart, addItem, removeItem, currency, exchangeRates } = useStore();
  const [justAdded, setJustAdded] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState(!!ownerToken);
  const [linkActive, setLinkActive] = useState(list.active);
  const [imported, setImported] = useState(false);

  const what = list.kind === "cart" ? "cart" : "wishlist";
  const focus = focusKey ? list.items.find((i) => i.key === focusKey) : undefined;
  const visible = focus ? [focus] : list.items;

  useEffect(() => {
    // The manage link remembers ownership on this device
    if (ownerToken) {
      setSharedListRef(list.kind, { publicId: list.publicId, editToken: ownerToken });
      return;
    }
    const ref = getSharedListRef(list.kind);
    if (ref?.publicId === list.publicId) {
      const t = setTimeout(() => setIsOwner(true), 0);
      return () => clearTimeout(t);
    }
  }, [ownerToken, list.kind, list.publicId]);

  // Owners with "keep it a surprise" on don't see what's been bought
  const showBought = !(isOwner && list.keepSurprise);

  const money = (ngn?: number) =>
    typeof ngn === "number"
      ? new Intl.NumberFormat("en-US", { style: "currency", currency }).format(ngn * (exchangeRates[currency] || 1))
      : "";

  function clearOtherGiftItems() {
    const others = cart.filter((i) => i.giftListId && i.giftListId !== list.publicId);
    if (!others.length) return true;
    const ok = window.confirm(
      "Your cart already has gifts for someone else. Each gift order goes to one person, so those will be removed. Continue?"
    );
    if (ok) others.forEach((i) => removeItem(i._id, i.size, i.selectedPrintId));
    return ok;
  }

  function gift(items: PublicListItem[]) {
    const giftable = items.filter((i) => i.available && !i.purchased);
    if (!giftable.length || !clearOtherGiftItems()) return;
    for (const i of giftable) {
      if (cart.some((c) => c.giftItemKey === i.key)) continue;
      addItem({
        _id: i.productId,
        name: i.name,
        price: i.priceNGN || 0,
        image: i.image || "",
        quantity: i.quantity,
        size: i.size || "M",
        notes: i.notes || "",
        heightLength: i.heightLength,
        gender: i.gender,
        selectedPrintId: i.selectedPrintId,
        selectedPrintName: i.selectedPrintName,
        giftListId: list.publicId,
        giftItemKey: i.key,
        giftOwnerName: list.ownerFirstName,
      });
    }
    setJustAdded((prev) => [...prev, ...giftable.map((i) => i.key)]);
  }

  async function toggleLink() {
    if (!ownerToken && !getSharedListRef(list.kind)) return;
    const token = ownerToken || getSharedListRef(list.kind)!.editToken;
    const res = await setListActive(list.publicId, token, !linkActive);
    if (res.success) setLinkActive(!linkActive);
  }

  function importToWishlist() {
    const existing = new Set(getWishlistEntries().map((e) => e.productId));
    for (const i of list.items) {
      const opts = {
        size: i.size,
        selectedPrintId: i.selectedPrintId,
        selectedPrintName: i.selectedPrintName,
        heightLength: i.heightLength,
        gender: i.gender,
        notes: i.notes,
        quantity: i.quantity,
      };
      if (existing.has(i.productId)) updateWishlistEntry(i.productId, opts);
      else addToWishlist(i.productId, opts);
    }
    setImported(true);
  }

  const inCart = (key: string) => justAdded.includes(key) || cart.some((c) => c.giftItemKey === key);
  const giftableCount = list.items.filter((i) => i.available && !i.purchased && !inCart(i.key)).length;
  const anyInCart = list.items.some((i) => inCart(i.key));

  return (
    <main className="min-h-screen bg-[#f7f4ee] pt-28 pb-24">
      <div className="max-w-6xl mx-auto px-4">
        {isOwner && (
          <div className="mb-8 rounded-2xl bg-black text-white p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#E8C77A]">Your {what}</p>
              <p className="mt-1 text-[13px] text-white/80">
                This is what people see when you share your link.
                {list.keepSurprise && " Bought items are hidden from you, so it stays a surprise."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {list.kind === "wishlist" && (
                <button onClick={importToWishlist} className="rounded-full border border-white/30 px-4 py-2 text-[11px] uppercase tracking-[0.15em]">
                  {imported ? "Loaded ✓" : "Edit on this device"}
                </button>
              )}
              {imported && (
                <Link href="/wishlist" className="rounded-full bg-white text-black px-4 py-2 text-[11px] uppercase tracking-[0.15em]">
                  Open wishlist
                </Link>
              )}
              <button onClick={toggleLink} className="rounded-full border border-white/30 px-4 py-2 text-[11px] uppercase tracking-[0.15em]">
                {linkActive ? "Switch link off" : "Switch link back on"}
              </button>
            </div>
          </div>
        )}

        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#9E1B32] text-[#E8C77A]">
            {list.kind === "cart" ? <Gift size={24} /> : <Heart size={24} />}
          </div>
          <p className="mt-5 text-[10px] uppercase tracking-[0.4em] text-neutral-500">DAHRIOLA</p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">
            {list.ownerFirstName}&apos;s {what}
          </h1>
          {list.message && (
            <p className="mt-5 font-display italic text-lg text-neutral-700">&ldquo;{list.message}&rdquo;</p>
          )}
          <p className="mt-4 text-[13px] text-neutral-500">
            Sizes and options are already chosen. Pick a piece to gift.
            {list.hasAddress && (
              <span className="mt-1 flex items-center justify-center gap-1">
                <Lock size={12} /> It can be delivered straight to {list.ownerFirstName}. Their address stays private.
              </span>
            )}
          </p>

          {!focus && giftableCount > 1 && (
            <button
              onClick={() => gift(list.items)}
              className="mt-7 inline-flex items-center gap-2 bg-black text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.2em]"
            >
              <Gift size={15} /> Gift everything ({giftableCount})
            </button>
          )}
          {focus && (
            <Link href={`/list/${list.publicId}`} className="mt-6 inline-block text-[12px] underline">
              See {list.ownerFirstName}&apos;s full {what}
            </Link>
          )}
        </motion.header>

        <div className={`mt-12 grid gap-6 ${focus ? "max-w-md mx-auto" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {visible.map((item, idx) => {
            const bought = item.purchased && showBought;
            const added = inCart(item.key);
            const details = [
              item.size && `Size ${item.size}`,
              item.selectedPrintName,
              item.gender && `${item.gender} fit`,
              item.heightLength && `Height/length: ${item.heightLength}`,
              item.quantity > 1 && `Qty ${item.quantity}`,
            ].filter(Boolean);

            return (
              <motion.article
                key={item.key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.06 }}
                className={`bg-white rounded-2xl overflow-hidden border border-neutral-200 flex flex-col ${bought ? "opacity-70" : ""}`}
              >
                <div className="relative aspect-[4/5] bg-neutral-100">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  )}
                  {bought && (
                    <span className="absolute left-3 top-3 rounded-full bg-[#9E1B32] text-white px-3 py-1 text-[10px] uppercase tracking-[0.2em]">
                      Gifted ✓
                    </span>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    {item.slug ? (
                      <Link href={`/product/${item.slug}`} className="text-[15px] font-medium hover:underline">
                        {item.name}
                      </Link>
                    ) : (
                      <span className="text-[15px] font-medium">{item.name}</span>
                    )}
                    <span className="text-[14px] whitespace-nowrap">{money(item.priceNGN)}</span>
                  </div>
                  {details.length > 0 && <p className="mt-2 text-[12px] text-neutral-500">{details.join(" · ")}</p>}
                  {item.notes && <p className="mt-1 text-[12px] text-neutral-500 italic">&ldquo;{item.notes}&rdquo;</p>}

                  <div className="mt-auto pt-5">
                    {!item.available ? (
                      <p className="text-[12px] text-neutral-400">No longer available</p>
                    ) : bought ? (
                      <p className="text-[12px] text-neutral-500">Someone has already gifted this.</p>
                    ) : added ? (
                      <Link
                        href="/checkout"
                        className="w-full h-11 rounded-md bg-[#9E1B32] text-white text-[11px] uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2"
                      >
                        <Check size={14} /> In your cart · Checkout <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <button
                        onClick={() => gift([item])}
                        className="w-full h-11 rounded-md bg-black text-white text-[11px] uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2"
                      >
                        <Gift size={14} /> Gift this
                      </button>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {anyInCart && (
          <div className="sticky bottom-4 mt-10 flex justify-center">
            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 rounded-full bg-black text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.2em] shadow-2xl"
            >
              <Gift size={15} /> Continue to checkout <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
