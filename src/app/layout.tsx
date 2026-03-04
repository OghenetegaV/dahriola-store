import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Concierge from "../components/Concierge";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Dahriola Boutique | Ready-to-Wear & Bespoke",
  description: "A premium Nigerian fashion house offering luxury editorial collections and custom tailoring.",
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
        <Navbar />
        <main>{children}</main>
        <Concierge />
      </body>
    </html>
  );
}