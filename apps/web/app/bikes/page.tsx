import Link from 'next/link';
import CatalogPageShell from '@/components/CatalogPageShell';
import BikeCardContent from '@/components/BikeCardContent';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import AnalyticsFilterForm from '@/components/AnalyticsFilterForm';
import SearchResultLink from '@/components/SearchResultLink';
import { getBikes, getBrands, getCategories, getSpecGroups } from '@/lib/api';
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
  const rangeFields = [
    ['yearMin', 'Year from', true, 1, 2147483647],
    ['yearMax', 'Year to', true, 1, 2147483647],
    ['priceMin', 'Minimum price ($)', false, 0, 1000000000000],
    ['priceMax', 'Maximum price ($)', false, 0, 1000000000000],
    ['ccMin', 'Minimum displacement (cc)', false, 0, 1000000000000],
    ['ccMax', 'Maximum displacement (cc)', false, 0, 1000000000000],
  ] as const;
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
  const activeAdvancedFilters = [
    params.yearMin || params.yearMax,
    params.priceMin || params.priceMax,
    params.ccMin || params.ccMax,
  ].filter(Boolean).length;

  const [brands, categories, specGroups] = await Promise.all([
    getBrands(),
    getCategories(),
    getSpecGroups(),
  ]);
  const ccAvailable = specGroups.some((group) => group.definitions.some(
    (definition) => definition.code === 'cc' && definition.isFilterable && definition.filterType === 'range'
  ));
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
      sortBy: (params.sortBy as 'price' | 'year' | 'model_name') ?? undefined,
      sortDescending: params.sortDescending === 'true',
    });

  const buildFilterHref = (
    overrides: Record<string, string | number | undefined>
  ) => {
    const next = new URLSearchParams();
    const merged = { ...params, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) {
        next.set(key, String(value));
      }
    }
    return `/bikes?${next.toString()}`;
  };

  return (
    <CatalogPageShell browseParams={params}>
          {!filterError && <AnalyticsTracker kind="search" hasSearch={!!params.search?.trim()} zeroResults={totalCount === 0} />}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h1 className="min-w-0 break-words text-2xl font-bold">
              {params.search
                ? `Search results for "${params.search}"`
                : 'Browse Bikes'}
            </h1>
            {!filterError && <p className="shrink-0 text-sm text-brand-grey">{totalCount} bikes</p>}
          </div>

          <AnalyticsFilterForm
            key={JSON.stringify([params.brandId, params.categoryId, ...rangeFields.map(([key]) => params[key])])}
          >
            {(['search', 'sortBy', 'sortDescending'] as const).map((key) =>
              params[key] ? <input key={key} type="hidden" name={key} value={params[key]} /> : null
            )}
            <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm font-semibold">
              Brand
              <select name="brandId" defaultValue={params.brandId ?? ''} className="border border-zinc-300 bg-white px-2 py-2 font-normal">
                <option value="">All brands</option>
                {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>
            </label>
            <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm font-semibold">
              Category
              <select name="categoryId" defaultValue={params.categoryId ?? ''} className="border border-zinc-300 bg-white px-2 py-2 font-normal">
                <option value="">All categories</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <details className="w-full" open={activeAdvancedFilters > 0}>
              <summary className="cursor-pointer text-sm font-semibold text-brand-button hover:underline">
                Advanced filters{activeAdvancedFilters > 0 ? ` (${activeAdvancedFilters} active)` : ''}
              </summary>
              <div className="mt-3 flex flex-wrap gap-3">
                {rangeFields.map(([key, label, integer, min, max]) => (
                  (ccAvailable || (key !== 'ccMin' && key !== 'ccMax') || hasCcFilter) && (
                    <label key={key} className="flex min-w-40 flex-1 flex-col gap-1 text-sm font-semibold">
                      {label}
                      <input
                        type="number"
                        name={key}
                        min={min}
                        max={max}
                        step={integer ? '1' : 'any'}
                        defaultValue={params[key] ?? ''}
                        className="border border-zinc-300 bg-white px-2 py-2 font-normal"
                      />
                    </label>
                  )
                ))}
              </div>
              <p className="mt-3 text-xs text-brand-grey">Range filters exclude bikes with missing values.</p>
              {!ccAvailable && <p className="mt-2 text-xs text-brand-grey">The displacement filter is currently unavailable.</p>}
            </details>
            <button type="submit" className="bg-brand-button px-4 py-2 text-sm font-semibold text-white">
              Apply filters
            </button>
            <Link
              href={buildFilterHref({
                brandId: undefined, categoryId: undefined, yearMin: undefined, yearMax: undefined,
                priceMin: undefined, priceMax: undefined, ccMin: undefined, ccMax: undefined, page: undefined,
              })}
              className="px-2 py-2 text-sm font-semibold text-brand-button hover:underline"
            >
              Clear filters
            </Link>
          </AnalyticsFilterForm>

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
                  href={buildFilterHref({ page: String(p) })}
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
