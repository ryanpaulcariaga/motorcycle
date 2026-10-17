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
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-brand-button text-white"
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
            className="w-full border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-button"
          />
          {searchTerm.trim().length >= 2 && (
            <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto border border-zinc-200 bg-white shadow-md">
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
                        src={bike.primaryImageUrl}
                        alt={`${bike.brandName} - ${bike.variantName}`}
                        fill
                        className="object-cover"
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
        compareResult.bikes.length <= MAX_COLUMN_BIKES ? (
          <table className="w-full table-fixed text-sm border-collapse">
            <thead>
              <tr>
                <th className="w-1/4 text-left p-2 border-b border-zinc-200 align-bottom">
                  Spec
                </th>
                {columnSlots.map((bike, index) => (
                  <th
                    key={bike?.id ?? `empty-${index}`}
                    className="w-1/4 p-2 border-b border-zinc-200 text-left align-top"
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
                      colSpan={MAX_COLUMN_BIKES + 1}
                      className="pt-4 pb-1 font-semibold text-brand-button"
                    >
                      {group.name}
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.code} className="border-b border-zinc-100">
                      <td className="p-2 text-brand-grey">{row.label}</td>
                      {columnSlots.map((bike, index) => (
                        <td key={bike?.id ?? `empty-${index}`} className="p-2">
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
        )
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
            src={bike.primaryImageUrl}
            alt={`${bike.brandName} - ${bike.variantName}`}
            fill
            className="object-cover"
          />
        )}
      </div>
      {bike.brandName} - {bike.variantName}
    </>
  );
}
