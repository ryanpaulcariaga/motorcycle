'use client';

import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Button from '@/components/Button';
import { getBikes, getBrands, getCategories } from '@/lib/api';
import type {
  BikeListItemDto,
  BikesQuery,
  BrandDto,
  CategoryDto,
  CompareResultDto,
} from '@/lib/types';

interface CompareClientProps {
  selectedIds: string[];
  compareResult: CompareResultDto | null;
}

interface SelectedBike {
  id: string;
  label: string;
}

const SEARCH_DEBOUNCE_MS = 300;
const MAX_COLUMN_BIKES = 3;

function toSelected(
  compareResult: CompareResultDto | null,
  fallbackIds: string[]
): SelectedBike[] {
  if (compareResult && compareResult.bikes.length > 0) {
    return compareResult.bikes.map((bike) => ({
      id: String(bike.id),
      label: `${bike.brandName} - ${bike.variantName}`,
    }));
  }
  return fallbackIds.map((id) => ({ id, label: `Bike #${id}` }));
}

export default function CompareClient({
  selectedIds,
  compareResult,
}: CompareClientProps) {
  const router = useRouter();
  const selected = toSelected(compareResult, selectedIds);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BikeListItemDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const brandSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (showAdvanced) {
      brandSelectRef.current?.focus();
    }
  }, [showAdvanced]);
  const [brands, setBrands] = useState<BrandDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [filters, setFilters] = useState({
    brandId: '',
    categoryId: '',
    yearMin: '',
    yearMax: '',
    priceMin: '',
    priceMax: '',
  });

  const hasFilters =
    showAdvanced && Object.values(filters).some((value) => value !== '');
  const trimmedTerm = searchTerm.trim();
  const canSearch = trimmedTerm.length >= 2 || hasFilters;

  function setFilter(key: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setFilters({
      brandId: '',
      categoryId: '',
      yearMin: '',
      yearMax: '',
      priceMin: '',
      priceMax: '',
    });
  }

  useEffect(() => {
    if (!showAdvanced || brands.length > 0) {
      return;
    }
    getBrands().then(setBrands).catch(() => setBrands([]));
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, [showAdvanced, brands.length]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!canSearch) {
        setSearchResults([]);
        return;
      }
      const toNumber = (value: string) =>
        value === '' || Number.isNaN(Number(value)) ? undefined : Number(value);
      const query: BikesQuery = {
        pageSize: hasFilters ? 20 : 8,
        search: trimmedTerm.length >= 2 ? trimmedTerm : undefined,
        ...(hasFilters && {
          brandId: filters.brandId || undefined,
          categoryId: filters.categoryId || undefined,
          yearMin: toNumber(filters.yearMin),
          yearMax: toNumber(filters.yearMax),
          priceMin: toNumber(filters.priceMin),
          priceMax: toNumber(filters.priceMax),
        }),
      };
      setIsSearching(true);
      getBikes(query)
        .then((result) => setSearchResults(result.items))
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [trimmedTerm, filters, canSearch, hasFilters]);

  function updateUrl(next: SelectedBike[]) {
    const query =
      next.length > 0 ? `?ids=${next.map((bike) => bike.id).join(',')}` : '';
    router.push(`/compare${query}`);
  }

  function addBike(bike: BikeListItemDto) {
    const id = String(bike.id);
    if (selected.some((s) => s.id === id)) {
      return;
    }
    updateUrl([
      ...selected,
      {
        id,
        label: `${bike.brandName} - ${bike.variantName}`,
      },
    ]);
    setSearchTerm('');
    setSearchResults([]);
  }

  function removeBike(id: string) {
    updateUrl(selected.filter((s) => s.id !== id));
  }

  const columnSlots = Array.from(
    { length: MAX_COLUMN_BIKES },
    (_, i) => compareResult?.bikes[i] ?? null,
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Add bikes to compare</h2>

        {selected.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selected.map((bike) => (
              <span
                key={bike.id}
                className="flex max-w-full items-center gap-1.5 break-words bg-brand-button px-2.5 py-1.5 text-xs text-white"
              >
                {bike.label}
                <button
                  type="button"
                  onClick={() => removeBike(bike.id)}
                  aria-label={`Remove ${bike.label}`}
                  className="font-bold hover:text-brand-gold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="relative">
          <input
            ref={searchInputRef}
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search bikes by model or brand..."
            className="w-full border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-button"
          />
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSearchResults([]);
              if (showAdvanced) {
                searchInputRef.current?.focus();
              }
              setShowAdvanced((open) => !open);
            }}
            aria-expanded={showAdvanced}
            className="mt-2 text-xs font-semibold text-brand-button hover:underline"
          >
            {showAdvanced ? 'Hide advanced search' : 'Advanced search'}
          </button>
          {showAdvanced && (
            <div className="mt-2 grid grid-cols-1 gap-3 border border-zinc-200 p-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs">
                Brand
                <select
                  ref={brandSelectRef}
                  value={filters.brandId}
                  onChange={(e) => setFilter('brandId', e.target.value)}
                  className="border border-zinc-300 bg-white px-2 py-2 text-sm"
                >
                  <option value="">All brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Category
                <select
                  value={filters.categoryId}
                  onChange={(e) => setFilter('categoryId', e.target.value)}
                  className="border border-zinc-300 bg-white px-2 py-2 text-sm"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="hidden md:block" />
              {(
                [
                  ['yearMin', 'Year from'],
                  ['yearMax', 'Year to'],
                  ['priceMin', 'Min price'],
                  ['priceMax', 'Max price'],
                ] as const
              ).map(([key, label]) => (
                <Fragment key={key}>
                  <label className="flex flex-col gap-1 text-xs">
                    {label}
                    <input
                      type="number"
                      min={0}
                      value={filters[key]}
                      onChange={(e) => setFilter(key, e.target.value)}
                      className="border border-zinc-300 px-2 py-2 text-sm"
                    />
                  </label>
                  {key === 'yearMax' && <div className="hidden md:block" />}
                </Fragment>
              ))}
              <div className="col-span-full flex items-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasFilters}
                  className="px-3 py-2 text-xs font-semibold text-brand-button hover:underline disabled:opacity-50"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}
          {canSearch && (
            <div className="mt-1 w-full max-h-64 overflow-y-auto border border-zinc-200 bg-white shadow-md">
              {isSearching && (
                <p className="p-2 text-xs text-brand-grey">Searching...</p>
              )}
              {!isSearching && searchResults.length === 0 && (
                <p className="p-2 text-xs text-brand-grey">No bikes found.</p>
              )}
              {searchResults.map((bike) => (
                <button
                  key={bike.id}
                  type="button"
                  onClick={() => addBike(bike)}
                  disabled={selected.some((s) => s.id === String(bike.id))}
                  className="flex w-full items-center gap-2 p-2 text-left text-sm hover:bg-zinc-50 disabled:opacity-50"
                >
                  <span className="relative h-8 w-10 shrink-0 bg-zinc-100 overflow-hidden">
                    {bike.primaryImageUrl && (
                      <Image
                        src={bike.primaryImageVariants?.small ?? bike.primaryImageUrl}
                        alt={`${bike.brandName} - ${bike.variantName}`}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    )}
                  </span>
                  <span>
                    {bike.brandName} - {bike.variantName}{' '}
                    <span className="text-zinc-400">({bike.year})</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!compareResult || compareResult.bikes.length === 0 ? (
        <p className="text-brand-grey">
          Search and add two or more bikes above to compare specs.
        </p>
      ) : (
        <>
        {compareResult.bikes.length > 2 && (
          <div className="space-y-4 md:hidden">
            {compareResult.bikes.map((bike) => (
              <section key={bike.id} className="border border-zinc-200 p-3">
                <BikeHeader bike={bike} />
                {compareResult.specGroups.map((group) => (
                  <div key={group.code} className="mt-3">
                    <h3 className="pb-1 text-sm font-semibold text-brand-button">
                      {group.name}
                    </h3>
                    <dl className="text-sm">
                      {group.rows.map((row) => (
                        <div
                          key={row.code}
                          className="flex justify-between gap-4 border-b border-zinc-100 py-1"
                        >
                          <dt className="text-brand-grey">{row.label}</dt>
                          <dd className="min-w-0 text-right">
                            {formatValue(row.valuesByBikeId[bike.id], row.unit)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
        <div className={compareResult.bikes.length > 2 ? 'hidden md:block' : ''}>
        {compareResult.bikes.length <= MAX_COLUMN_BIKES ? (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-[30%] text-left p-2 border-b border-zinc-200 align-bottom md:w-1/4">
                    Spec
                  </th>
                  {columnSlots.map((bike, index) => (
                    <th
                      key={bike?.id ?? `empty-${index}`}
                      className={`p-2 md:w-1/4 border-b border-zinc-200 text-left align-top ${
                        bike ? '' : 'hidden md:table-cell'
                      }`}
                    >
                      {bike && <BikeHeader bike={bike} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareResult.specGroups.map((group) => (
                  <Fragment key={group.code}>
                    <tr>
                      <td
                        colSpan={compareResult.bikes.length + 1}
                        className="pt-4 pb-1 font-semibold text-brand-button md:hidden"
                      >
                        {group.name}
                      </td>
                      <td
                        colSpan={MAX_COLUMN_BIKES + 1}
                        className="hidden pt-4 pb-1 font-semibold text-brand-button md:table-cell"
                      >
                        {group.name}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.code} className="border-b border-zinc-100">
                        <td className="p-2 text-brand-grey">{row.label}</td>
                        {columnSlots.map((bike, index) => (
                          <td
                            key={bike?.id ?? `empty-${index}`}
                            className={`p-2 break-words ${bike ? '' : 'hidden md:table-cell'}`}
                          >
                            {bike
                              ? formatValue(row.valuesByBikeId[bike.id], row.unit)
                              : null}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-sm border-collapse">
              <thead>
                <tr>
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-10 bg-white w-56 min-w-56 p-2 border-b border-zinc-200 text-left align-bottom"
                  >
                    Bike
                  </th>
                  {compareResult.specGroups.map((group) => (
                    <th
                      key={group.code}
                      colSpan={group.rows.length}
                      className="p-2 border-b border-zinc-200 text-left text-brand-button"
                    >
                      {group.name}
                    </th>
                  ))}
                </tr>
                <tr>
                  {compareResult.specGroups.flatMap((group) =>
                    group.rows.map((row) => (
                      <th
                        key={`${group.code}-${row.code}`}
                        className="p-2 border-b border-zinc-200 text-left font-normal text-brand-grey min-w-40 align-bottom"
                      >
                        {row.label}
                      </th>
                    )),
                  )}
                </tr>
              </thead>
              <tbody>
                {compareResult.bikes.map((bike) => (
                  <tr key={bike.id} className="border-b border-zinc-100">
                    <th className="sticky left-0 z-10 bg-white w-56 min-w-56 p-2 text-left align-top">
                      <BikeHeader bike={bike} />
                    </th>
                    {compareResult.specGroups.flatMap((group) =>
                      group.rows.map((row) => (
                        <td
                          key={`${group.code}-${row.code}`}
                          className="p-2 align-top"
                        >
                          {formatValue(row.valuesByBikeId[bike.id], row.unit)}
                        </td>
                      )),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
        </>
      )}

      {selected.length > 0 && (
        <div className="mt-4">
          <Button variant="black" onClick={() => updateUrl([])}>
            Clear selection
          </Button>
        </div>
      )}
    </div>
  );
}

function formatValue(value: unknown, unit: string | null): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return unit ? `${value} ${unit}` : String(value);
}

function BikeHeader({ bike }: { bike: CompareResultDto['bikes'][number] }) {
  return (
    <>
      <div className="relative aspect-[4/3] mb-2 bg-zinc-100 overflow-hidden">
        {bike.primaryImageUrl && (
          <Image
            src={bike.primaryImageVariants?.medium ?? bike.primaryImageUrl}
            alt={`${bike.brandName} - ${bike.variantName}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        )}
      </div>
      {bike.brandName} - {bike.variantName}
    </>
  );
}
