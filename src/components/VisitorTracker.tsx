"use client";

// Picks up the visitor ID from links in our emails (?did=…), keeps it on this
// device and tidies the address bar. A click is recorded only if the visitor
// allowed personalised emails.
import { useEffect } from "react";
import { markEmailClick } from "@/src/app/actions/browse";
import { personalisationAllowed, setIdentity } from "@/src/lib/identityClient";

export default function VisitorTracker() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const did = url.searchParams.get("did");
    if (!did) return;
    setIdentity(did);
    url.searchParams.delete("did");
    window.history.replaceState(null, "", url.pathname + (url.search ? url.search : "") + url.hash);
    if (personalisationAllowed()) markEmailClick(did).catch(() => {});
  }, []);
  return null;
}
