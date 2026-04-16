import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Concierge from "../components/Concierge";
import Footer from "../components/Footer";
import AnnouncementBar from "../components/AnnouncementBar";
import NewsletterPopup from "../components/NewsletterPopup";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dahriola.com"), // Update this to your live domain when ready

  title: {
    default: "Dahriola | Artisanal African Luxury",
    template: "%s | Dahriola",
  },

  description:
    "Experience Dahriola: A premium Nigerian fashion house specializing in artisanal apparel, bespoke tailoring, and handcrafted luxury goods.",

  keywords: [
    "Dahriola",
    "African luxury fashion",
    "bespoke tailoring Nigeria",
    "handcrafted luxury",
    "ready to wear Nigeria",
    "Wura Skirt",
    "Feyi Bubu",
    "Tolu Dress",
    "Artisanal fashion brand",
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
    title: "Dahriola | Artisanal African Luxury",
    description: "Premium editorial collections and bespoke tailoring handcrafted in Nigeria.",
    images: [
      {
        url: "/og-image.jpg", // Make sure to place a high-res campaign image at public/og-image.jpg
        width: 1200,
        height: 630,
        alt: "Dahriola Luxury Collection",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Dahriola | Artisanal African Luxury",
    description: "Premium editorial collections and bespoke tailoring handcrafted in Nigeria.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${playfair.variable} ${inter.variable} font-sans bg-brand-white text-neutral-900 antialiased`}
      >
        {/* <AnnouncementBar /> */}
        <Navbar />
        <main>{children}</main>
        <Concierge />
        <NewsletterPopup />
        <Footer />
      </body>
    </html>
  );
}