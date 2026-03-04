import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
      },
    ],
  },
  // If you are using Turbopack, keep this enabled
  experimental: {
    turbo: {
      // Turbopack specific settings can go here if needed
    },
  },
};

export default nextConfig;