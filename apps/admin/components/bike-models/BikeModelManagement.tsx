'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  AdminApiError,
  createBikeModel,
  deleteBikeModel,
  getBikeModels,
  getBrands,
  getCategories,
  updateBikeModel,
} from '@/lib/api';
import type { BikeModel, LookupOption } from '@/lib/types';
import {
  parseBikeModelListState,
  serializeBikeModelListState,
} from '@/lib/bikeModelListState';

const emptyForm = { brandId: '', categoryId: '', name: '' };

export default function BikeModelManagement() {
  const [initialListState] = useState(() =>
    parseBikeModelListState(window.location.search)
  );
  const [models, setModels] = useState<BikeModel[]>([]);
  const [brands, setBrands] = useState<LookupOption[]>([]);
  const [categories, setCategories] = useState<LookupOption[]>([]);
  const [brandFilter, setBrandFilter] = useState(initialListState.brandFilter);
  const [categoryFilter, setCategoryFilter] = useState(
    initialListState.categoryFilter
  );
  const [sortField, setSortField] = useState<'brand' | 'category' | 'name'>(
    initialListState.sortField
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    initialListState.sortDirection
  );
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bikeListSearch = serializeBikeModelListState({
    brandFilter,
    categoryFilter,
    sortField,
    sortDirection,
  });
  const filteredModels = models
    .filter(
      (model) =>
        (!brandFilter || model.brandId === Number(brandFilter)) &&
        (!categoryFilter || model.categoryId === Number(categoryFilter))
    )
    .sort((left, right) => {
      const leftValue =
        sortField === 'brand'
          ? left.brandName
          : sortField === 'category'
            ? left.categoryName
            : left.name;
      const rightValue =
        sortField === 'brand'
          ? right.brandName
          : sortField === 'category'
            ? right.categoryName
            : right.name;
      const compareNames = (leftName: string, rightName: string) =>
        leftName.localeCompare(rightName, undefined, {
          sensitivity: 'base',
          numeric: true,
        });
      const primary = compareNames(leftValue, rightValue);
      const comparison =
        primary ||
        compareNames(left.brandName, right.brandName) ||
        compareNames(left.categoryName, right.categoryName) ||
        compareNames(left.name, right.name);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  function sortBy(field: 'brand' | 'category' | 'name') {
    if (sortField === field) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection('asc');
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [modelResult, brandResult, categoryResult] = await Promise.all([
        getBikeModels(),
        getBrands(),
        getCategories(),
      ]);
      setModels(modelResult);
      setBrands(brandResult);
      setCategories(categoryResult);
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to load BikeModels.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void load());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (brandFilter) {
      params.set('brandId', brandFilter);
    }
    if (categoryFilter) {
      params.set('categoryId', categoryFilter);
    }
    if (sortField !== 'brand') {
      params.set('sort', sortField);
    }
    if (sortDirection !== 'asc') {
      params.set('direction', sortDirection);
    }
    const search = params.toString();
    const url = `${window.location.pathname}${search ? `?${search}` : ''}`;
    window.history.replaceState(window.history.state, '', url);
  }, [brandFilter, categoryFilter, sortField, sortDirection]);

  function reset() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function edit(model: BikeModel) {
    setEditingId(model.id);
    setForm({
      brandId: String(model.brandId),
      categoryId: String(model.categoryId),
      name: model.name,
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const request = {
        brandId: Number(form.brandId),
        categoryId: Number(form.categoryId),
        name: form.name,
      };
      if (editingId === null) {
        await createBikeModel(request);
      } else {
        await updateBikeModel(editingId, request);
      }
      reset();
      await load();
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.details?.code === 'bike_model_referenced'
            ? 'This BikeModel is referenced by existing bikes and cannot be deleted.'
            : cause.message
          : 'Unable to save BikeModel.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(model: BikeModel) {
    if (!window.confirm(`Delete ${model.brandName} ${model.name}?`)) {
      return;
    }
    setError(null);
    try {
      await deleteBikeModel(model.id);
      await load();
    } catch (cause) {
      setError(
        cause instanceof AdminApiError &&
          cause.details?.code === 'bike_model_referenced'
          ? 'This BikeModel is referenced by existing bikes and cannot be deleted.'
          : 'Unable to delete BikeModel.'
      );
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="bg-brand-content p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-button">
              Catalog
            </p>
            <h1 className="text-2xl font-bold">Bikes Model</h1>
          </div>
          <button
            className="border border-brand-button px-3 py-2 text-sm font-semibold text-brand-button"
            onClick={() => void load()}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
        {error && (
          <p
            className="mt-4 border-l-4 border-red-700 bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        )}
        {loading ? (
          <p className="mt-8 text-brand-grey">Loading bikes...</p>
        ) : models.length === 0 ? (
          <p className="mt-8 text-brand-grey">No bikes have been added.</p>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-grey">
                Filter
              </h2>
              <button
                className="text-sm font-semibold text-brand-button underline disabled:text-brand-grey disabled:no-underline"
                disabled={!brandFilter && !categoryFilter}
                onClick={() => {
                  setBrandFilter('');
                  setCategoryFilter('');
                }}
                type="button"
              >
                Clear filters
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label
                className="block text-sm font-semibold"
                htmlFor="bikeBrandFilter"
              >
                Filter by brand
                <select
                  className="mt-2 block w-full px-3 py-2 font-normal text-brand-black"
                  id="bikeBrandFilter"
                  value={brandFilter}
                  onChange={(event) => setBrandFilter(event.target.value)}
                >
                  <option value="">All brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>
              <label
                className="block text-sm font-semibold"
                htmlFor="bikeCategoryFilter"
              >
                Filter by category
                <select
                  className="mt-2 block w-full px-3 py-2 font-normal text-brand-black"
                  id="bikeCategoryFilter"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {filteredModels.length === 0 ? (
              <p className="py-4 text-brand-grey" role="status">
                No bike models match the selected filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[38rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th
                        aria-sort={
                          sortField === 'brand'
                            ? sortDirection === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        }
                        className="p-3"
                      >
                        <button
                          className="inline-flex items-center gap-1 font-semibold hover:underline"
                          onClick={() => sortBy('brand')}
                          type="button"
                        >
                          Brand
                          {sortField === 'brand' && (
                            <span aria-hidden="true">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                          <span className="sr-only">
                            {sortField === 'brand'
                              ? `, sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}`
                              : ', sort by brand'}
                          </span>
                        </button>
                      </th>
                      <th
                        aria-sort={
                          sortField === 'category'
                            ? sortDirection === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        }
                        className="p-3"
                      >
                        <button
                          className="inline-flex items-center gap-1 font-semibold hover:underline"
                          onClick={() => sortBy('category')}
                          type="button"
                        >
                          Category
                          {sortField === 'category' && (
                            <span aria-hidden="true">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                          <span className="sr-only">
                            {sortField === 'category'
                              ? `, sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}`
                              : ', sort by category'}
                          </span>
                        </button>
                      </th>
                      <th
                        aria-sort={
                          sortField === 'name'
                            ? sortDirection === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        }
                        className="p-3"
                      >
                        <button
                          className="inline-flex items-center gap-1 font-semibold hover:underline"
                          onClick={() => sortBy('name')}
                          type="button"
                        >
                          Model
                          {sortField === 'name' && (
                            <span aria-hidden="true">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                          <span className="sr-only">
                            {sortField === 'name'
                              ? `, sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}`
                              : ', sort by model'}
                          </span>
                        </button>
                      </th>
                      <th className="p-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModels.map((model) => (
                      <tr className="border-b border-black/10" key={model.id}>
                        <td className="p-3">{model.brandName}</td>
                        <td className="p-3">{model.categoryName}</td>
                        <td className="p-3 font-semibold">{model.name}</td>
                        <td className="whitespace-nowrap p-3 text-right">
                          <button
                            className="mr-3 font-semibold text-brand-button underline"
                            onClick={() => edit(model)}
                          >
                            Edit
                          </button>
                          <a
                            className="mr-3 font-semibold text-brand-button underline"
                            href={`/admin/bike-models/${model.id}/bikes${bikeListSearch}`}
                          >
                            Variants
                          </a>
                          <button
                            className="font-semibold text-red-700 underline"
                            onClick={() => void remove(model)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
      <form
        className="h-fit bg-brand-sidebar p-6 text-white shadow-lg"
        onSubmit={submit}
      >
        <h2 className="text-xl font-bold">
          {editingId === null ? 'Add BikeModel' : 'Edit BikeModel'}
        </h2>
        <label className="mt-5 block text-sm font-semibold" htmlFor="brandId">
          Brand
        </label>
        <select
          className="mt-2 w-full px-3 py-2 text-brand-black"
          id="brandId"
          required
          value={form.brandId}
          onChange={(event) =>
            setForm({ ...form, brandId: event.target.value })
          }
        >
          <option value="">Select brand</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
        <label
          className="mt-4 block text-sm font-semibold"
          htmlFor="categoryId"
        >
          Category
        </label>
        <select
          className="mt-2 w-full px-3 py-2 text-brand-black"
          id="categoryId"
          required
          value={form.categoryId}
          onChange={(event) =>
            setForm({ ...form, categoryId: event.target.value })
          }
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <label className="mt-4 block text-sm font-semibold" htmlFor="modelName">
          Model
        </label>
        <input
          className="mt-2 w-full px-3 py-2 text-brand-black"
          id="modelName"
          required
          maxLength={255}
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 bg-brand-gold px-4 py-3 font-bold text-brand-black disabled:opacity-50"
            disabled={submitting}
          >
            {submitting
              ? 'Saving...'
              : editingId === null
                ? 'Add model'
                : 'Save changes'}
          </button>
          {editingId !== null && (
            <button
              className="border border-white px-4 py-3 font-semibold"
              type="button"
              onClick={reset}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
