import Link from 'next/link';
import CatalogPageShell from '@/components/CatalogPageShell';
import BikeCardContent from '@/components/BikeCardContent';
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
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {latestBikes.map((bike) => (
              <Link
                key={bike.id}
                href={`/bikes/${bike.slug}`}
                className="border border-zinc-200 overflow-hidden transition-colors hover:border-brand-gold"
              >
                <BikeCardContent bike={bike}>
                  <p className="font-semibold">
                    {bike.variantName}
                  </p>
                  <p className="text-sm text-brand-grey">
                    {bike.year}{' '}
                    {bike.msrpPrice !== null
                      ? `· MSRP $${bike.msrpPrice.toLocaleString()}`
                      : ''}
                  </p>
                </BikeCardContent>
              </Link>
            ))}
          </div>
    </CatalogPageShell>
  );
}
