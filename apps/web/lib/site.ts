/** Public base URL used for sitemap and robots output. Set NEXT_PUBLIC_SITE_URL for deployed environments. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhost:3000").replace(/\/+$/, "");
