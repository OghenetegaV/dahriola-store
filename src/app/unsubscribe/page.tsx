import type { Metadata } from "next";
import UnsubscribeClient from "./UnsubscribeClient";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ e?: string; t?: string }> }) {
  const { e = "", t = "" } = await searchParams;
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 pt-32 pb-20">
      <div className="max-w-md w-full text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400">DAHRIOLA</p>
        <h1 className="mt-4 font-display text-3xl">Unsubscribe</h1>
        <UnsubscribeClient email={e} token={t} />
      </div>
    </main>
  );
}
