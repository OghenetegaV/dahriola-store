import type { Metadata } from "next";
import { PT_Serif, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Concierge from "../components/Concierge";
import Footer from "../components/Footer";
import AnnouncementBar from "../components/AnnouncementBar";
import NewsletterPopup from "../components/NewsletterPopup";
import EventPopup from "../components/EventPopup";
import GoogleAnalytics from "../components/GoogleAnalytics";
import CookieConsent from "../components/CookieConsent";
import VisitorTracker from "../components/VisitorTracker";
import SiteChrome from "../components/SiteChrome";
import type { EventSummary } from "../lib/events";
import { getActiveEvent as loadActiveEvent } from "../lib/eventsData";

const ptSerif = PT_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pt-serif",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dahriola.com"),

  title: {
    default: "Dahriola | African Contemporary Fashion",
    template: "%s | Dahriola",
  },

  description:
    "Experience Dahriola: A premium Nigerian fashion house specializing in African print apparel, bespoke tailoring, and handcrafted luxury goods.",

  keywords: [
    "Dahriola",
    "African luxury fashion",
    "bespoke tailoring Nigeria",
    "handcrafted luxury",
    "ready to wear Nigeria",
    "Wura Skirt",
    "Feyi Bubu",
    "Tolu Dress",
  ],

  authors: [{ name: "Dahriola" }],
  creator: "Dahriola",
  publisher: "Dahriola",

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },

  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://dahriola.com",
    siteName: "Dahriola",
    title: "Dahriola | African Contemporary Fashion",
    description:
      "Premium editorial collections and bespoke tailoring handcrafted in Nigeria.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Dahriola Luxury Collection",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Dahriola | African Contemporary Fashion",
    description:
      "Premium editorial collections and bespoke tailoring handcrafted in Nigeria.",
    images: ["/og-image.jpg"],
  },
};

// Re-check the database at most once a minute so turning an event pop-up on/off
// shows up without a redeploy
export const revalidate = 60;

async function getActiveEvent(): Promise<EventSummary | null> {
  try {
    return await loadActiveEvent();
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const activeEvent = await getActiveEvent();

  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${ptSerif.variable} ${inter.variable} font-sans bg-brand-white text-neutral-900 antialiased`}
      >
        {/* The dashboard at /admin has its own layout: no shop header, footer or pop-ups */}
        <SiteChrome>
          <Navbar />
        </SiteChrome>
        <main>{children}</main>
        <SiteChrome>
          <Concierge />
          {/* While an event is promoted, its pop-up replaces the newsletter auto-popup.
              The newsletter popup stays mounted so the footer/announcement triggers still work. */}
          {activeEvent && <EventPopup event={activeEvent} />}
          <NewsletterPopup autoOpen={!activeEvent} />
          <Footer />
          <GoogleAnalytics />
          <CookieConsent />
          <VisitorTracker />
        </SiteChrome>
      </body>
    </html>
  );
}