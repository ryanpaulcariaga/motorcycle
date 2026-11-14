import Link from 'next/link';
import AnalyticsFilterForm from '@/components/AnalyticsFilterForm';
import { buildBrowseHref, rangeFields } from '@/lib/catalogFilters';
import type { CategoryDto } from '@/lib/types';

interface CatalogFiltersProps {
  params: Record<string, string | undefined>;
  categories: CategoryDto[];
  ccAvailable: boolean;
}

export default function CatalogFilters({ params, categories, ccAvailable }: CatalogFiltersProps) {
  const hasCcFilter = !!(params.ccMin || params.ccMax);
  const activeAdvancedFilters = [
    params.categoryId,
    params.yearMin || params.yearMax,
    params.priceMin || params.priceMax,
    params.ccMin || params.ccMax,
  ].filter(Boolean).length;

  return (
    <AnalyticsFilterForm key={JSON.stringify([params.brandId, params.categoryId, ...rangeFields.map(([key]) => params[key])])}>
      {(['search', 'brandId', 'sortBy', 'sortDescending'] as const).map((key) =>
        params[key] ? <input key={key} type="hidden" name={key} value={params[key]} /> : null
      )}
      <details open={activeAdvancedFilters > 0}>
        <summary className="cursor-pointer text-sm font-semibold text-brand-gold hover:underline">
          Advanced filters{activeAdvancedFilters > 0 ? ` (${activeAdvancedFilters} active)` : ''}
        </summary>
        <div className="mt-3 flex flex-col gap-3">
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
        <p className="mt-3 text-xs text-white/80">Range filters exclude bikes with missing values.</p>
        {!ccAvailable && <p className="mt-2 text-xs text-white/80">The displacement filter is currently unavailable.</p>}
      </details>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="submit" className="bg-brand-button px-4 py-2 text-sm font-semibold text-white">
          Apply filters
        </button>
        <Link
          href={buildBrowseHref(params, {
            brandId: undefined, categoryId: undefined, yearMin: undefined, yearMax: undefined,
            priceMin: undefined, priceMax: undefined, ccMin: undefined, ccMax: undefined, page: undefined,
          })}
          className="py-2 text-sm font-semibold text-white hover:underline"
        >
          Clear filters
        </Link>
      </div>
    </AnalyticsFilterForm>
  );
}
