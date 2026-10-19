import type { MetadataRoute } from 'next';
import { getBikes } from '@/lib/api';
import { SITE_URL } from '@/lib/site';

// Rebuilt at most hourly so newly published bikes appear without a redeploy.
export const revalidate = 3600;

const PAGE_SIZE = 100;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/bikes`, changeFrequency: 'daily', priority: 0.8 },
  ];

  try {
    let page = 1;
    let totalPages = 1;
    do {
      const result = await getBikes({ page, pageSize: PAGE_SIZE });
      totalPages = result.totalPages;
      for (const bike of result.items) {
        entries.push({
          url: `${SITE_URL}/bikes/${encodeURIComponent(bike.slug)}`,
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
      page += 1;
    } while (page <= totalPages);
  } catch {
    // The API may be unavailable (for example during a build); serve the static entries.
  }

  return entries;
}
