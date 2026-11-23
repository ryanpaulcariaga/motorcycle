import Link from 'next/link';
import AnalyticsFilterForm from '@/components/AnalyticsFilterForm';
import { buildBrowseHref, rangeFields } from '@/lib/catalogFilters';
import type { BrandDto, CategoryDto } from '@/lib/types';

interface CatalogFiltersProps {
  params: Record<string, string | undefined>;
  brands: BrandDto[];
  categories: CategoryDto[];
  ccAvailable: boolean;
}

export default function CatalogFilters({ params, brands, categories, ccAvailable }: CatalogFiltersProps) {
  const hasCcFilter = !!(params.ccMin || params.ccMax);
  const activeFilters = [
    params.brandId,
    params.categoryId,
    params.yearMin || params.yearMax,
    params.priceMin || params.priceMax,
    params.ccMin || params.ccMax,
  ].filter(Boolean).length;

  return (
    <div className="mb-4 border border-zinc-200 bg-zinc-50 p-4">
      <AnalyticsFilterForm key={JSON.stringify([params.search, params.brandId, params.categoryId, ...rangeFields.map(([key]) => params[key])])}>
        {(['sort'] as const).map((key) =>
          params[key] ? <input key={key} type="hidden" name={key} value={params[key]} /> : null
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-semibold">
            Keyword
            <input
              type="search"
              name="search"
              defaultValue={params.search ?? ''}
              placeholder="Search by model, variant, or brand"
              className="w-full min-w-0 border border-zinc-300 bg-white px-3 py-2 font-normal text-brand-black"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="bg-brand-button px-4 py-2 text-sm font-semibold text-white">
              Search bikes
            </button>
            {params.search && (
              <Link
                href={buildBrowseHref(params, { search: undefined, page: undefined })}
                className="py-2 text-sm font-semibold text-brand-button hover:underline"
              >
                Clear keyword
              </Link>
            )}
          </div>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold text-brand-button hover:underline">
            Advanced filters{activeFilters > 0 ? ` (${activeFilters} active)` : ''}
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Brand
              <select name="brandId" defaultValue={params.brandId ?? ''} className="w-full border border-zinc-300 bg-white px-2 py-2 font-normal text-brand-black">
                <option value="">All brands</option>
                {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Category
              <select name="categoryId" defaultValue={params.categoryId ?? ''} className="w-full border border-zinc-300 bg-white px-2 py-2 font-normal text-brand-black">
                <option value="">All categories</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            {rangeFields.map(([key, label, integer, min, max]) => (
              (ccAvailable || (key !== 'ccMin' && key !== 'ccMax') || hasCcFilter) && (
                <label key={key} className="flex flex-col gap-1 text-sm font-semibold">
                  {label}
                  <input
                    type="number"
                    name={key}
                    min={min}
                    max={max}
                    step={integer ? '1' : 'any'}
                    defaultValue={params[key] ?? ''}
                    className="w-full min-w-0 border border-zinc-300 bg-white px-2 py-2 font-normal text-brand-black"
                  />
                </label>
              )
            ))}
          </div>
          <p className="mt-3 text-xs text-brand-grey">Range filters exclude bikes with missing values.</p>
          {!ccAvailable && <p className="mt-2 text-xs text-brand-grey">The displacement filter is currently unavailable.</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="submit" className="bg-brand-button px-4 py-2 text-sm font-semibold text-white">
              Apply filters
            </button>
            <Link
              href={buildBrowseHref(params, {
                brandId: undefined, categoryId: undefined, yearMin: undefined, yearMax: undefined,
                priceMin: undefined, priceMax: undefined, ccMin: undefined, ccMax: undefined, page: undefined,
              })}
              className="py-2 text-sm font-semibold text-brand-button hover:underline"
            >
              Clear filters
            </Link>
          </div>
        </details>
      </AnalyticsFilterForm>
    </div>
  );
}
