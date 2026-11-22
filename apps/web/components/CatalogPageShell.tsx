import type { ReactNode } from 'react';
import PageShell from '@/components/PageShell';
import Sidebar, { SidebarLink, SidebarSection } from '@/components/Sidebar';
import {
  getBikes,
  getBrands,
  getPopularComparisons,
  getTopBikesByDailyInterest,
  getTopBikesByFans,
} from '@/lib/api';
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
  const [{ items: latestBikes }, brands, topByDailyInterest, topByFans, popularComparisons] = await Promise.all([
    getBikes({ pageSize: 12, sortBy: 'year', sortDescending: true }),
    catalogBrands ? Promise.resolve(catalogBrands) : getBrands(),
    getTopBikesByDailyInterest(10),
    getTopBikesByFans(10),
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
            {topByDailyInterest.length === 0 ? (
              <p className="text-xs text-white/50 italic">No opted-in views today — view a bike to start the list.</p>
            ) : (
              <ol className="flex flex-col">
                {topByDailyInterest.map(({ bike, viewCount }, index) => (
                  <li key={bike.id}>
                    <SidebarLink href={buildBikeDetailHref(bike.slug, browseParams ?? {})}>
                      <span className="flex items-start gap-2">
                        <span className="w-4 shrink-0 text-white/50">{index + 1}.</span>
                        <span className="min-w-0 flex-1">
                          <span className="block">{bike.variantName}</span>
                          <span className="block text-xs text-white/60">
                            {viewCount} {viewCount === 1 ? 'view' : 'views'} today
                          </span>
                        </span>
                      </span>
                    </SidebarLink>
                  </li>
                ))}
              </ol>
            )}
          </SidebarSection>
          <SidebarSection title="Top 10 by Fans">
            {topByFans.length === 0 ? (
              <p className="text-xs text-white/50 italic">No ratings yet — review a bike to join its fans.</p>
            ) : (
              <ol className="flex flex-col">
                {topByFans.map(({ bike, fanCount, averageRating }, index) => (
                  <li key={bike.id}>
                    <SidebarLink href={buildBikeDetailHref(bike.slug, browseParams ?? {})}>
                      <span className="flex items-start gap-2">
                        <span className="w-4 shrink-0 text-white/50">{index + 1}.</span>
                        <span className="min-w-0 flex-1">
                          <span className="block">{bike.variantName}</span>
                          <span className="block text-xs text-white/60">
                            {fanCount} {fanCount === 1 ? 'fan' : 'fans'} · ★ {averageRating.toFixed(1)}
                          </span>
                        </span>
                      </span>
                    </SidebarLink>
                  </li>
                ))}
              </ol>
            )}
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
