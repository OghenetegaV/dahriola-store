import type { Metadata } from "next";
import BespokeGallery from "@/src/components/BespokeGallery";

export const metadata: Metadata = {
  title: "Bespoke Tailoring | Dahriola",
  description:
    "Explore Dahriola bespoke tailoring, custom African fashion, handcrafted pieces, and made-to-measure luxury designs.",
  openGraph: {
    title: "Bespoke Tailoring | Dahriola",
    description:
      "Explore Dahriola bespoke tailoring, custom African fashion, handcrafted pieces, and made-to-measure luxury designs.",
    url: "https://www.dahriola.com/bespoke",
    siteName: "Dahriola",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Dahriola Bespoke Tailoring",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bespoke Tailoring | Dahriola",
    description:
      "Explore Dahriola bespoke tailoring, custom African fashion, handcrafted pieces, and made-to-measure luxury designs.",
    images: ["/og-image.jpg"],
  },
};

export default function BespokePage() {
  return <BespokeGallery />;
}