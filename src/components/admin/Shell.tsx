"use client";

// The dashboard frame: sidebar on desktop, slide-in menu on phones.
import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ExternalLink,
  Gift,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Palette,
  Settings,
  Shirt,
  ShoppingBag,
  Star,
  Tag,
  Tags,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/src/app/admin/actions/auth";
import { ToastProvider, cx } from "@/src/components/admin/ui";

export type NavCounts = { orders?: number; reviews?: number; lowStock?: number };

type Item = { href: string; label: string; icon: LucideIcon; badge?: keyof NavCounts };
const GROUPS: { title?: string; items: Item[] }[] = [
  {
    items: [
      { href: "/admin", label: "Home", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: "orders" },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Shop",
    items: [
      { href: "/admin/products", label: "Products", icon: Shirt },
      { href: "/admin/prints", label: "Prints & stock", icon: Palette, badge: "lowStock" },
      { href: "/admin/categories", label: "Categories", icon: Tags },
      { href: "/admin/coupons", label: "Discount codes", icon: Tag },
      { href: "/admin/reviews", label: "Reviews", icon: Star, badge: "reviews" },
    ],
  },
  {
    title: "Community",
    items: [
      { href: "/admin/events", label: "Events & RSVPs", icon: CalendarDays },
      { href: "/admin/lists", label: "Gift lists", icon: Gift },
      { href: "/admin/marketing", label: "Emails & marketing", icon: Mail },
    ],
  },
  {
    title: "Account",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function Nav({ counts, onNavigate }: { counts: NavCounts; onNavigate?: () => void }) {
  const pathname = usePathname() || "/admin";
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {GROUPS.map((group, gi) => (
        <div key={gi}>
          {group.title && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{group.title}</p>}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const count = item.badge ? counts[item.badge] : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    )}
                  >
                    <item.icon size={17} strokeWidth={1.75} />
                    <span className="flex-1">{item.label}</span>
                    {!!count && (
                      <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-semibold", active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800")}>
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Footer({ name, email }: { name: string; email: string }) {
  return (
    <div className="border-t border-neutral-200 p-3">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      >
        <ExternalLink size={17} strokeWidth={1.75} /> View the shop
      </a>
      <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-beryl text-xs font-semibold uppercase text-white">
          {(name || email).slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-neutral-900">{name || "Signed in"}</p>
          <p className="truncate text-xs text-neutral-500">{email}</p>
        </div>
        <form action={signOut}>
          <button type="submit" aria-label="Sign out" title="Sign out" className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Shell({ children, counts, name, email }: { children: ReactNode; counts: NavCounts; name: string; email: string }) {
  const [open, setOpen] = useState(false);

  const brand = (
    <Link href="/admin" className="flex items-center gap-2.5">
      <Image src="/logo.png" alt="DAHRIOLA" width={120} height={34} className="h-7 w-auto object-contain" priority />
    </Link>
  );

  return (
    <ToastProvider>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-neutral-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-neutral-200 px-6">{brand}</div>
        <Nav counts={counts} />
        <Footer name={name} email={email} />
      </aside>

      {/* Phone top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:hidden">
        {brand}
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-100">
          <Menu size={22} />
        </button>
      </header>

      {/* Phone menu */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-4">
              {brand}
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-100">
                <X size={20} />
              </button>
            </div>
            <Nav counts={counts} onNavigate={() => setOpen(false)} />
            <Footer name={name} email={email} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </ToastProvider>
  );
}
