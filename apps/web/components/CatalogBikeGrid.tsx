'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import BikeCardContent from '@/components/BikeCardContent';
import SearchResultLink from '@/components/SearchResultLink';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import { getBikes } from '@/lib/api';
import { buildBikeDetailHref, buildBrowseHref } from '@/lib/catalogFilters';
import type { BikeListItemDto, BikesQuery } from '@/lib/types';

export default function CatalogBikeGrid({
  initialBikes,
  query,
  browseParams,
  isSearch = false,
  initialTotalPages = 0,
  showBrowseStatus = false,
  noResultsMessage = '',
  currentPage = 1,
}: {
  initialBikes: BikeListItemDto[];
  query: BikesQuery;
  browseParams?: Record<string, string | undefined>;
  isSearch?: boolean;
  initialTotalPages?: number;
  showBrowseStatus?: boolean;
  noResultsMessage?: string;
  currentPage?: number;
}) {
  const [bikes, setBikes] = useState(initialBikes);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalCount, setTotalCount] = useState(initialBikes.length);
  const serializedQuery = JSON.stringify(query);

  useEffect(() => {
    let active = true;
    const requestQuery = JSON.parse(serializedQuery) as BikesQuery;
    getBikes(requestQuery)
      .then((result) => {
        if (active) {
          setBikes(result.items);
          setTotalCount(result.totalCount);
          setTotalPages(result.totalPages);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [serializedQuery]);

  const cards = bikes.map((bike) => {
    const detailHref = buildBikeDetailHref(
      bike.slug,
      {
        ...(browseParams ?? {}),
        published: String(bike.isPublished),
      },
    );
    const href =
      bike.isTestData || bike.modelIsTestData
        ? `${detailHref}${detailHref.includes('?') ? '&' : '?'}preview=test`
        : detailHref;
    const content = (
      <BikeCardContent bike={bike}>
        {browseParams && <p className="text-xs text-brand-grey">{bike.categoryName}</p>}
        <p className="font-semibold">{bike.variantName}</p>
        <p className="text-sm text-brand-grey">
          {bike.year}
          {bike.msrpPrice !== null
            ? `${browseParams ? ' · ' : ' · MSRP '}$${bike.msrpPrice.toLocaleString()}`
            : ''}
        </p>
      </BikeCardContent>
    );

    if (browseParams) {
      return (
        <SearchResultLink
          key={bike.id}
          href={href}
          bikeId={bike.id}
          isSearch={isSearch}
        >
          {content}
        </SearchResultLink>
      );
    }

    return (
      <Link
        key={bike.id}
        href={href}
        className="overflow-hidden border border-zinc-200 transition-colors hover:border-brand-gold"
      >
        {content}
      </Link>
    );
  });

  return (
    <>
      {showBrowseStatus && (
        <>
          <AnalyticsTracker
            kind="search"
            hasSearch={isSearch}
            zeroResults={totalCount === 0}
          />
        </>
      )}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {cards}
      </div>
      {showBrowseStatus && bikes.length === 0 && (
        <p className="py-12 text-center text-brand-grey">{noResultsMessage}</p>
      )}
      {showBrowseStatus && totalPages > 1 && browseParams && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <Link
                key={page}
                href={buildBrowseHref(browseParams, { page: String(page) })}
                className={`px-3 py-1.5 text-sm transition-colors hover:bg-brand-button hover:text-white ${
                  page === currentPage
                    ? 'bg-brand-sidebar text-white'
                    : 'bg-zinc-100 text-brand-grey'
                }`}
              >
                {page}
              </Link>
            )
          )}
        </div>
      )}
    </>
  );
}
