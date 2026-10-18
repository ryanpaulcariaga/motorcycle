'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  AdminApiError,
  getAdminBikeSpecGrid,
  getBrands,
  getCategories,
  getSpecGroups,
} from '@/lib/api';
import type { BikeSpecGridRow, LookupOption } from '@/lib/types';
import SpecGridModal, { type SpecGroup } from './SpecGridModal';

const inputClass = 'mt-1 w-full border border-black/20 px-3 py-2';

export default function BulkSpecEditor() {
  const [brands, setBrands] = useState<LookupOption[]>([]);
  const [categories, setCategories] = useState<LookupOption[]>([]);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bikes, setBikes] = useState<BikeSpecGridRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getBrands(), getCategories(), getSpecGroups()])
      .then(([brandResult, categoryResult, groupResult]) => {
        setBrands(brandResult);
        setCategories(categoryResult);
        setSpecGroups(groupResult);
      })
      .catch(() => setError('Unable to load filter options.'));
  }, []);

  async function load(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminBikeSpecGrid({
        brandId: brandId ? Number(brandId) : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        minPrice: minPrice === '' ? undefined : Number(minPrice),
        maxPrice: maxPrice === '' ? undefined : Number(maxPrice),
      });
      setBikes(result);
      setLoaded(true);
      setModalOpen(result.length > 0);
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

  return (
    <section className="bg-brand-content p-6 shadow-lg">
      <h1 className="text-xl font-bold">Bulk Spec Edit</h1>
      <p className="mt-1 text-sm text-brand-grey">
        Filter motorcycles, then edit many specifications across them in a
        spreadsheet-style grid.
      </p>
      <form
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={load}
      >
        <div>
          <label className="block text-sm font-semibold" htmlFor="bulk-brand">
            Brand
          </label>
          <select
            className={inputClass}
            id="bulk-brand"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
          >
            <option value="">All brands</option>
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
        <div className="grid grid-cols-2 gap-2 lg:col-span-2">
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
        <div className="sm:col-span-2 lg:col-span-4">
          <button
            className="bg-brand-button px-5 py-2 font-semibold text-white disabled:opacity-50"
            disabled={loading}
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

      {loaded && bikes.length === 0 && (
        <p className="mt-8 text-brand-grey">
          No motorcycles match these filters.
        </p>
      )}

      {modalOpen && (
        <SpecGridModal
          title={`Edit specifications (${bikes.length} motorcycle${bikes.length === 1 ? '' : 's'})`}
          bikes={bikes}
          specGroups={specGroups}
          onClose={() => setModalOpen(false)}
        />
      )}
    </section>
  );
}
