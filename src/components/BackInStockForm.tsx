"use client";

import { useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { requestStockAlert } from "@/src/app/actions/stockAlert";

type SoldOutPrint = { _id: string; name: string };

export default function BackInStockForm({ productId, prints }: { productId: string; prints: SoldOutPrint[] }) {
  const [open, setOpen] = useState(false);
  const [printId, setPrintId] = useState(prints[0]?._id || "");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!prints.length) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-neutral-600 underline underline-offset-4 hover:text-black"
      >
        <Bell size={13} /> Sold out in a print you love? Get notified
      </button>
    );
  }

  if (state === "done") {
    return (
      <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-brand-beryl">
        <Check size={13} /> {message}
      </p>
    );
  }

  return (
    <form
      className="mt-3 rounded-lg border border-neutral-200 p-3 space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("saving");
        const res = await requestStockAlert({ email, productId, printId });
        setMessage(res.message);
        setState(res.success ? "done" : "error");
      }}
    >
      <p className="text-[12px] text-neutral-600">We&apos;ll email you once it&apos;s back. No other emails.</p>
      {prints.length > 1 && (
        <select
          aria-label="Sold-out print"
          value={printId}
          onChange={(e) => setPrintId(e.target.value)}
          className="w-full border border-neutral-200 rounded-md px-2.5 py-2 text-[12px] bg-white"
        >
          {prints.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-2">
        <input
          type="email"
          required
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 border border-neutral-200 rounded-md px-2.5 py-2 text-[12px]"
        />
        <button
          type="submit"
          disabled={state === "saving"}
          className="shrink-0 rounded-md bg-black px-4 text-[11px] uppercase tracking-[0.15em] text-white disabled:opacity-60"
        >
          {state === "saving" ? <Loader2 size={14} className="animate-spin" /> : "Notify me"}
        </button>
      </div>
      {prints.length === 1 && <p className="text-[11px] text-neutral-400">Print: {prints[0].name}</p>}
      {state === "error" && <p className="text-[12px] text-red-600">{message}</p>}
    </form>
  );
}
