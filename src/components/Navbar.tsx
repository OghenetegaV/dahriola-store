"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Menu,
  Phone,
  X,
  ChevronDown,
  Instagram,
  Heart,
  Search,
} from "lucide-react";
import { client } from "@/src/lib/sanity";
import { useStore } from "@/src/store/useStore";
import CartDrawer from "./CartDrawer";
import ProductSearch from "./ProductSearch";
import { getWishlist } from "@/src/lib/wishlist";

interface Category {
  title: string;
  slug: string;
}

interface Collection {
  title: string;
  slug: string;
}

type CurrencyCode = "NGN" | "USD" | "GBP" | "EUR" | "CAD";

const currencies: { code: CurrencyCode; country: string }[] = [
  { code: "NGN", country: "ng" },
  { code: "USD", country: "us" },
  { code: "GBP", country: "gb" },
  { code: "EUR", country: "eu" },
  { code: "CAD", country: "ca" },
];

const currencyToCountry: Record<string, string> = {
  NGN: "ng",
  USD: "us",
  GBP: "gb",
  EUR: "eu",
  CAD: "ca",
};

// These are product names (folders) in Sanity, not categories
const COLLECTION_NAMES = ["Soweto", "Nia", "Thabang", "ayeye", "Djembe"];

export default function Navbar() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  const { cart, currency, setCurrency } = useStore();

  if (pathname?.startsWith("/admin")) return null;

  useEffect(() => {
    setHasHydrated(true);

    const handleScroll = () => setScrolled(window.scrollY > 50);
    const syncWishlist = () => setWishlistCount(getWishlist().length);

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("wishlistUpdated", syncWishlist);
    window.addEventListener("storage", syncWishlist);

    const fetchData = async () => {
      const [cats, prods] = await Promise.all([
        client.fetch(`
          *[_type == "category"]{
            title,
            "slug": slug.current
          }
        `),
        client.fetch(`
          *[_type == "product"]{
            _id,
            name,
            briefDescription,
            description,
            priceNGN,
            images,
            _createdAt,
            productType,
            "slug": slug.current,
            "categoryName": category->title
          }
        `),
      ]);

      setCategories(cats);
      setProducts(prods);

      // Build the collection list from products whose names match COLLECTION_NAMES
      // De-duplicate by name so each collection appears once
      const seen = new Set<string>();
      const collectionItems: Collection[] = [];

      for (const name of COLLECTION_NAMES) {
        const match = prods.find(
          (p: any) => p.name?.toLowerCase() === name.toLowerCase()
        );
        if (match && !seen.has(match.name)) {
          seen.add(match.name);
          collectionItems.push({ title: match.name, slug: match.slug });
        } else if (!match) {
          // Fallback: show the name with a slug derived from it
          const fallbackSlug = name.toLowerCase();
          if (!seen.has(name)) {
            seen.add(name);
            collectionItems.push({ title: name, slug: fallbackSlug });
          }
        }
      }

      setCollections(collectionItems);
    };

    fetchData();
    syncWishlist();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wishlistUpdated", syncWishlist);
      window.removeEventListener("storage", syncWishlist);
    };
  }, []);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isHomePage = pathname === "/";
  const shouldShowSolid = scrolled || !isHomePage;

  const navBg = shouldShowSolid
    ? "bg-white/80 backdrop-blur-lg border-b border-neutral-100"
    : "bg-transparent border-transparent";

  const textColor = shouldShowSolid ? "text-neutral-900" : "text-white";
  const iconColor = shouldShowSolid ? "text-brand-beryl" : "text-white";

  return (
    <>
      <nav
        className={`fixed ${
          isHomePage ? "top-8" : "top-0"
        } z-[100] w-full transition-all duration-700 ${navBg}`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 relative">

          {/* LEFT — The Collection | Ready to Wear | Bespoke */}
          <div
            className={`hidden lg:flex items-center gap-10 text-[10px] uppercase tracking-[0.3em] font-bold ${textColor}`}
          >
            {/* The Collection dropdown */}
            <div className="relative group h-20 flex items-center cursor-pointer">
              <span className="flex items-center gap-2 hover:text-brand-beryl transition-colors cursor-pointer">
                New Collection{" "}
                <ChevronDown
                  size={10}
                  className="group-hover:rotate-180 transition-transform duration-500"
                />
              </span>

              <div className="absolute left-[-20px] top-full overflow-hidden max-h-0 opacity-0 group-hover:max-h-[400px] group-hover:opacity-100 transition-all duration-500 ease-in-out z-[110]">
                <div className="bg-white/95 backdrop-blur-xl border border-neutral-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-sm mt-1">
                  <div className="flex flex-col">
                    {/* <Link
                      href="/category/all"
                      className="px-6 py-3 group/item flex justify-between items-center bg-neutral-50/30 border-b border-neutral-50"
                    >
                      <span className="text-brand-beryl font-black text-[9px] tracking-[0.2em]">
                        All Products
                      </span>
                      <span className="text-[10px] opacity-40 group-hover/item:opacity-100 transition-all">
                        →
                      </span>
                    </Link> */}
                    <div className="flex flex-col gap-0.5 p-3 min-w-[180px]">
                      {collections.length > 0 ? (
                        collections.map((col) => (
                          <Link
                            key={col.slug}
                            href={`/product/${col.slug}`}
                            className="px-4 py-2 text-neutral-500 hover:text-neutral-900 transition-all flex items-center gap-2.5 whitespace-nowrap group/link"
                          >
                            <span className="w-1 h-1 rounded-full bg-neutral-200 group-hover/link:bg-brand-beryl transition-colors" />
                            <span className="text-[9.5px] tracking-widest">
                              {col.title}
                            </span>
                          </Link>
                        ))
                      ) : (
                        <p className="px-4 py-2 text-[9px] text-neutral-300 tracking-widest">
                          Loading...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ready to Wear dropdown */}
            <div className="relative group h-20 flex items-center cursor-pointer">
              <Link
                href="/category/all"
                className="flex items-center gap-2 hover:text-brand-beryl transition-colors"
              >
                Ready to Wear{" "}
                <ChevronDown
                  size={10}
                  className="group-hover:rotate-180 transition-transform duration-500"
                />
              </Link>

              <div className="absolute left-[-20px] top-full overflow-hidden max-h-0 opacity-0 group-hover:max-h-[400px] group-hover:opacity-100 transition-all duration-500 ease-in-out z-[110]">
                <div className="bg-white/95 backdrop-blur-xl border border-neutral-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-sm mt-1">
                  <div className="flex flex-col">
                    <Link
                      href="/category/rtw"
                      className="px-6 py-3 group/item flex justify-between items-center bg-neutral-50/30 border-b border-neutral-50"
                    >
                      <span className="text-brand-beryl font-black text-[9px] tracking-[0.2em]">
                        All Product
                      </span>
                      <span className="text-[10px] opacity-40 group-hover/item:opacity-100 transition-all">
                        →
                      </span>
                    </Link>
                    <div className="grid grid-rows-3 grid-flow-col gap-x-6 gap-y-0.5 p-3 min-w-max">
                      {categories
                        .filter((cat) => cat.slug !== "bespoke")
                        .map((cat) => (
                          <Link
                            key={cat.slug}
                            href={`/category/${cat.slug}`}
                            className="px-4 py-2 text-neutral-500 hover:text-neutral-900 transition-all flex items-center gap-2.5 whitespace-nowrap group/link"
                          >
                            <span className="w-1 h-1 rounded-full bg-neutral-200 group-hover/link:bg-brand-beryl transition-colors" />
                            <span className="text-[9.5px] tracking-widest">
                              {cat.title}
                            </span>
                          </Link>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/bespoke">Bespoke</Link>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className={`p-2 lg:hidden ${iconColor}`}
          >
            <Menu size={28} />
          </button>

          {/* LOGO */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <Image
              src="/logo.png"
              alt="Dahriola Logo"
              width={160}
              height={45}
              className="h-9 w-auto md:h-11"
              style={{ filter: "none" }}
              priority
            />
          </Link>

          {/* RIGHT — Currency | Phone | Search | Wishlist | Cart */}
          <div className="flex items-center gap-3 sm:gap-6">

            {/* CURRENCY — moved here from the left */}
            <div className={`relative group h-20 hidden lg:flex items-center cursor-pointer text-[10px] uppercase tracking-[0.3em] font-bold ${textColor}`}>
              <div className="flex items-center gap-2 hover:text-brand-beryl">
                <img
                  src={`https://flagcdn.com/w20/${currencyToCountry[currency]}.png`}
                  alt={currency}
                  className="w-4 h-3 object-cover rounded-[2px]"
                />
                <span>{currency}</span>
              </div>

              <div className="absolute right-0 top-full overflow-hidden max-h-0 opacity-0 group-hover:max-h-[300px] group-hover:opacity-100 transition-all duration-500 z-[110]">
                <div className="bg-white border shadow-xl py-3 min-w-[130px]">
                  {currencies.map((cur) => (
                    <button
                      key={cur.code}
                      type="button"
                      onClick={() => setCurrency(cur.code)}
                      className={`flex items-center gap-3 w-full px-6 py-2 text-[9px] ${
                        currency === cur.code
                          ? "text-brand-beryl font-bold"
                          : "text-neutral-400"
                      }`}
                    >
                      <img
                        src={`https://flagcdn.com/w20/${cur.country}.png`}
                        alt={cur.code}
                        className="w-4 h-3 object-cover rounded-[2px]"
                      />
                      {cur.code}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="https://wa.me/2347069996877"
              target="_blank"
              className={`hidden sm:block ${iconColor}`}
            >
              <Phone size={20} />
            </Link>

            <button
              onClick={() => setIsSearchOpen(true)}
              className={iconColor}
            >
              <Search size={22} />
            </button>

            <Link href="/wishlist" className={`relative ${iconColor}`}>
              <Heart size={22} />
              {hasHydrated && wishlistCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 text-[8px] bg-brand-beryl text-white flex items-center justify-center rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative ${iconColor}`}
            >
              <ShoppingBag size={22} />
              {hasHydrated && totalItems > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 text-[8px] bg-brand-beryl text-white flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* SEARCH OVERLAY */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[150] bg-white">
          <div className="flex justify-between px-6 py-5 border-b">
            <p>Search</p>
            <button onClick={() => setIsSearchOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <div className="p-6">
            <ProductSearch products={products} isOverlay />
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/5 z-[120]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 z-[130] h-full w-full max-w-[320px] bg-white p-10 shadow-2xl transition-transform duration-700 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-16">
            <Image
              src="/logo.png"
              alt="Dahriola"
              width={110}
              height={35}
              className="h-7 w-auto"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-300 hover:text-black"
            >
              <X size={28} strokeWidth={1} />
            </button>
          </div>

          <nav className="flex flex-col gap-10">
            {/* The Collection */}
            <div className="flex flex-col">
              <p className="font-display text-2xl text-neutral-900 tracking-tight border-b border-neutral-100 pb-2">
                New Collection
              </p>
              <div className="flex flex-col gap-5 mt-6 pl-4 border-l-2 border-brand-beryl/10">
                {collections.length > 0 ? (
                  collections.map((col) => (
                    <Link
                      key={col.slug}
                      href={`/product/${col.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl"
                    >
                      {col.title}
                    </Link>
                  ))
                ) : (
                  <p className="text-[10px] uppercase text-neutral-300">
                    Loading...
                  </p>
                )}
              </div>
            </div>

            {/* Ready-to-Wear */}
            <div className="flex flex-col">
              <p className="font-display text-2xl text-neutral-900 tracking-tight border-b border-neutral-100 pb-2">
                Ready-to-Wear
              </p>
              <div className="flex flex-col gap-5 mt-6 pl-4 border-l-2 border-brand-beryl/10">
                {categories.length > 0 ? (
                  categories
                    .filter((cat) => cat.slug !== "bespoke")
                    .map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/category/${cat.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl"
                      >
                        {cat.title}
                      </Link>
                    ))
                ) : (
                  <p className="text-[10px] uppercase text-neutral-300">
                    Loading categories...
                  </p>
                )}
              </div>
            </div>

            <Link
              href="/bespoke"
              onClick={() => setIsOpen(false)}
              className="font-display text-2xl text-neutral-900 tracking-tight"
            >
              Bespoke Gallery
            </Link>
          </nav>

          <div className="mt-auto pt-10 border-t border-neutral-50 flex items-center justify-between">
            <div className="flex gap-4 flex-wrap">
              {currencies.map((cur) => (
                <button
                  key={cur.code}
                  type="button"
                  onClick={() => setCurrency(cur.code)}
                  className={`flex items-center gap-2 text-[10px] font-bold ${
                    currency === cur.code
                      ? "text-brand-beryl"
                      : "text-neutral-300"
                  }`}
                >
                  <img
                    src={`https://flagcdn.com/w20/${cur.country}.png`}
                    alt={cur.code}
                    className="w-4 h-3 object-cover rounded-[2px]"
                  />
                  {cur.code}
                </button>
              ))}
            </div>

            <a
              href="https://instagram.com/dahriola_"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-900"
            >
              <Instagram size={20} strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}