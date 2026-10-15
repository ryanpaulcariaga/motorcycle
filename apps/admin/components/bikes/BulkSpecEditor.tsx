'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AdminApiError,
  getAdminBikeSpecValues,
  getBrands,
  getCategories,
  getSpecGroups,
  updateAdminBikeSpecValues,
} from '@/lib/api';
import type { BikeSpecValueItem, LookupOption } from '@/lib/types';

type SpecGroup = Awaited<ReturnType<typeof getSpecGroups>>[number];
type SpecDefinition = SpecGroup['definitions'][number];

const inputClass = 'mt-1 w-full border border-black/20 px-3 py-2';

function toText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

export default function BulkSpecEditor() {
  const [brands, setBrands] = useState<LookupOption[]>([]);
  const [categories, setCategories] = useState<LookupOption[]>([]);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [specCode, setSpecCode] = useState('');
  const [loadedSpecCode, setLoadedSpecCode] = useState('');
  const [rows, setRows] = useState<BikeSpecValueItem[]>([]);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getBrands(), getCategories(), getSpecGroups()])
      .then(([brandResult, categoryResult, groupResult]) => {
        setBrands(brandResult);
        setCategories(categoryResult);
        setSpecGroups(groupResult);
      })
      .catch(() => setError('Unable to load filter options.'));
  }, []);

  const definition: SpecDefinition | undefined = useMemo(
    () =>
      specGroups
        .flatMap((group) => group.definitions)
        .find((def) => def.code === loadedSpecCode),
    [specGroups, loadedSpecCode]
  );

  const dirtyIds = rows
    .filter(
      (row) =>
        edits[row.id] !== undefined && edits[row.id] !== toText(row.value)
    )
    .map((row) => row.id);

  async function load(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dirtyIds.length > 0 && !window.confirm('Discard unsaved changes?')) {
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const result = await getAdminBikeSpecValues({
        brandId: Number(brandId),
        categoryId: categoryId ? Number(categoryId) : undefined,
        minPrice: minPrice === '' ? undefined : Number(minPrice),
        maxPrice: maxPrice === '' ? undefined : Number(maxPrice),
        specCode,
      });
      setRows(result);
      setEdits({});
      setLoadedSpecCode(specCode);
      setLoaded(true);
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to load motorcycles.'
      );
    } finally {
      setLoading(false);
    }
  }

  function toValue(raw: string, def: SpecDefinition): unknown {
    const trimmed = raw.trim();
    if (trimmed === '') {
      return null;
    }
    if (def.dataType === 'number') {
      return Number(trimmed);
    }
    if (def.dataType === 'boolean') {
      return trimmed === 'true';
    }
    return trimmed;
  }

  async function save() {
    if (!definition || dirtyIds.length === 0) {
      return;
    }
    const values = dirtyIds.map((id) => ({
      bikeId: id,
      value: toValue(edits[id], definition),
    }));
    if (
      values.some((v) => typeof v.value === 'number' && Number.isNaN(v.value))
    ) {
      setError('One or more values are not valid numbers.');
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const { updatedCount } = await updateAdminBikeSpecValues({
        specCode: definition.code,
        values,
      });
      setRows((current) =>
        current.map((row) => {
          const changed = values.find((v) => v.bikeId === row.id);
          return changed ? { ...row, value: changed.value } : row;
        })
      );
      setEdits({});
      setNotice(
        `Updated ${updatedCount} motorcycle${updatedCount === 1 ? '' : 's'}.`
      );
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to save changes.'
      );
    } finally {
      setSaving(false);
    }
  }

  function renderInput(row: BikeSpecValueItem, def: SpecDefinition) {
    const current = edits[row.id] ?? toText(row.value);
    const onChange = (value: string) =>
      setEdits((prev) => ({ ...prev, [row.id]: value }));
    const label = `${def.label} for ${row.modelName} ${row.variantName} ${row.year}`;
    if (def.dataType === 'boolean') {
      return (
        <select
          aria-label={label}
          className="w-40 border border-black/20 px-3 py-2"
          value={current}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">—</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }
    return (
      <input
        aria-label={label}
        className="w-40 border border-black/20 px-3 py-2"
        type={def.dataType === 'number' ? 'number' : 'text'}
        step="any"
        value={current}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <section className="bg-brand-content p-6 shadow-lg">
      <h1 className="text-2xl font-bold">Bulk Spec Edit</h1>
      <p className="mt-1 text-sm text-brand-grey">
        Choose a brand and one specification, then set that specification for
        many motorcycles at once.
      </p>
      <form
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={load}
      >
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-sm font-semibold" htmlFor="bulk-spec">
            Specification
          </label>
          <select
            className={inputClass}
            id="bulk-spec"
            required
            value={specCode}
            onChange={(e) => setSpecCode(e.target.value)}
          >
            <option value="">Select a specification</option>
            {specGroups.map((group) => (
              <optgroup key={group.code} label={group.name}>
                {group.definitions.map((def) => (
                  <option key={def.code} value={def.code}>
                    {def.label}
                    {def.unit ? ` (${def.unit})` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="bulk-brand">
            Brand (required)
          </label>
          <select
            className={inputClass}
            id="bulk-brand"
            required
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
          >
            <option value="">Select a brand</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="block text-sm font-semibold"
            htmlFor="bulk-category"
          >
            Category
          </label>
          <select
            className={inputClass}
            id="bulk-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-semibold" htmlFor="bulk-min">
              Min price
            </label>
            <input
              className={inputClass}
              id="bulk-min"
              type="number"
              min="0"
              step="0.01"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold" htmlFor="bulk-max">
              Max price
            </label>
            <input
              className={inputClass}
              id="bulk-max"
              type="number"
              min="0"
              step="0.01"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <button
            className="bg-brand-button px-5 py-2 font-semibold text-white disabled:opacity-50"
            disabled={loading || !brandId || !specCode}
          >
            {loading ? 'Loading...' : 'Load motorcycles'}
          </button>
        </div>
      </form>

      {error && (
        <p
          className="mt-4 border-l-4 border-red-700 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          className="mt-4 border-l-4 border-green-700 bg-green-50 p-3 text-sm text-green-800"
          role="status"
        >
          {notice}
        </p>
      )}

      {loaded &&
        definition &&
        (rows.length === 0 ? (
          <p className="mt-8 text-brand-grey">
            No motorcycles match these filters.
          </p>
        ) : (
          <>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="p-3">Motorcycle</th>
                    <th className="p-3">Year</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">MSRP</th>
                    <th className="p-3">
                      {definition.label}
                      {definition.unit ? ` (${definition.unit})` : ''}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      className={`border-b border-black/10 ${dirtyIds.includes(row.id) ? 'bg-yellow-50' : ''}`}
                      key={row.id}
                    >
                      <td className="p-3 font-semibold">
                        {row.modelName} {row.variantName}
                      </td>
                      <td className="p-3">{row.year}</td>
                      <td className="p-3">{row.categoryName}</td>
                      <td className="p-3">
                        {row.msrpPrice
                          ? `$${row.msrpPrice.toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="p-3">{renderInput(row, definition)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <button
                className="bg-brand-gold px-5 py-3 font-bold text-brand-black disabled:opacity-50"
                disabled={saving || dirtyIds.length === 0}
                onClick={() => void save()}
              >
                {saving
                  ? 'Saving...'
                  : `Save ${dirtyIds.length} change${dirtyIds.length === 1 ? '' : 's'}`}
              </button>
              {dirtyIds.length > 0 && (
                <button
                  className="border border-brand-button px-4 py-3 font-semibold text-brand-button"
                  onClick={() => setEdits({})}
                >
                  Discard
                </button>
              )}
            </div>
          </>
        ))}
    </section>
  );
}
