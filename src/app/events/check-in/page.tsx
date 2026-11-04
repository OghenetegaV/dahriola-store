"use client";

// Staff door check-in. Scanning a ticket QR opens this page with ?code=XXXXXX.
// Access is protected by EVENT_CHECKIN_PASSCODE (checked on the server).
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { checkInTicket, lookupTicket, type TicketLookup } from "@/src/app/actions/rsvp";

const PASS_KEY = "dahriola-checkin-pass";

export default function CheckInPage() {
  const [passcode, setPasscode] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<TicketLookup | null>(null);
  const [loading, setLoading] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  useEffect(() => {
    let saved = "";
    try {
      saved = sessionStorage.getItem(PASS_KEY) || "";
    } catch {}
    const fromUrl = new URLSearchParams(window.location.search).get("code") || "";
    setPasscode(saved);
    setCode(fromUrl.toUpperCase());
    if (saved && fromUrl) run(() => lookupTicket(fromUrl, saved));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(action: () => Promise<TicketLookup>, markCheckedIn = false) {
    setLoading(true);
    setJustCheckedIn(false);
    try {
      const res = await action();
      setResult(res);
      if (res.success) {
        try {
          sessionStorage.setItem(PASS_KEY, passcode || sessionStorage.getItem(PASS_KEY) || "");
        } catch {}
        if (markCheckedIn) setJustCheckedIn(true);
      }
    } catch {
      setResult({ success: false, message: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  }

  const input = "w-full border border-neutral-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-black";

  return (
    <div className="min-h-screen bg-neutral-50 pt-32 pb-16 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-neutral-200 p-6 space-y-5">
        <h1 className="font-display text-2xl">Event check-in</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => lookupTicket(code, passcode));
          }}
          className="space-y-3"
        >
          <input
            type="password"
            placeholder="Staff passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className={input}
            autoComplete="off"
          />
          <input
            placeholder="Ticket code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className={`${input} tracking-[0.3em] uppercase`}
            autoComplete="off"
          />
          <button type="submit" disabled={loading} className="w-full bg-black text-white rounded-lg py-3 disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Find ticket"}
          </button>
        </form>

        {result && !result.success && (
          <p className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={16} /> {result.message}
          </p>
        )}

        {result?.success && (
          <div className="rounded-xl border border-neutral-200 p-4 space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">{result.ticket.eventTitle}</p>
            <p className="text-xl font-medium">{result.ticket.name}</p>
            <p className="text-sm text-neutral-600">
              {result.ticket.email} · admits {1 + result.ticket.guests}
            </p>

            {result.ticket.checkedIn ? (
              <p className={`flex items-center gap-2 text-sm ${justCheckedIn ? "text-green-700" : "text-amber-700"}`}>
                <CheckCircle2 size={16} />
                {justCheckedIn
                  ? "Checked in"
                  : `Already checked in${result.ticket.checkedInAt ? ` at ${new Date(result.ticket.checkedInAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" })}` : ""}`}
              </p>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => run(() => checkInTicket(result.ticket.ticketCode, passcode), true)}
                className="w-full bg-green-700 text-white rounded-lg py-3 disabled:opacity-60"
              >
                Check in
              </button>
            )}

            <p className="text-xs text-neutral-500 pt-2">
              Arrived: {result.stats.checkedIn} of {result.stats.registered} registered
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
