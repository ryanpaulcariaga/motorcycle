import Link from 'next/link';
import CatalogPageShell from '@/components/CatalogPageShell';
import CatalogBikeGrid from '@/components/CatalogBikeGrid';
import { getBikes } from '@/lib/api';
import { CATALOG_PAGE_SIZE } from '@/lib/catalogFilters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { items: latestBikes } = await getBikes({
    pageSize: CATALOG_PAGE_SIZE, sortBy: 'year', sortDescending: true,
  });

  return (
    <CatalogPageShell>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold">Latest Bikes</h1>
            <Link
              href="/bikes"
              className="font-semibold text-brand-button hover:underline"
            >
              View all bikes
            </Link>
          </div>
          <CatalogBikeGrid
            initialBikes={latestBikes}
            query={{
              pageSize: CATALOG_PAGE_SIZE,
              sortBy: 'year',
              sortDescending: true,
            }}
          />
    </CatalogPageShell>
  );
}
