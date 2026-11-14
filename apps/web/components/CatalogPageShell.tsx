import type { ReactNode } from 'react';
import PageShell from '@/components/PageShell';
import CatalogFilters from '@/components/CatalogFilters';
import Sidebar, { SidebarLink, SidebarSection } from '@/components/Sidebar';
import { getBikes, getBrands, getCategories, getPopularComparisons, getSpecGroups } from '@/lib/api';
import { buildBrowseHref, isDisplacementFilterAvailable } from '@/lib/catalogFilters';
import type { CategoryDto } from '@/lib/types';

interface CatalogPageShellProps {
  children: ReactNode;
  browseParams?: Record<string, string | undefined>;
  filterData?: { categories: CategoryDto[]; ccAvailable: boolean };
}

export default async function CatalogPageShell({
  children,
  browseParams,
  filterData,
}: CatalogPageShellProps) {
  const [{ items: latestBikes }, brands, popularComparisons, filters] = await Promise.all([
    getBikes({ pageSize: 12, sortBy: 'year', sortDescending: true }),
    getBrands(),
    getPopularComparisons(10),
    filterData ? Promise.resolve(filterData) : Promise.all([getCategories(), getSpecGroups()]).then(
      ([categories, specGroups]) => ({ categories, ccAvailable: isDisplacementFilterAvailable(specGroups) })
    ),
  ]);

  function brandHref(brandId?: number) {
    return buildBrowseHref(browseParams ?? {}, { brandId, page: undefined });
  }

  return (
    <PageShell bare>
      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <Sidebar>
          <SidebarSection title="Filters">
            <h3 className="mb-2 text-sm font-semibold">Brand</h3>
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
            <SidebarLink href={brandHref()} active={!!browseParams && !browseParams.brandId}>
              All Brands
            </SidebarLink>
            <CatalogFilters params={browseParams ?? {}} {...filters} />
          </SidebarSection>
          <SidebarSection title="Latest Bikes">
            <div className="flex flex-col">
              {latestBikes.slice(0, 5).map((bike) => (
                <SidebarLink key={bike.id} href={`/bikes/${bike.slug}`}>
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
