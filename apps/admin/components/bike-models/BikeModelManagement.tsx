'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { IconButton } from '@/components/IconButton';
import { AdminToolbar, AdminToolbarButton } from '@/components/AdminToolbar';
import Modal, { ModalFooter } from '@/components/Modal';
import {
  AdminApiError,
  createBikeModel,
  deleteBikeModel,
  getBikeModels,
  getBrands,
  getCategories,
  updateBikeModel,
} from '@/lib/api';
import BikeManagement from '@/components/bikes/BikeManagement';
import type { BikeModel, LookupOption } from '@/lib/types';
import { bikeModelLabel } from '@/lib/bikeModelLabel';
import {
  parseBikeModelListState,
  serializeBikeModelListState,
  type BikeModelSortField,
} from '@/lib/bikeModelListState';
import { compareText, sortRows } from '@/lib/multiSort';
import { SortGroup } from '@/components/GridSidebar';

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
  const [sortRules, setSortRules] = useState(initialListState.sort);
  const [filtersOpen, setFiltersOpen] = useState(() =>
    window.matchMedia('(min-width: 768px)').matches
  );
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastTouchedId, setLastTouchedId] = useState<number | null>(null);
  const [variantsModel, setVariantsModel] = useState<BikeModel | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const primarySort = sortRules[0];
  const activeFilterCount = [brandFilter, categoryFilter].filter(Boolean).length;
  const filteredModels = sortRows(
    models.filter(
      (model) =>
        (!brandFilter || model.brandId === Number(brandFilter)) &&
        (!categoryFilter || model.categoryId === Number(categoryFilter))
    ),
    sortRules,
    {
      brand: (left, right) => compareText(left.brandName, right.brandName),
      category: (left, right) =>
        compareText(left.categoryName, right.categoryName),
      name: (left, right) => compareText(left.name, right.name),
    },
    (left, right) =>
      compareText(left.brandName, right.brandName) ||
      compareText(left.categoryName, right.categoryName) ||
      compareText(left.name, right.name)
  );
  const ariaSort = (field: BikeModelSortField) =>
    primarySort?.field !== field
      ? undefined
      : primarySort.direction === 'asc'
        ? 'ascending'
        : 'descending';
  const load = useCallback(async () => {
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
  }, []);

  const closeVariants = useCallback(() => {
    setVariantsModel(null);
    void load();
  }, [load]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  useEffect(() => {
    const search = serializeBikeModelListState({
      brandFilter,
      categoryFilter,
      sort: sortRules,
    });
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${search}`
    );
  }, [brandFilter, categoryFilter, sortRules]);
  const reset = useCallback(() => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(false);
  }, []);

  function startCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setModalOpen(true);
  }

  function startEdit(model: BikeModel) {
    setEditingId(model.id);
    setForm({
      brandId: String(model.brandId),
      categoryId: String(model.categoryId),
      name: model.name,
    });
    setError(null);
    setModalOpen(true);
  }

  function startClone(model: BikeModel) {
    setEditingId(null);
    setForm({
      brandId: String(model.brandId),
      categoryId: String(model.categoryId),
      name: model.name,
    });
    setError(null);
    setModalOpen(true);
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
    if (!window.confirm(`Delete ${model.name}?`)) {
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

  const managementActions = (
    <AdminToolbar>
      <AdminToolbarButton onClick={() => void load()} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </AdminToolbarButton>
      <AdminToolbarButton onClick={startCreate}>
        Add BikeModel
      </AdminToolbarButton>
    </AdminToolbar>
  );

  return (
    <div>
      <section className="min-w-0 bg-brand-content p-4 shadow-lg sm:p-6">
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">Bikes Model</h1>
          </div>
        </div>
        {error && !modalOpen && (
          <p
            className="mt-4 border-l-4 border-red-700 bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        )}
        {loading && models.length === 0 ? (
          <>
            <p className="mt-8 text-brand-grey">Loading bikes...</p>
            <div className="mt-4">{managementActions}</div>
          </>
        ) : models.length === 0 ? (
          <>
            <p className="mt-8 text-brand-grey">No bikes have been added.</p>
            <div className="mt-4">{managementActions}</div>
          </>
        ) : (
          <div className="mt-6">
            <details
              className="border border-zinc-200 bg-zinc-50 p-4 text-sm"
              open={filtersOpen}
              onToggle={(event) => setFiltersOpen(event.currentTarget.open)}
            >
              <summary className="cursor-pointer font-semibold text-brand-button hover:underline">
                Filters
                {activeFilterCount > 0
                  ? ` (${activeFilterCount} active)`
                  : ''}
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Brand
                  <select
                    className="mt-1 block w-full border border-black/20 bg-white px-3 py-2 font-normal"
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
                <label className="block text-sm font-semibold">
                  Category
                  <select
                    className="mt-1 block w-full border border-black/20 bg-white px-3 py-2 font-normal"
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
              <button
                className="mt-3 text-sm font-semibold text-brand-button underline disabled:opacity-40 disabled:no-underline"
                disabled={activeFilterCount === 0}
                type="button"
                onClick={() => {
                  setBrandFilter('');
                  setCategoryFilter('');
                }}
              >
                Clear filters
              </button>
            </details>
            <SortGroup
              fields={[
                { key: 'brand', label: 'Brand' },
                { key: 'category', label: 'Category' },
                { key: 'name', label: 'Model' },
              ]}
              defaultInlineOpen={window.matchMedia('(min-width: 768px)').matches}
              inline
              rules={sortRules}
              onChange={setSortRules}
            />
            <div className="mt-4">{managementActions}</div>
            {filteredModels.length === 0 ? (
              <p className="mt-6 py-4 text-brand-grey" role="status">
                No bike models match the selected filters.
              </p>
            ) : (
              <div className="max-w-full overflow-x-auto">
                <table className="w-full min-w-[38rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th aria-sort={ariaSort('brand')} className="p-2">
                        Brand
                      </th>
                      <th aria-sort={ariaSort('category')} className="p-2">
                        Category
                      </th>
                      <th aria-sort={ariaSort('name')} className="p-2">
                        Model
                      </th>
                      <th className="relative p-2">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModels.map((model) => (
                      <tr
                    className={`border-b border-black/10 ${lastTouchedId === model.id ? 'bg-brand-button/10' : ''}`}
                    key={model.id}
                    onClick={() => setLastTouchedId(model.id)}
                  >
                        <td className="p-2">{model.brandName}</td>
                        <td className="p-2">{model.categoryName}</td>
                        <td className="p-2 font-semibold">
                          {bikeModelLabel(model.name, model.bikeCount)}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center justify-end gap-1">
                            <IconButton
                              icon="edit"
                              label="Edit"
                              onClick={() => {
                                setLastTouchedId(model.id);
                                startEdit(model);
                              }}
                            />
                            <IconButton
                              icon="variants"
                              label={
                                model.bikeCount > 0
                                  ? `Variants (${model.bikeCount})`
                                  : 'Variants'
                              }
                              variant={model.bikeCount > 0 ? 'success' : 'default'}
                              badge={model.bikeCount}
                              onClick={() => {
                                setLastTouchedId(model.id);
                                setVariantsModel(model);
                              }}
                            />
                            <IconButton
                              icon="clone"
                              label="Clone"
                              onClick={() => {
                                setLastTouchedId(model.id);
                                startClone(model);
                              }}
                            />
                            <IconButton
                              icon="delete"
                              label="Delete"
                              variant="danger"
                              onClick={() => {
                                setLastTouchedId(model.id);
                                void remove(model);
                              }}
                            />
                          </div>
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
      {variantsModel && (
        <Modal
          title={`${variantsModel.name} Variants`}
          extraWide
          onClose={closeVariants}
        >
          <div className="my-4 text-brand-black">
            <BikeManagement
              modelId={variantsModel.id}
              embedded
              onModelsChanged={() => void load()}
            />
          </div>
        </Modal>
      )}
      {modalOpen && (
        <Modal
          title={editingId === null ? 'Add BikeModel' : 'Edit BikeModel'}
          error={error}
          onClose={reset}
        >
          <form onSubmit={submit}>
            <label
              className="mt-5 block text-sm font-semibold"
              htmlFor="brandId"
            >
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
            <label
              className="mt-4 block text-sm font-semibold"
              htmlFor="modelName"
            >
              Model
            </label>
            <input
              className="mt-2 w-full px-3 py-2 text-brand-black"
              id="modelName"
              required
              maxLength={255}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
            <ModalFooter>
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
              <button
                className="border border-black/30 px-4 py-3 font-semibold"
                type="button"
                onClick={reset}
              >
                Cancel
              </button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  );
}
