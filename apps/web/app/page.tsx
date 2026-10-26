import Link from 'next/link';
import Image from 'next/image';
import PageShell from '@/components/PageShell';
import Sidebar, { SidebarLink, SidebarSection } from '@/components/Sidebar';
import { getBikes, getBrands, getPopularComparisons } from '@/lib/api';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export const dynamic = 'force-dynamic';

function ComingSoonPanel({ hint }: { hint: string }) {
  return <p className="text-xs text-white/50 italic">{hint}</p>;
}

export default async function Home() {
  const [{ items: latestBikes }, brands, popularComparisons] = await Promise.all([
    getBikes({ pageSize: 12, sortBy: 'year', sortDescending: true }),
    getBrands(),
    getPopularComparisons(10),
  ]);

  return (
    <PageShell bare>
      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <Sidebar>
          <SidebarSection title="Brands">
            <div className="flex flex-col">
              {brands.map((brand) => (
                <SidebarLink key={brand.id} href={`/bikes?brandId=${brand.id}`}>
                  {brand.name}
                </SidebarLink>
              ))}
            </div>
            <SidebarLink href="/bikes">All Brands</SidebarLink>
          </SidebarSection>

          <SidebarSection title="Latest Devices">
            <div className="flex flex-col">
              {latestBikes.slice(0, 5).map((bike) => (
                <SidebarLink key={bike.id} href={`/bikes/${bike.slug}`}>
                  {bike.variantName}
                </SidebarLink>
              ))}
            </div>
          </SidebarSection>

          <SidebarSection title="Top 10 by Daily Interest">
            <ComingSoonPanel hint="Coming soon — tracked once bike view analytics ship." />
          </SidebarSection>

          <SidebarSection title="Top 10 by Fans">
            <ComingSoonPanel hint="Coming soon — tracked once bike voting ships." />
          </SidebarSection>

          <SidebarSection title="Popular Comparisons">
            {popularComparisons.length === 0 ? (
              <ComingSoonPanel hint="No comparisons yet — compare some bikes to see them here." />
            ) : (
              <div className="flex flex-col">
                {popularComparisons.map(({ bikeA, bikeB }) => (
                  <SidebarLink
                    key={`${bikeA.id}-${bikeB.id}`}
                    href={`/compare?ids=${bikeA.id},${bikeB.id}`}
                  >
                    {bikeA.variantName} vs {bikeB.variantName}
                  </SidebarLink>
                ))}
              </div>
            )}
          </SidebarSection>
        </Sidebar>

        <div className="min-w-0 flex-1 bg-brand-content p-4 shadow-lg sm:p-6">
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
                      alt={`${bike.brandName} - ${bike.variantName}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}
                </div>
                <div className="p-2">
                  <p className="font-semibold">
                    {bike.brandName} - {bike.variantName}
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
        </div>
      </div>
    </PageShell>
  );
}
