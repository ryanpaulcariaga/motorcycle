import Link from 'next/link';
import CatalogPageShell from '@/components/CatalogPageShell';
import BikeCardContent from '@/components/BikeCardContent';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import SearchResultLink from '@/components/SearchResultLink';
import { getBikes, getCategories, getSpecGroups } from '@/lib/api';
import { buildBrowseHref, isDisplacementFilterAvailable, rangeFields } from '@/lib/catalogFilters';
import type { Metadata } from 'next';

interface BikesPageProps {
  searchParams: Promise<{
    search?: string;
    brandId?: string;
    categoryId?: string;
    yearMin?: string;
    yearMax?: string;
    priceMin?: string;
    priceMax?: string;
    ccMin?: string;
    ccMax?: string;
    sortBy?: string;
    sortDescending?: string;
    page?: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Browse Bikes',
  description: 'Browse and compare motorcycle models, variants, and specifications.',
  alternates: { canonical: '/bikes' },
  openGraph: {
    title: 'Browse Bikes | MotoCompare',
    description: 'Browse and compare motorcycle models, variants, and specifications.',
    url: '/bikes',
    type: 'website',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Bikes | MotoCompare',
    description: 'Browse and compare motorcycle models, variants, and specifications.',
    images: ['/opengraph-image'],
  },
};

export const dynamic = 'force-dynamic';

export default async function BikesPage({ searchParams }: BikesPageProps) {
  const params = await searchParams;
  const page = params.page ? Number(params.page) : 1;
  const invalidFields = rangeFields.filter(([key, , integer, min, max]) => {
    const value = params[key];
    if (!value) {
      return false;
    }
    return !/^\d+(\.\d{1,6})?$/.test(value) || Number(value) < min ||
      Number(value) > max || (integer && !Number.isInteger(Number(value)));
  });
  const invalidRange = ([
    ['yearMin', 'yearMax', 'Year'],
    ['priceMin', 'priceMax', 'Price'],
    ['ccMin', 'ccMax', 'Displacement'],
  ] as const).find(([min, max]) =>
    params[min] && params[max] && Number(params[min]) > Number(params[max])
  );
  const hasCcFilter = !!(params.ccMin || params.ccMax);
  const sortBy = params.sortBy === 'price' || params.sortBy === 'year' || params.sortBy === 'model_name'
    ? params.sortBy
    : undefined;
  const [categories, specGroups] = await Promise.all([
    getCategories(),
    getSpecGroups(),
  ]);
  const ccAvailable = isDisplacementFilterAvailable(specGroups);
  const filterError = invalidFields.length > 0
    ? `Check ${invalidFields.map(([, label]) => label).join(', ')}: use a non-negative number with up to 6 decimal places, within the field limits. Year must be a whole number of at least 1.`
    : invalidRange
      ? `${invalidRange[2]} minimum cannot exceed its maximum.`
      : hasCcFilter && !ccAvailable
        ? 'The displacement filter is currently unavailable. Clear it to browse bikes.'
        : '';
  const { items: bikes, totalPages, totalCount } = filterError
    ? { items: [], totalPages: 0, totalCount: 0 }
    : await getBikes({
      page,
      pageSize: 12,
      search: params.search,
      brandId: params.brandId,
      categoryId: params.categoryId,
      yearMin: params.yearMin ? Number(params.yearMin) : params.yearMax ? 1 : undefined,
      yearMax: params.yearMax ? Number(params.yearMax) : undefined,
      priceMin: params.priceMin ? Number(params.priceMin) : undefined,
      priceMax: params.priceMax ? Number(params.priceMax) : undefined,
      specCode: hasCcFilter ? 'cc' : undefined,
      specMin: params.ccMin ? String(Number(params.ccMin)) : undefined,
      specMax: params.ccMax ? String(Number(params.ccMax)) : undefined,
      sortBy,
      sortDescending: params.sortDescending === 'true',
    });

  return (
    <CatalogPageShell browseParams={params} filterData={{ categories, ccAvailable }}>
          {!filterError && <AnalyticsTracker kind="search" hasSearch={!!params.search?.trim()} zeroResults={totalCount === 0} />}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h1 className="min-w-0 break-words text-2xl font-bold">
              {params.search
                ? `Search results for "${params.search}"`
                : 'Browse Bikes'}
            </h1>
            {!filterError && <p className="shrink-0 text-sm text-brand-grey">{totalCount} bikes</p>}
          </div>
          <form action="/bikes" className="mb-4 flex flex-wrap items-end gap-3">
            {(['search', 'brandId', 'categoryId', ...rangeFields.map(([key]) => key)] as const).map((key) =>
              params[key] ? <input key={key} type="hidden" name={key} value={params[key]} /> : null
            )}
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Sort by
              <select name="sortBy" defaultValue={sortBy ?? 'model_name'} className="border border-zinc-300 bg-white px-2 py-2 font-normal">
                <option value="model_name">Model name</option>
                <option value="year">Year</option>
                <option value="price">Price</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Order
              <select name="sortDescending" defaultValue={params.sortDescending === 'true' ? 'true' : 'false'} className="border border-zinc-300 bg-white px-2 py-2 font-normal">
                <option value="false">Ascending</option>
                <option value="true">Descending</option>
              </select>
            </label>
            <button type="submit" className="bg-brand-button px-4 py-2 text-sm font-semibold text-white">
              Apply sort
            </button>
          </form>
          {filterError && <p role="alert" className="mb-4 text-sm text-red-700">{filterError}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bikes.map((bike) => (
              <SearchResultLink
                key={bike.id}
                href={`/bikes/${bike.slug}`}
                bikeId={bike.id}
                isSearch={!!params.search?.trim()}
              >
                <BikeCardContent bike={bike}>
                  <p className="text-xs text-brand-grey">{bike.categoryName}</p>
                  <p className="font-semibold">
                    {bike.variantName}
                  </p>
                  <p className="text-sm text-brand-grey">
                    {bike.year}{' '}
                    {bike.msrpPrice
                      ? `· $${bike.msrpPrice.toLocaleString()}`
                      : ''}
                  </p>
                </BikeCardContent>
              </SearchResultLink>
            ))}
          </div>

          {!filterError && bikes.length === 0 && (
            <p className="text-center text-brand-grey py-12">
              {params.search
                ? `No bikes found for "${params.search}".`
                : 'No bikes match the selected filters.'}
            </p>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildBrowseHref(params, { page: String(p) })}
                  className={`px-3 py-1.5 text-sm ${
                    p === page
                      ? 'bg-brand-button text-white'
                      : 'bg-zinc-100 text-brand-grey'
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
    </CatalogPageShell>
  );
}
