import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Product photos, print swatches and event images in Supabase Storage
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/**",
      },
      // Images that were uploaded before the move to Supabase
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

export default nextConfig;
