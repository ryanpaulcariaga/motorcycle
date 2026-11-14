import type { ReactNode } from 'react';
import PageShell from '@/components/PageShell';
import Sidebar, { SidebarLink, SidebarSection } from '@/components/Sidebar';
import { getBikes, getBrands, getPopularComparisons } from '@/lib/api';
import { buildBikeDetailHref, buildBrowseHref } from '@/lib/catalogFilters';
import type { BrandDto } from '@/lib/types';

interface CatalogPageShellProps {
  children: ReactNode;
  browseParams?: Record<string, string | undefined>;
  catalogBrands?: BrandDto[];
}

export default async function CatalogPageShell({
  children,
  browseParams,
  catalogBrands,
}: CatalogPageShellProps) {
  const [{ items: latestBikes }, brands, popularComparisons] = await Promise.all([
    getBikes({ pageSize: 12, sortBy: 'year', sortDescending: true }),
    catalogBrands ? Promise.resolve(catalogBrands) : getBrands(),
    getPopularComparisons(10),
  ]);

  function brandHref(brandId?: number) {
    return buildBrowseHref(browseParams ?? {}, { brandId, page: undefined });
  }

  return (
    <PageShell bare>
      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <Sidebar>
          <SidebarSection title="Brands">
            <div className="flex flex-col">
              {brands.map((brand) => (
                <SidebarLink
                  key={brand.id}
                  href={brandHref(brand.id)}
                  active={browseParams?.brandId === String(brand.id)}
                  analyticsBrandId={brand.id}
                >
                  {brand.name}
                </SidebarLink>
              ))}
            </div>
            <SidebarLink href={brandHref()} active={!browseParams?.brandId}>
              All Brands
            </SidebarLink>
          </SidebarSection>
          <SidebarSection title="Latest Bikes">
            <div className="flex flex-col">
              {latestBikes.slice(0, 5).map((bike) => (
                <SidebarLink key={bike.id} href={buildBikeDetailHref(bike.slug, browseParams ?? {})}>
                  {bike.variantName}
                </SidebarLink>
              ))}
            </div>
          </SidebarSection>
          <SidebarSection title="Top 10 by Daily Interest">
            <p className="text-xs text-white/50 italic">Coming soon — tracked once bike view analytics ship.</p>
          </SidebarSection>
          <SidebarSection title="Top 10 by Fans">
            <p className="text-xs text-white/50 italic">Coming soon — tracked once bike voting ships.</p>
          </SidebarSection>
          <SidebarSection title="Popular Comparisons">
            {popularComparisons.length === 0 ? (
              <p className="text-xs text-white/50 italic">No comparisons yet — compare some bikes to see them here.</p>
            ) : (
              <div className="flex flex-col">
                {popularComparisons.map(({ bikeA, bikeB }) => (
                  <SidebarLink key={`${bikeA.id}-${bikeB.id}`} href={`/compare?ids=${bikeA.id},${bikeB.id}`}>
                    {bikeA.variantName} vs {bikeB.variantName}
                  </SidebarLink>
                ))}
              </div>
            )}
          </SidebarSection>
        </Sidebar>
        <div id="catalog-content" className="min-h-screen min-w-0 flex-1 bg-brand-content p-4 shadow-lg sm:p-6 md:min-h-0">
          {children}
        </div>
      </div>
    </PageShell>
  );
}
