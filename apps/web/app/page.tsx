import Link from 'next/link';
import Image from 'next/image';
import CatalogPageShell from '@/components/CatalogPageShell';
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
                <div className="relative aspect-[4/3] bg-zinc-100">
                  {bike.primaryImageUrl && (
                    <Image
                      src={bike.primaryImageVariants?.medium ?? bike.primaryImageUrl}
                      alt={bike.variantName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}
                </div>
                <div className="p-2">
                  <p className="font-semibold">
                    {bike.variantName}
                  </p>
                  <p className="text-sm text-brand-grey">
                    {bike.year}{' '}
                    {bike.msrpPrice !== null
                      ? `· MSRP $${bike.msrpPrice.toLocaleString()}`
                      : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
    </CatalogPageShell>
  );
}
