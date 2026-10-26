import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Self-contained server bundle for App Service (`node apps/web/server.js`); the monorepo root
  // is the tracing root so hoisted workspace dependencies are included.
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
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
