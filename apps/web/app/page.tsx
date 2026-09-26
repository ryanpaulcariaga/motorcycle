import Link from 'next/link';
import Image from 'next/image';
import PageShell from '@/components/PageShell';
import Sidebar, { SidebarLink, SidebarSection } from '@/components/Sidebar';
import { getBikes, getBrands } from '@/lib/api';

export const dynamic = 'force-dynamic';

function ComingSoonPanel({ hint }: { hint: string }) {
  return <p className="text-xs text-white/50 italic">{hint}</p>;
}

export default async function Home() {
  const [{ items: latestBikes }, brands] = await Promise.all([
    getBikes({ pageSize: 12, sortBy: 'year', sortDescending: true }),
    getBrands(),
  ]);

  return (
    <PageShell>
      <div className="flex flex-col md:flex-row gap-6">
        <Sidebar>
          <SidebarSection title="Brands">
            <div className="flex flex-col">
              <SidebarLink href="/bikes">All Brands</SidebarLink>
              {brands.map((brand) => (
                <SidebarLink key={brand.id} href={`/bikes?brandId=${brand.id}`}>
                  {brand.name}
                </SidebarLink>
              ))}
            </div>
          </SidebarSection>

          <SidebarSection title="Latest Devices">
            <div className="flex flex-col gap-1">
              {latestBikes.slice(0, 5).map((bike) => (
                <SidebarLink key={bike.id} href={`/bikes/${bike.slug}`}>
                  {bike.brandName} {bike.modelName}
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
            <ComingSoonPanel hint="Coming soon — tracked once comparison analytics ship." />
          </SidebarSection>
        </Sidebar>

        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-4">Latest Bikes</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestBikes.map((bike) => (
              <Link
                key={bike.id}
                href={`/bikes/${bike.slug}`}
                className="rounded-md border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[4/3] bg-zinc-100">
                  {bike.primaryImageUrl && (
                    <Image
                      src={bike.primaryImageUrl}
                      alt={bike.modelName}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-zinc-500">{bike.brandName}</p>
                  <p className="font-semibold">
                    {bike.modelName} {bike.variantName}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {bike.year}{' '}
                    {bike.msrpPrice
                      ? `· $${bike.msrpPrice.toLocaleString()}`
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
