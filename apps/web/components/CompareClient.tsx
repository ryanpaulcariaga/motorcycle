'use client';

import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';
import Image from 'next/image';
import Button from '@/components/Button';
import { searchBikes } from '@/lib/api';
import type { BikeListItemDto, CompareResultDto } from '@/lib/types';

interface CompareClientProps {
  selectedIds: string[];
  compareResult: CompareResultDto | null;
}

interface SelectedBike {
  id: string;
  label: string;
}

const TABLE_LAYOUT_THRESHOLD = 4;
const SEARCH_DEBOUNCE_MS = 300;

function toSelected(
  compareResult: CompareResultDto | null,
  fallbackIds: string[]
): SelectedBike[] {
  if (compareResult && compareResult.bikes.length > 0) {
    return compareResult.bikes.map((bike) => ({
      id: String(bike.id),
      label: `${bike.brandName} ${bike.modelName} ${bike.variantName}`,
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

  useEffect(() => {
    const term = searchTerm.trim();
    const timeout = setTimeout(() => {
      if (term.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      searchBikes(term)
        .then((result) => setSearchResults(result.items))
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  function updateUrl(next: SelectedBike[]) {
    const query =
      next.length > 0 ? `?ids=${next.map((bike) => bike.id).join(',')}` : '';
    router.push(`/compare${query}`);
  }

  function addBike(bike: BikeListItemDto) {
    const id = String(bike.id);
    if (selected.some((s) => s.id === id)) return;
    updateUrl([
      ...selected,
      { id, label: `${bike.brandName} ${bike.modelName} ${bike.variantName}` },
    ]);
    setSearchTerm('');
    setSearchResults([]);
  }

  function removeBike(id: string) {
    updateUrl(selected.filter((s) => s.id !== id));
  }

  const useTableLayout =
    (compareResult?.bikes.length ?? 0) > TABLE_LAYOUT_THRESHOLD;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Add bikes to compare</h2>

        {selected.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selected.map((bike) => (
              <span
                key={bike.id}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-brand-button text-white"
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
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search bikes by model or brand..."
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-button"
          />
          {searchTerm.trim().length >= 2 && (
            <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-md">
              {isSearching && (
                <p className="p-2 text-xs text-zinc-500">Searching...</p>
              )}
              {!isSearching && searchResults.length === 0 && (
                <p className="p-2 text-xs text-zinc-500">No bikes found.</p>
              )}
              {searchResults.map((bike) => (
                <button
                  key={bike.id}
                  type="button"
                  onClick={() => addBike(bike)}
                  disabled={selected.some((s) => s.id === String(bike.id))}
                  className="flex w-full items-center gap-2 p-2 text-left text-sm hover:bg-zinc-50 disabled:opacity-50"
                >
                  <span className="relative h-8 w-10 shrink-0 rounded bg-zinc-100 overflow-hidden">
                    {bike.primaryImageUrl && (
                      <Image
                        src={bike.primaryImageUrl}
                        alt={bike.modelName}
                        fill
                        className="object-cover"
                      />
                    )}
                  </span>
                  <span>
                    {bike.brandName} {bike.modelName} {bike.variantName}{' '}
                    <span className="text-zinc-400">({bike.year})</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!compareResult || compareResult.bikes.length === 0 ? (
        <p className="text-zinc-500">
          Search and add two or more bikes above to compare specs.
        </p>
      ) : useTableLayout ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white text-left p-2 border-b border-zinc-200">
                  Spec
                </th>
                {compareResult.bikes.map((bike) => (
                  <th
                    key={bike.id}
                    className="p-2 border-b border-zinc-200 text-left min-w-[140px]"
                  >
                    {bike.brandName} {bike.modelName} {bike.variantName}
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
                      className="pt-4 pb-1 font-semibold text-brand-button"
                    >
                      {group.name}
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.code} className="border-b border-zinc-100">
                      <td className="sticky left-0 bg-white p-2 text-zinc-500">
                        {row.label}
                      </td>
                      {compareResult.bikes.map((bike) => (
                        <td key={bike.id} className="p-2">
                          {formatValue(row.valuesByBikeId[bike.id], row.unit)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {compareResult.bikes.map((bike) => (
            <div
              key={bike.id}
              className="rounded-md border border-zinc-200 overflow-hidden"
            >
              <div className="relative aspect-[4/3] bg-zinc-100">
                {bike.primaryImageUrl && (
                  <Image
                    src={bike.primaryImageUrl}
                    alt={bike.modelName}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-zinc-500">{bike.brandName}</p>
                <p className="font-semibold mb-2">
                  {bike.modelName} {bike.variantName}
                </p>
                {compareResult.specGroups.map((group) => (
                  <div key={group.code} className="mb-2">
                    <p className="text-xs font-semibold text-brand-button">
                      {group.name}
                    </p>
                    {group.rows.map((row) => (
                      <div
                        key={row.code}
                        className="flex justify-between text-xs py-0.5"
                      >
                        <span className="text-zinc-500">{row.label}</span>
                        <span className="font-medium">
                          {formatValue(row.valuesByBikeId[bike.id], row.unit)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
  if (value === null || value === undefined) return '—';
  return unit ? `${value} ${unit}` : String(value);
}
