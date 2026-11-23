import Link from 'next/link';
import CatalogPageShell from '@/components/CatalogPageShell';
import BikeCardContent from '@/components/BikeCardContent';
import {
  getBikes,
  getPopularComparisons,
  getTopBikesByDailyInterest,
  getTopBikesByFans,
} from '@/lib/api';
import type { Metadata } from 'next';
import type { BikeListItemDto } from '@/lib/types';
import { buildBikeDetailHref, HOME_DISCOVERY_LIMIT } from '@/lib/catalogFilters';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export const dynamic = 'force-dynamic';

function BikeDiscoveryGrid({
  items,
}: {
  items: Array<{ bike: BikeListItemDto; detail: string }>;
}) {
  return (
    <ol className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
      {items.map(({ bike, detail }, index) => (
        <li key={bike.id}>
          <Link
            href={buildBikeDetailHref(bike.slug, {})}
            className="block h-full border border-zinc-200 transition-colors hover:border-brand-gold"
          >
            <BikeCardContent bike={bike}>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">
                #{index + 1}
              </p>
              <p className="font-semibold">{bike.variantName}</p>
              <p className="text-sm text-brand-grey">{bike.year}</p>
              <p className="text-xs text-brand-grey">{detail}</p>
            </BikeCardContent>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default async function Home() {
  const [
    { items: latestBikes },
    topByDailyInterest,
    topByFans,
    popularComparisons,
  ] = await Promise.all([
    getBikes({ pageSize: HOME_DISCOVERY_LIMIT, sortBy: 'year', sortDescending: true }),
    getTopBikesByDailyInterest(HOME_DISCOVERY_LIMIT),
    getTopBikesByFans(HOME_DISCOVERY_LIMIT),
    getPopularComparisons(HOME_DISCOVERY_LIMIT),
  ]);

  return (
    <CatalogPageShell
      separatedContent
      catalogOverview={{
        latestBikes,
        topByDailyInterest,
        topByFans,
        popularComparisons,
      }}
    >
      <div className="space-y-4 md:space-y-6">
        <section className="bg-brand-content p-4 shadow-lg" aria-labelledby="latest-bikes-heading">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h1 id="latest-bikes-heading" className="text-2xl font-bold">Top 10 Latest Bikes</h1>
            <Link
              href="/bikes"
              className="font-semibold text-brand-button hover:underline"
            >
              View all bikes
            </Link>
          </div>
          <BikeDiscoveryGrid
            items={latestBikes.map((bike) => ({
              bike,
              detail: bike.msrpPrice === null
                ? 'MSRP unavailable'
                : `MSRP $${bike.msrpPrice.toLocaleString()}`,
            }))}
          />
        </section>

        <section className="bg-brand-content p-4 shadow-lg" aria-labelledby="daily-interest-heading">
          <h2 id="daily-interest-heading" className="mb-4 text-2xl font-bold">
            Most Viewed
          </h2>
          {topByDailyInterest.length === 0 ? (
            <p className="border border-zinc-200 p-6 text-sm text-brand-grey">
              No opted-in views today. View a bike to start the list.
            </p>
          ) : (
            <BikeDiscoveryGrid
              items={topByDailyInterest.map(({ bike, viewCount }) => ({
                bike,
                detail: `${viewCount} ${viewCount === 1 ? 'view' : 'views'} today`,
              }))}
            />
          )}
        </section>

        <section className="bg-brand-content p-4 shadow-lg" aria-labelledby="top-fans-heading">
          <h2 id="top-fans-heading" className="mb-4 text-2xl font-bold">Most Popular</h2>
          {topByFans.length === 0 ? (
            <p className="border border-zinc-200 p-6 text-sm text-brand-grey">
              No ratings yet. Review a bike to join its fans.
            </p>
          ) : (
            <BikeDiscoveryGrid
              items={topByFans.map(({ bike, fanCount, averageRating }) => ({
                bike,
                detail: `${fanCount} ${fanCount === 1 ? 'fan' : 'fans'} · ★ ${averageRating.toFixed(1)}`,
              }))}
            />
          )}
        </section>

        <section className="bg-brand-content p-4 shadow-lg" aria-labelledby="popular-comparisons-heading">
          <h2 id="popular-comparisons-heading" className="mb-4 text-2xl font-bold">
            Popular Comparisons
          </h2>
          {popularComparisons.length === 0 ? (
            <p className="border border-zinc-200 p-6 text-sm text-brand-grey">
              No comparisons yet. Compare some bikes to see them here.
            </p>
          ) : (
            <ol className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {popularComparisons.map(({ bikeA, bikeB, compareCount }, index) => (
                <li key={`${bikeA.id}-${bikeB.id}`}>
                  <Link
                    href={`/compare?ids=${bikeA.id},${bikeB.id}`}
                    className="block h-full border border-zinc-200 p-4 transition-colors hover:border-brand-gold"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">
                      #{index + 1}
                    </p>
                    <p className="mt-1 font-semibold">{bikeA.variantName}</p>
                    <p className="my-1 text-sm font-semibold text-brand-grey">vs</p>
                    <p className="font-semibold">{bikeB.variantName}</p>
                    <p className="mt-2 text-sm text-brand-grey">
                      Compared {compareCount} {compareCount === 1 ? 'time' : 'times'}
                    </p>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </CatalogPageShell>
  );
}
