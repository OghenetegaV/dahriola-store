import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Store dashboard", template: "%s · DAHRIOLA dashboard" },
  robots: { index: false, follow: false },
};

// Nothing here is ever cached: it is all private, per-person data
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f6f5f1] font-sans text-neutral-900">{children}</div>;
}
