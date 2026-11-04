// Loads GA4 (gtag.js). Client-side page navigations are tracked by GA4's
// enhanced measurement ("page changes based on browser history events"),
// which is on by default for new web streams.
import Script from "next/script";
import { GA_ID } from "@/src/lib/analytics";

export default function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
