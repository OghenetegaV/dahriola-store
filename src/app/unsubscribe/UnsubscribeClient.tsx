"use client";

import { useState } from "react";
import Link from "next/link";
import { confirmUnsubscribe } from "@/src/app/actions/unsubscribe";

export default function UnsubscribeClient({ email, token }: { email: string; token: string }) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!email || !token) {
    return <p className="mt-6 text-sm text-neutral-500">Please use the unsubscribe link at the bottom of one of our emails.</p>;
  }

  if (state === "done") {
    return (
      <div className="mt-6 text-sm text-neutral-600 space-y-4">
        <p>
          You&apos;ve been unsubscribed. <strong>{email}</strong> won&apos;t get any more marketing emails from us.
        </p>
        <p className="text-neutral-500">You&apos;ll still get emails about your own orders and event tickets.</p>
        <Link href="/" className="inline-block underline">
          Back to the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-5">
      <p className="text-sm text-neutral-600">
        Stop marketing emails (offers, birthday treats, new collections) to <strong>{email}</strong>?
      </p>
      <button
        onClick={async () => {
          setState("working");
          const res = await confirmUnsubscribe(email, token);
          if (res.success) setState("done");
          else {
            setState("error");
            setMessage(res.message || "Something went wrong.");
          }
        }}
        disabled={state === "working"}
        className="bg-black text-white px-8 py-3 text-xs uppercase tracking-[0.2em] disabled:opacity-60"
      >
        {state === "working" ? "Unsubscribing…" : "Yes, unsubscribe me"}
      </button>
      {state === "error" && <p className="text-sm text-red-600">{message}</p>}
    </div>
  );
}
