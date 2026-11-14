'use client';

import { useState } from 'react';
import {
  catalogSortFields,
  serializeCatalogSorts,
  type CatalogSortCriterion,
  type CatalogSortField,
} from '@/lib/catalogFilters';

interface CatalogSortControlsProps {
  params: Record<string, string | undefined>;
  initialSorts: CatalogSortCriterion[];
}

export default function CatalogSortControls({ params, initialSorts }: CatalogSortControlsProps) {
  const [sorts, setSorts] = useState(initialSorts);
  const unusedFields = catalogSortFields.filter(([field]) => !sorts.some((sort) => sort.field === field));
  const summary = sorts.slice(0, 2).map(({ field, descending }) => {
    const label = catalogSortFields.find(([key]) => key === field)?.[1] ?? field;
    return `${label} ${descending ? 'descending' : 'ascending'}`;
  }).join(', then ');
  const remainingCount = sorts.length - 2;

  function updateSort(index: number, update: Partial<CatalogSortCriterion>) {
    setSorts((current) => current.map((sort, sortIndex) =>
      sortIndex === index ? { ...sort, ...update } : sort
    ));
  }

  function changeField(index: number, field: CatalogSortField) {
    updateSort(index, { field });
  }

  function moveSort(index: number, offset: number) {
    setSorts((current) => {
      const reordered = [...current];
      const [criterion] = reordered.splice(index, 1);
      reordered.splice(index + offset, 0, criterion);
      return reordered;
    });
  }

  return (
    <details className="mb-4 border border-zinc-200 bg-zinc-50 p-4 text-sm">
      <summary className="cursor-pointer font-semibold text-brand-button hover:underline">
        Sort: {summary}{remainingCount > 0 ? `, then ${remainingCount} more` : ''}
      </summary>
      <form action="/bikes" className="mt-3">
        {(['search', 'brandId', 'categoryId', 'yearMin', 'yearMax', 'priceMin', 'priceMax', 'ccMin', 'ccMax'] as const).map((key) =>
          params[key] ? <input key={key} type="hidden" name={key} value={params[key]} /> : null
        )}
        <input type="hidden" name="sort" value={serializeCatalogSorts(sorts)} />
        <div className="flex flex-col gap-2">
          {sorts.map((sort, index) => (
            <div key={sort.field} className="flex flex-wrap items-center gap-2">
              <span className="w-6 font-semibold text-brand-grey">{index + 1}.</span>
              <label className="sr-only" htmlFor={`sort-field-${index}`}>Sort field {index + 1}</label>
              <select
                id={`sort-field-${index}`}
                value={sort.field}
                onChange={(event) => changeField(index, event.target.value as CatalogSortField)}
                className="min-w-0 border border-zinc-300 bg-white px-2 py-1.5"
              >
                {catalogSortFields.map(([field, label]) => (
                  <option
                    key={field}
                    value={field}
                    disabled={sort.field !== field && sorts.some((selected) => selected.field === field)}
                  >
                    {label}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor={`sort-direction-${index}`}>Sort direction {index + 1}</label>
              <select
                id={`sort-direction-${index}`}
                value={sort.descending ? 'desc' : 'asc'}
                onChange={(event) => updateSort(index, { descending: event.target.value === 'desc' })}
                className="border border-zinc-300 bg-white px-2 py-1.5"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              {index > 0 && (
                <button type="button" onClick={() => moveSort(index, -1)} className="px-1 font-semibold text-brand-button" aria-label={`Move sort ${index + 1} up`}>
                  Move up
                </button>
              )}
              {index < sorts.length - 1 && (
                <button type="button" onClick={() => moveSort(index, 1)} className="px-1 font-semibold text-brand-button" aria-label={`Move sort ${index + 1} down`}>
                  Move down
                </button>
              )}
              {sorts.length > 1 && (
                <button type="button" onClick={() => setSorts((current) => current.filter((_, sortIndex) => sortIndex !== index))} className="px-1 font-semibold text-brand-button" aria-label={`Remove sort ${index + 1}`}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {unusedFields.length > 0 && (
            <button
              type="button"
              onClick={() => setSorts((current) => [...current, { field: unusedFields[0][0], descending: false }])}
              className="font-semibold text-brand-button hover:underline"
            >
              + Add sort level
            </button>
          )}
          <button type="submit" className="bg-brand-button px-3 py-1.5 font-semibold text-white">
            Apply sort
          </button>
        </div>
      </form>
    </details>
  );
}
