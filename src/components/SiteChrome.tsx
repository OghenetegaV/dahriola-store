"use client";

// Shows the shop's header, footer and pop-ups everywhere except the store
// dashboard, which has its own layout.
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
