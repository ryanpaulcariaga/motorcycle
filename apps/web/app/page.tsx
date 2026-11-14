import Link from 'next/link';
import CatalogPageShell from '@/components/CatalogPageShell';
import BikeCardContent from '@/components/BikeCardContent';
import { getBikes } from '@/lib/api';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { items: latestBikes } = await getBikes({
    pageSize: 12, sortBy: 'year', sortDescending: true,
  });

  return (
    <CatalogPageShell>
          <h1 className="text-2xl font-bold mb-4">Latest Bikes</h1>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {latestBikes.map((bike) => (
              <Link
                key={bike.id}
                href={`/bikes/${bike.slug}`}
                className=" border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow"
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
