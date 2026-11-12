// Loads GA4 (gtag.js) with Google Consent Mode v2: analytics and ad cookies
// stay OFF until the visitor accepts in the cookie banner (CookieConsent).
// Client-side page navigations are tracked by GA4's enhanced measurement.
import Script from "next/script";
import { GA_ID } from "@/src/lib/analytics";
import { CONSENT_KEY } from "@/src/lib/consent";

export default function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script id="ga4-consent-default" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          var saved = null;
          try { saved = JSON.parse(localStorage.getItem('${CONSENT_KEY}') || 'null'); } catch (e) {}
          var granted = saved && saved.analytics === true;
          gtag('consent', 'default', {
            analytics_storage: granted ? 'granted' : 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            wait_for_update: 500
          });
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
    </>
  );
}
