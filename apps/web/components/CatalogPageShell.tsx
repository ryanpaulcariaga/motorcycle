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
import {
  buildBikeDetailHref,
  buildBrowseHref,
  HOME_DISCOVERY_LIMIT,
} from '@/lib/catalogFilters';
import type {
  BikeListItemDto,
  BrandDto,
  DailyInterestRankedBikeDto,
  FanRankedBikeDto,
  PopularComparisonDto,
} from '@/lib/types';

export interface CatalogOverview {
  latestBikes: BikeListItemDto[];
  topByDailyInterest: DailyInterestRankedBikeDto[];
  topByFans: FanRankedBikeDto[];
  popularComparisons: PopularComparisonDto[];
}

interface CatalogPageShellProps {
  children: ReactNode;
  browseParams?: Record<string, string | undefined>;
  catalogBrands?: BrandDto[];
  catalogOverview?: CatalogOverview;
  separatedContent?: boolean;
}

export default async function CatalogPageShell({
  children,
  browseParams,
  catalogBrands,
  catalogOverview,
  separatedContent = false,
}: CatalogPageShellProps) {
  const overviewPromise = catalogOverview
    ? Promise.resolve(catalogOverview)
    : Promise.all([
      getBikes({ pageSize: HOME_DISCOVERY_LIMIT, sortBy: 'year', sortDescending: true }),
      getTopBikesByDailyInterest(HOME_DISCOVERY_LIMIT),
      getTopBikesByFans(HOME_DISCOVERY_LIMIT),
      getPopularComparisons(HOME_DISCOVERY_LIMIT),
    ]).then(([latest, topByDailyInterest, topByFans, popularComparisons]) => ({
      latestBikes: latest.items,
      topByDailyInterest,
      topByFans,
      popularComparisons,
    }));
  const [brands, {
    latestBikes,
    topByDailyInterest,
    topByFans,
    popularComparisons,
  }] = await Promise.all([
    catalogBrands ? Promise.resolve(catalogBrands) : getBrands(),
    overviewPromise,
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
              {latestBikes.slice(0, HOME_DISCOVERY_LIMIT).map((bike) => (
                <SidebarLink key={bike.id} href={buildBikeDetailHref(bike.slug, browseParams ?? {})}>
                  {bike.variantName}
                </SidebarLink>
              ))}
            </div>
          </SidebarSection>
          <SidebarSection title="Most Viewed">
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
          <SidebarSection title="Most Popular">
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
                    <span className="block">{bikeA.variantName}</span>
                    <span className="block text-white/60">vs</span>
                    <span className="block">{bikeB.variantName}</span>
                  </SidebarLink>
                ))}
              </div>
            )}
          </SidebarSection>
        </Sidebar>
        <div
          id="catalog-content"
          className={`min-h-screen min-w-0 flex-1 md:min-h-0 ${
            separatedContent ? '' : 'bg-brand-content p-4 shadow-lg sm:p-6'
          }`}
        >
          {children}
        </div>
      </div>
    </PageShell>
  );
}
