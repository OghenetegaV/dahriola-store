"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Gift, Heart, Link2, Share2, ShoppingBag, Trash2 } from "lucide-react";
import { urlFor } from "@/src/lib/sanity";
import { useStore } from "@/src/store/useStore";
import { getProductsByIds, type WishlistProductData } from "@/src/app/actions/catalog";
import { getListForOwner } from "@/src/app/actions/sharedList";
import ShareListModal from "@/src/components/ShareListModal";
import {
  getSharedListRef,
  getWishlistEntries,
  removeFromWishlist,
  updateWishlistEntry,
  type WishlistEntry,
} from "@/src/lib/wishlist";

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
const DRESS_SIZES = ["XS", "S", "M", "L(12)", "L(14)", "XL(16)", "XL(18)", "2XL", "3XL"];

type Row = { entry: WishlistEntry; product: WishlistProductData };

export default function WishlistPage() {
  const { addItem, currency, exchangeRates } = useStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [itemKeys, setItemKeys] = useState<Record<string, string>>({});
  const [added, setAdded] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    const entries = getWishlistEntries();
    if (!entries.length) {
      setRows([]);
      setLoading(false);
      return;
    }
    const products = await getProductsByIds(entries.map((e) => e.productId));
    const byId = new Map(products.map((p) => [p._id, p]));
    setRows(entries.filter((e) => byId.has(e.productId)).map((e) => ({ entry: e, product: byId.get(e.productId)! })));
    setLoading(false);
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    window.addEventListener("wishlistUpdated", load);

    // If this wishlist was shared before, fetch the link + per-item keys
    const ref = getSharedListRef("wishlist");
    if (ref) {
      getListForOwner(ref.publicId, ref.editToken)
        .then((list) => {
          if (!list) return;
          setShareUrl(`${window.location.origin}/list/${list.publicId}`);
          setItemKeys(Object.fromEntries(list.items.map((i) => [i.productId, i.key])));
        })
        .catch(() => {});
    }
    return () => {
      clearTimeout(first);
      window.removeEventListener("wishlistUpdated", load);
    };
  }, [load]);

  const update = (productId: string, changes: Partial<WishlistEntry>) => {
    updateWishlistEntry(productId, changes);
  };

  const money = (ngn: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(ngn * (exchangeRates[currency] || 1));

  function addToCart({ entry, product }: Row) {
    addItem({
      _id: product._id,
      name: product.name,
      price: product.priceNGN,
      image: product.images?.[0] ? urlFor(product.images[0]).url() : "",
      quantity: entry.quantity || 1,
      size: entry.size || "M",
      notes: entry.notes || "",
      heightLength: entry.heightLength,
      gender: entry.gender,
      selectedPrintId: entry.selectedPrintId,
      selectedPrintName: entry.selectedPrintName,
    });
    setAdded(product._id);
    setTimeout(() => setAdded(null), 1800);
  }

  async function copyItemLink(productId: string) {
    const key = itemKeys[productId];
    if (!shareUrl || !key) return;
    try {
      await navigator.clipboard.writeText(`${shareUrl}?item=${key}`);
      setCopiedKey(productId);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {}
  }

  const shareItems = rows.map(({ entry }) => ({
    key: itemKeys[entry.productId],
    productId: entry.productId,
    size: entry.size,
    selectedPrintId: entry.selectedPrintId,
    selectedPrintName: entry.selectedPrintName,
    heightLength: entry.heightLength,
    gender: entry.gender,
    notes: entry.notes,
    quantity: entry.quantity || 1,
  }));

  if (loading) {
    return <div className="px-4 pt-32 pb-16 max-w-6xl mx-auto text-sm text-neutral-500">Loading wishlist…</div>;
  }

  if (!rows.length) {
    return (
      <main className="px-4 pt-36 pb-24 max-w-xl mx-auto text-center">
        <Heart className="mx-auto text-neutral-300" size={40} />
        <h1 className="mt-4 font-display text-3xl">Your wishlist is empty</h1>
        <p className="mt-2 text-sm text-neutral-500">Tap the heart on any piece to save it here, then share your list so someone can gift it to you.</p>
        <Link href="/category/all" className="mt-6 inline-block bg-black text-white px-6 py-3 text-xs uppercase tracking-[0.2em]">
          Browse the collection
        </Link>
      </main>
    );
  }

  const field = "w-full border border-neutral-200 rounded-md px-2.5 py-2 text-[12px] bg-white focus:outline-none focus:border-black";

  return (
    <main className="max-w-6xl mx-auto px-4 pt-32 pb-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Wishlist</h1>
          <p className="mt-2 text-sm text-neutral-500 max-w-xl">
            Choose your size and options, then share your wishlist. Whoever opens the link can buy pieces for you, exactly as you want them.
          </p>
        </div>
        <button
          onClick={() => setShareOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 text-xs uppercase tracking-[0.2em] self-start md:self-auto"
        >
          <Gift size={15} /> {shareUrl ? "Update share link" : "Share my wishlist"}
        </button>
      </div>

      {shareUrl && (
        <div className="mb-8 rounded-xl border border-[#E8C77A] bg-[#fdf9f0] px-4 py-3 text-[13px] flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <span>
            Your wishlist is shared at{" "}
            <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="underline break-all">
              {shareUrl.replace(/^https?:\/\//, "")}
            </a>
          </span>
          <span className="text-[11px] text-neutral-500">Changed something? Click &ldquo;Update share link&rdquo;.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rows.map((row) => {
          const { entry, product } = row;
          const cat = (product.categoryName || "").toLowerCase();
          const sizes = cat.includes("dress") ? DRESS_SIZES : DEFAULT_SIZES;
          const needsLength = !cat.includes("jacket");
          // Some products reference the same print twice in Sanity — show it once
          const prints = (product.prints || [])
            .filter((p) => p && p.isActive !== false)
            .filter((p, i, all) => all.findIndex((x) => x._id === p._id) === i);

          return (
            <div key={product._id} className="border border-neutral-200 rounded-2xl overflow-hidden bg-white flex flex-col">
              <Link href={`/product/${product.slug}`} className="block aspect-[4/5] bg-[#f5f5f5] overflow-hidden">
                {product.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={urlFor(product.images[0]).width(600).height(750).url()}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-500"
                  />
                ) : null}
              </Link>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/product/${product.slug}`} className="text-[15px] font-medium leading-snug hover:underline">
                    {product.name}
                  </Link>
                  <span className="text-[14px] whitespace-nowrap">{money(product.priceNGN)}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <select aria-label="Size" value={entry.size || ""} onChange={(e) => update(product._id, { size: e.target.value })} className={field}>
                    <option value="">Size</option>
                    {sizes.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Fit"
                    value={entry.gender || ""}
                    onChange={(e) => update(product._id, { gender: e.target.value })}
                    className={field}
                  >
                    <option value="">Fit</option>
                    <option>Female</option>
                    <option>Male</option>
                  </select>
                  {prints.length > 0 && (
                    <select
                      aria-label="Print"
                      value={entry.selectedPrintId || ""}
                      onChange={(e) => {
                        const p = prints.find((x) => x._id === e.target.value);
                        update(product._id, { selectedPrintId: p?._id, selectedPrintName: p?.name });
                      }}
                      className={`${field} col-span-2`}
                    >
                      <option value="">Print / material</option>
                      {prints.map((p) => (
                        <option key={p._id} value={p._id} disabled={Number(p.stockQuantity || 0) <= 0}>
                          {p.name}
                          {Number(p.stockQuantity || 0) <= 0 ? " (sold out)" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                  {needsLength && (
                    <input
                      placeholder={`Height / length, e.g. 5'6"`}
                      value={entry.heightLength || ""}
                      onChange={(e) => update(product._id, { heightLength: e.target.value })}
                      className={`${field} col-span-2`}
                    />
                  )}
                  <input
                    placeholder="Notes (optional)"
                    value={entry.notes || ""}
                    onChange={(e) => update(product._id, { notes: e.target.value })}
                    className={`${field} col-span-2`}
                  />
                  <div className="col-span-2 flex items-center gap-2 text-[12px] text-neutral-600">
                    Qty
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={entry.quantity || 1}
                      onChange={(e) => update(product._id, { quantity: Math.min(20, Math.max(1, Number(e.target.value) || 1)) })}
                      className={`${field} w-20`}
                    />
                  </div>
                </div>

                <div className="mt-auto pt-4 flex items-center gap-2">
                  <button
                    onClick={() => addToCart(row)}
                    className="flex-1 h-10 rounded-md bg-black text-white text-[11px] uppercase tracking-[0.15em] inline-flex items-center justify-center gap-2"
                  >
                    {added === product._id ? <Check size={14} /> : <ShoppingBag size={14} />}
                    {added === product._id ? "Added" : "Add to cart"}
                  </button>
                  {shareUrl && itemKeys[product._id] && (
                    <button
                      onClick={() => copyItemLink(product._id)}
                      title="Copy a link to just this item"
                      className="h-10 px-3 rounded-md border border-neutral-200 text-[11px] inline-flex items-center gap-1 hover:border-black"
                    >
                      {copiedKey === product._id ? <Check size={14} /> : <Link2 size={14} />}
                    </button>
                  )}
                  <button
                    onClick={() => removeFromWishlist(product._id)}
                    title="Remove"
                    aria-label={`Remove ${product.name}`}
                    className="h-10 px-3 rounded-md border border-neutral-200 hover:border-red-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <button onClick={() => setShareOpen(true)} className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.2em] underline underline-offset-4">
          <Share2 size={14} /> Share this wishlist
        </button>
      </div>

      <ShareListModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        kind="wishlist"
        items={shareItems}
        onSaved={(url, keys) => {
          setShareUrl(url);
          setItemKeys(Object.fromEntries(keys.map((k) => [k.productId, k.key])));
        }}
      />
    </main>
  );
}
