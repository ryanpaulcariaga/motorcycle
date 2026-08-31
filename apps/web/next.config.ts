import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Local dev seed data placeholder images
      { protocol: "https", hostname: "placeholder.com" },
      // Azure Blob Storage public container (update hostname per environment)
      { protocol: "https", hostname: "*.blob.core.windows.net" },
    ],
  },
};

export default nextConfig;
