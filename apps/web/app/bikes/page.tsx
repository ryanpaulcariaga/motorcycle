import CatalogPageShell from '@/components/CatalogPageShell';
import CatalogFilters from '@/components/CatalogFilters';
import CatalogSortControls from '@/components/CatalogSortControls';
import CatalogBikeGrid from '@/components/CatalogBikeGrid';
import CatalogResultsCount from '@/components/CatalogResultsCount';
import { getBikes, getBrands, getCategories, getSpecGroups } from '@/lib/api';
import { CATALOG_PAGE_SIZE, getBrowseParams, getCatalogSorts, isDisplacementFilterAvailable, rangeFields, serializeCatalogSorts } from '@/lib/catalogFilters';
import type { Metadata } from 'next';

interface BikesPageProps {
  searchParams: Promise<{
    search?: string;
    includeDiscontinued?: string;
    brandId?: string;
    categoryId?: string;
    yearMin?: string;
    yearMax?: string;
    priceMin?: string;
    priceMax?: string;
    ccMin?: string;
    ccMax?: string;
    sort?: string;
    sortBy?: string;
    sortDescending?: string;
    thenSortBy?: string;
    thenSortDescending?: string;
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
  const sorts = getCatalogSorts(params.sort, params);
  const browseParams = getBrowseParams({ ...params, sort: serializeCatalogSorts(sorts) });
  const [brands, categories, specGroups] = await Promise.all([
    getBrands(),
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
      pageSize: CATALOG_PAGE_SIZE,
      search: params.search,
      includeDiscontinued: params.includeDiscontinued === 'true',
      brandId: params.brandId,
      categoryId: params.categoryId,
      yearMin: params.yearMin ? Number(params.yearMin) : params.yearMax ? 1 : undefined,
      yearMax: params.yearMax ? Number(params.yearMax) : undefined,
      priceMin: params.priceMin ? Number(params.priceMin) : undefined,
      priceMax: params.priceMax ? Number(params.priceMax) : undefined,
      specCode: hasCcFilter ? 'cc' : undefined,
      specMin: params.ccMin ? String(Number(params.ccMin)) : undefined,
      specMax: params.ccMax ? String(Number(params.ccMax)) : undefined,
      sort: browseParams.sort,
    });

  return (
    <CatalogPageShell browseParams={browseParams} catalogBrands={brands}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h1 className="min-w-0 break-words text-2xl font-bold">
              {params.search
                ? `Search results for "${params.search}"`
                : 'Browse Bikes'}
            </h1>
            {!filterError && (
              <CatalogResultsCount
                initialTotalCount={totalCount}
                query={{
                  page,
                  pageSize: CATALOG_PAGE_SIZE,
                  search: params.search,
                  includeDiscontinued: params.includeDiscontinued === 'true',
                  brandId: params.brandId,
                  categoryId: params.categoryId,
                  yearMin: params.yearMin
                    ? Number(params.yearMin)
                    : params.yearMax
                      ? 1
                      : undefined,
                  yearMax: params.yearMax ? Number(params.yearMax) : undefined,
                  priceMin: params.priceMin
                    ? Number(params.priceMin)
                    : undefined,
                  priceMax: params.priceMax
                    ? Number(params.priceMax)
                    : undefined,
                  specCode: hasCcFilter ? 'cc' : undefined,
                  specMin: params.ccMin
                    ? String(Number(params.ccMin))
                    : undefined,
                  specMax: params.ccMax
                    ? String(Number(params.ccMax))
                    : undefined,
                  sort: browseParams.sort,
                }}
              />
            )}
          </div>
          <CatalogFilters params={browseParams} brands={brands} categories={categories} ccAvailable={ccAvailable} />
          <CatalogSortControls key={browseParams.sort} params={browseParams} initialSorts={sorts} />
          {filterError && <p role="alert" className="mb-4 text-sm text-red-700">{filterError}</p>}
          <CatalogBikeGrid
              initialBikes={bikes}
              initialTotalPages={totalPages}
              showBrowseStatus={!filterError}
              noResultsMessage={
                params.search
                  ? `No bikes found for "${params.search}".`
                  : 'No bikes match the selected filters.'
              }
              currentPage={page}
              browseParams={browseParams}
              isSearch={!!params.search?.trim()}
              query={{
                page,
                pageSize: CATALOG_PAGE_SIZE,
                search: params.search,
                includeDiscontinued: params.includeDiscontinued === 'true',
                brandId: params.brandId,
                categoryId: params.categoryId,
                yearMin: params.yearMin
                  ? Number(params.yearMin)
                  : params.yearMax
                    ? 1
                    : undefined,
                yearMax: params.yearMax ? Number(params.yearMax) : undefined,
                priceMin: params.priceMin ? Number(params.priceMin) : undefined,
                priceMax: params.priceMax ? Number(params.priceMax) : undefined,
                specCode: hasCcFilter ? 'cc' : undefined,
                specMin: params.ccMin ? String(Number(params.ccMin)) : undefined,
                specMax: params.ccMax ? String(Number(params.ccMax)) : undefined,
                sort: browseParams.sort,
              }}
            />
    </CatalogPageShell>
  );
}
