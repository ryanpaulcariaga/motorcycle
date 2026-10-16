'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { IconButton } from '@/components/IconButton';
import Modal, { ModalFooter } from '@/components/Modal';
import {
  AdminApiError,
  createAdminBike,
  createBikeModel,
  deleteAdminBike,
  getAdminBike,
  getAdminBikes,
  getBikeModels,
  getBrands,
  getCategories,
  getSpecGroups,
  publishAdminBike,
  reassignAdminBikeModel,
  unpublishAdminBike,
  updateAdminBike,
} from '@/lib/api';
import type { BikeAdminListItem, BikeModel, LookupOption } from '@/lib/types';
import { getBikeModelListSearch } from '@/lib/bikeModelListState';
import BikeImageManagement from './BikeImageManagement';

type SpecGroup = Awaited<ReturnType<typeof getSpecGroups>>[number];

const emptyForm = {
  modelId: '',
  variantName: '',
  year: '',
  msrpPrice: '',
  specs: {} as Record<string, string>,
};

type SortField = 'variant' | 'model' | 'year' | 'msrp' | 'status';

export default function BikeManagement({
  modelId,
  embedded = false,
}: {
  modelId?: number;
  embedded?: boolean;
}) {
  const [bikes, setBikes] = useState<BikeAdminListItem[]>([]);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [models, setModels] = useState<BikeModel[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reassignTargetBike, setReassignTargetBike] =
    useState<BikeAdminListItem | null>(null);
  const [targetModelId, setTargetModelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [creatingModel, setCreatingModel] = useState(false);
  const [newModel, setNewModel] = useState({
    brandId: '',
    categoryId: '',
    name: '',
  });
  const [brands, setBrands] = useState<LookupOption[]>([]);
  const [categories, setCategories] = useState<LookupOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState('');
  const [modelFilter, setModelFilter] = useState(
    () =>
      (modelId === undefined &&
        new URLSearchParams(window.location.search).get('modelId')) ||
      ''
  );
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>(
    modelId ? 'year' : 'variant'
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    modelId ? 'desc' : 'asc'
  );
  const showModel = modelId === undefined;
  const brandNames = [...new Set(models.map((model) => model.brandName))].sort(
    (a, b) => a.localeCompare(b)
  );
  const filterModels = models.filter(
    (model) => !brandFilter || model.brandName === brandFilter
  );
  const visibleBikes = bikes
    .filter(
      (bike) =>
        (!brandFilter || bike.brandName === brandFilter) &&
        (!modelFilter || String(bike.modelId) === modelFilter) &&
        (!statusFilter ||
          (statusFilter === 'published') === bike.isPublished) &&
        (!search ||
          ` ${bike.variantName} ${bike.year}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()))
    )
    .sort((a, b) => {
      const comparison =
        sortField === 'variant'
          ? a.variantName.localeCompare(b.variantName)
          : sortField === 'model'
            ? a.modelName.localeCompare(b.modelName)
            : sortField === 'year'
              ? a.year - b.year
              : sortField === 'msrp'
                ? (a.msrpPrice ?? -1) - (b.msrpPrice ?? -1)
                : Number(a.isPublished) - Number(b.isPublished);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  function sortBy(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function sortHeader(field: SortField, label: string) {
    const active = sortField === field;
    return (
      <th
        className="p-3"
        aria-sort={
          active
            ? sortDirection === 'asc'
              ? 'ascending'
              : 'descending'
            : undefined
        }
      >
        <button
          className="font-semibold"
          type="button"
          onClick={() => sortBy(field)}
        >
          {label}
          {active && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
        </button>
      </th>
    );
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [bikeResult, specGroupResult, modelResult] = await Promise.all([
        getAdminBikes(modelId),
        getSpecGroups(),
        getBikeModels(),
      ]);
      setBikes(bikeResult);
      setSpecGroups(specGroupResult);
      setModels(modelResult);
    } catch (cause) {
      setError(
        cause instanceof AdminApiError ? cause.message : 'Unable to load bikes.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [modelId]);

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

  async function loadBikeForm(bike: BikeAdminListItem) {
    const detail = await getAdminBike(bike.id);
    const specs: Record<string, string> = {};
    for (const [code, value] of Object.entries(detail.specs)) {
      specs[code] = value === null || value === undefined ? '' : String(value);
    }
    return {
      modelId: String(detail.modelId),
      variantName: detail.variantName,
      year: String(detail.year),
      msrpPrice: detail.msrpPrice ? String(detail.msrpPrice) : '',
      specs,
    };
  }

  async function startEdit(bike: BikeAdminListItem) {
    setError(null);
    try {
      setForm(await loadBikeForm(bike));
      setEditingId(bike.id);
      setModalOpen(true);
    } catch {
      setError('Unable to load bike details for editing.');
    }
  }

  async function startClone(bike: BikeAdminListItem) {
    setError(null);
    try {
      setForm(await loadBikeForm(bike));
      setEditingId(null);
      setModalOpen(true);
    } catch {
      setError('Unable to load bike details for cloning.');
    }
  }

  function buildSpecs(): Record<string, unknown> {
    const specs: Record<string, unknown> = {};
    for (const group of specGroups) {
      for (const def of group.definitions) {
        const raw = form.specs[def.code];
        if (raw === undefined || raw === '') {
          continue;
        }
        specs[def.code] =
          def.dataType === 'number'
            ? Number(raw)
            : def.dataType === 'boolean'
              ? raw === 'true'
              : raw;
      }
    }
    return specs;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const request = {
        variantName: form.variantName,
        year: Number(form.year) || 0,
        msrpPrice: form.msrpPrice === '' ? null : Number(form.msrpPrice),
        specs: buildSpecs(),
      };
      if (editingId === null) {
        const targetModelId = modelId ?? Number(form.modelId);
        if (!targetModelId) {
          throw new Error('model_required');
        }
        await createAdminBike({ modelId: targetModelId, ...request });
      } else {
        await updateAdminBike(editingId, {
          ...request,
          modelId: Number(form.modelId) || undefined,
        });
      }
      reset();
      await load();
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : cause instanceof Error && cause.message === 'model_required'
            ? 'Select a model for the new variant.'
            : 'Unable to save bike.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublish(bike: BikeAdminListItem) {
    setError(null);
    try {
      if (bike.isPublished) {
        await unpublishAdminBike(bike.id);
      } else {
        await publishAdminBike(bike.id);
      }
      await load();
    } catch (cause) {
      setError(
        cause instanceof AdminApiError &&
          cause.details?.code === 'bike_not_publishable'
          ? 'This bike is missing required details and cannot be published.'
          : 'Unable to update publication state.'
      );
    }
  }

  async function remove(bike: BikeAdminListItem) {
    if (
      !window.confirm(
        `Delete ${bike.brandName} - ${bike.variantName} (${bike.year})?`
      )
    ) {
      return;
    }
    setError(null);
    try {
      await deleteAdminBike(bike.id);
      await load();
    } catch (cause) {
      setError(
        cause instanceof AdminApiError &&
          cause.details?.code === 'bike_referenced'
          ? 'This bike has assigned images and cannot be deleted.'
          : 'Unable to delete bike.'
      );
    }
  }

  function startReassign(bike: BikeAdminListItem) {
    setError(null);
    setNotice(null);
    setTargetModelId(String(bike.modelId));
    setCreatingModel(false);
    setReassignTargetBike(bike);
  }

  async function startCreateModel() {
    setError(null);
    setNewModel({ brandId: '', categoryId: '', name: '' });
    setCreatingModel(true);
    try {
      const [brandResult, categoryResult] = await Promise.all([
        getBrands(),
        getCategories(),
      ]);
      setBrands(brandResult);
      setCategories(categoryResult);
    } catch {
      setError('Unable to load brands and categories.');
    }
  }

  function closeReassign() {
    if (reassigning) {
      return;
    }
    setReassignTargetBike(null);
    setTargetModelId('');
    setCreatingModel(false);
    setError(null);
  }

  async function reassignModel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reassignTargetBike || (!creatingModel && !targetModelId)) {
      return;
    }
    setReassigning(true);
    setError(null);
    try {
      let targetModel = models.find(
        (model) => model.id === Number(targetModelId)
      );
      let newModelId = Number(targetModelId);
      if (creatingModel) {
        targetModel = await createBikeModel({
          brandId: Number(newModel.brandId),
          categoryId: Number(newModel.categoryId),
          name: newModel.name.trim(),
        });
        newModelId = targetModel.id;
      }
      await reassignAdminBikeModel(reassignTargetBike.id, {
        modelId: newModelId,
      });
      setReassignTargetBike(null);
      setTargetModelId('');
      setCreatingModel(false);
      setNotice(
        `${reassignTargetBike.brandName} - ${reassignTargetBike.variantName} (${reassignTargetBike.year}) was reassigned to ${targetModel ? `${targetModel.brandName} - ${targetModel.name}` : 'the selected BikeModel'}.`
      );
      await load();
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to reassign the bike model.'
      );
    } finally {
      setReassigning(false);
    }
  }

  return (
    <div>
      <section className="bg-brand-content p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            {modelId !== undefined && !embedded && (
              <a
                className="text-sm font-semibold text-brand-button underline"
                href={`/admin/bike-models${getBikeModelListSearch(window.location.search)}`}
              >
                ← Bikes Model
              </a>
            )}
            {embedded ? (
              <h3 className="text-xl font-bold">Bike Variants</h3>
            ) : (
              <h1 className="mt-2 text-2xl font-bold">Bike Variants</h1>
            )}
          </div>
          <div className="flex gap-3">
            <button
              className="border border-brand-button px-3 py-2 text-sm font-semibold text-brand-button"
              onClick={() => void load()}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              className="bg-brand-gold px-3 py-2 text-sm font-bold text-brand-black"
              onClick={startCreate}
            >
              Add variant
            </button>
          </div>
        </div>
        {error && !modalOpen && !reassignTargetBike && (
          <p
            className="mt-4 border-l-4 border-red-700 bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        )}
        {notice && !modalOpen && !reassignTargetBike && (
          <p
            className="mt-4 border-l-4 border-green-700 bg-green-50 p-3 text-sm text-green-800"
            role="status"
          >
            {notice}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <input
            aria-label="Search variants"
            className="border border-black/20 px-3 py-2 text-sm"
            placeholder="Search variants"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {showModel && (
            <select
              aria-label="Filter by brand"
              className="border border-black/20 px-3 py-2 text-sm"
              value={brandFilter}
              onChange={(event) => {
                setBrandFilter(event.target.value);
                setModelFilter('');
              }}
            >
              <option value="">All brands</option>
              {brandNames.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          )}
          {showModel && (
            <select
              aria-label="Filter by model"
              className="border border-black/20 px-3 py-2 text-sm"
              value={modelFilter}
              onChange={(event) => setModelFilter(event.target.value)}
            >
              <option value="">All models</option>
              {filterModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.brandName} - {model.name}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Filter by status"
            className="border border-black/20 px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
          {(search || brandFilter || modelFilter || statusFilter) && (
            <button
              className="text-sm font-semibold text-brand-button underline"
              type="button"
              onClick={() => {
                setSearch('');
                setBrandFilter('');
                setModelFilter('');
                setStatusFilter('');
              }}
            >
              Clear filters
            </button>
          )}
        </div>
        {loading ? (
          <p className="mt-8 text-brand-grey">Loading bikes...</p>
        ) : bikes.length === 0 ? (
          <p className="mt-8 text-brand-grey">
            No bike variants have been added.
          </p>
        ) : visibleBikes.length === 0 ? (
          <p className="mt-8 text-brand-grey">
            No bike variants match the selected filters.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  {sortHeader('year', 'Year')}
                  {sortHeader('variant', 'Motorcycle')}
                  {sortHeader('model', 'Bike Model')}
                  {sortHeader('msrp', 'MSRP')}
                  {sortHeader('status', 'Status')}
                  <th className="p-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleBikes.map((bike) => (
                  <tr className="border-b border-black/10" key={bike.id}>
                    <td className="p-3">{bike.year}</td>
                    <td className="p-3 font-semibold">
                      {bike.brandName} - {bike.variantName}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-2">
                        {bike.modelName}
                        <button
                          type="button"
                          className="text-brand-button hover:opacity-70"
                          aria-label={`Reassign BikeModel for ${bike.brandName} - ${bike.variantName} (${bike.year})`}
                          title="Reassign BikeModel"
                          onClick={() => startReassign(bike)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path d="M17 3l4 4-4 4" />
                            <path d="M3 7h18" />
                            <path d="M7 21l-4-4 4-4" />
                            <path d="M21 17H3" />
                          </svg>
                        </button>
                      </span>
                    </td>
                    <td className="p-3">
                      {bike.msrpPrice
                        ? `$${bike.msrpPrice.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="p-3">
                      {bike.isPublished ? (
                        <span className="font-semibold text-green-700">
                          Published
                        </span>
                      ) : (
                        <span className="text-brand-grey">Unpublished</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon="edit"
                          label="Edit"
                          onClick={() => void startEdit(bike)}
                        />
                        <IconButton
                          icon="clone"
                          label="Clone"
                          onClick={() => void startClone(bike)}
                        />
                        <IconButton
                          icon={bike.isPublished ? 'unpublish' : 'publish'}
                          label={bike.isPublished ? 'Unpublish' : 'Publish'}
                          onClick={() => void togglePublish(bike)}
                        />
                        <IconButton
                          icon="delete"
                          label="Delete"
                          variant="danger"
                          onClick={() => void remove(bike)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {modalOpen && (
        <Modal
          title={editingId === null ? 'Add Bike Variant' : 'Edit Bike Variant'}
          error={error}
          wide
          onClose={reset}
        >
          <form onSubmit={submit}>
            {(editingId !== null || showModel) && (
              <>
                <label
                  className="mt-5 block text-sm font-semibold"
                  htmlFor="bikeModel"
                >
                  Model
                </label>
                <select
                  className="mt-2 w-full px-3 py-2 text-brand-black"
                  id="bikeModel"
                  required
                  value={form.modelId}
                  onChange={(event) =>
                    setForm({ ...form, modelId: event.target.value })
                  }
                >
                  {editingId === null && (
                    <option value="">Select a model</option>
                  )}
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.brandName} - {model.name}
                    </option>
                  ))}
                </select>
              </>
            )}
            <label
              className="mt-5 block text-sm font-semibold"
              htmlFor="variantName"
            >
              Variant name
            </label>
            <input
              className="mt-2 w-full px-3 py-2 text-brand-black"
              id="variantName"
              required
              maxLength={255}
              value={form.variantName}
              onChange={(event) =>
                setForm({ ...form, variantName: event.target.value })
              }
            />
            <label className="mt-4 block text-sm font-semibold" htmlFor="year">
              Year
            </label>
            <input
              className="mt-2 w-full px-3 py-2 text-brand-black"
              id="year"
              type="number"
              min={0}
              placeholder="0 if unknown"
              value={form.year}
              onChange={(event) =>
                setForm({ ...form, year: event.target.value })
              }
            />
            <label
              className="mt-4 block text-sm font-semibold"
              htmlFor="msrpPrice"
            >
              MSRP (optional)
            </label>
            <input
              className="mt-2 w-full px-3 py-2 text-brand-black"
              id="msrpPrice"
              type="number"
              step="0.01"
              value={form.msrpPrice}
              onChange={(event) =>
                setForm({ ...form, msrpPrice: event.target.value })
              }
            />
            {specGroups.map((group) => (
              <fieldset
                className="mt-4 border-t border-white/20 pt-4"
                key={group.code}
              >
                <legend className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
                  {group.name}
                </legend>
                {group.definitions.map((def) => (
                  <div className="mt-2" key={def.code}>
                    <label
                      className="block text-xs font-semibold"
                      htmlFor={`spec-${def.code}`}
                    >
                      {def.label}
                      {def.unit ? ` (${def.unit})` : ''}
                    </label>
                    {def.dataType === 'boolean' ? (
                      <select
                        className="mt-1 w-full px-3 py-2 text-brand-black"
                        id={`spec-${def.code}`}
                        value={form.specs[def.code] ?? ''}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            specs: {
                              ...form.specs,
                              [def.code]: event.target.value,
                            },
                          })
                        }
                      >
                        <option value="">—</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <input
                        className="mt-1 w-full px-3 py-2 text-brand-black"
                        id={`spec-${def.code}`}
                        type={def.dataType === 'number' ? 'number' : 'text'}
                        value={form.specs[def.code] ?? ''}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            specs: {
                              ...form.specs,
                              [def.code]: event.target.value,
                            },
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </fieldset>
            ))}
            <ModalFooter>
              <button
                className="flex-1 bg-brand-gold px-4 py-3 font-bold text-brand-black disabled:opacity-50"
                disabled={submitting}
              >
                {submitting
                  ? 'Saving...'
                  : editingId === null
                    ? 'Add bike'
                    : 'Save changes'}
              </button>
              <button
                className="border border-white px-4 py-3 font-semibold"
                type="button"
                onClick={reset}
              >
                Cancel
              </button>
            </ModalFooter>
            {editingId !== null && <BikeImageManagement bikeId={editingId} />}
          </form>
        </Modal>
      )}
      {reassignTargetBike && (
        <Modal
          title="Reassign Bike Model"
          error={error}
          onClose={closeReassign}
        >
          <form onSubmit={reassignModel}>
            <p className="mt-5 text-sm text-white/80">
              {reassignTargetBike.year} {reassignTargetBike.brandName} -{' '}
              {reassignTargetBike.variantName}
            </p>
            <p className="mt-2 text-sm text-white/80">
              Only the BikeModel assignment will change.
            </p>
            <div className="mt-5 flex items-center justify-between">
              <label
                className="block text-sm font-semibold"
                htmlFor="reassignBikeModel"
              >
                BikeModel
              </label>
              <button
                className="text-sm font-semibold text-brand-gold disabled:opacity-50"
                type="button"
                disabled={reassigning}
                onClick={() =>
                  creatingModel
                    ? setCreatingModel(false)
                    : void startCreateModel()
                }
              >
                {creatingModel ? 'Choose existing' : '+ New BikeModel'}
              </button>
            </div>
            {creatingModel ? (
              <div className="mt-2 grid gap-3">
                <select
                  className="w-full px-3 py-2 text-brand-black"
                  aria-label="Brand"
                  required
                  value={newModel.brandId}
                  disabled={reassigning}
                  onChange={(e) =>
                    setNewModel({ ...newModel, brandId: e.target.value })
                  }
                >
                  <option value="">Select brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full px-3 py-2 text-brand-black"
                  aria-label="Category"
                  required
                  value={newModel.categoryId}
                  disabled={reassigning}
                  onChange={(e) =>
                    setNewModel({ ...newModel, categoryId: e.target.value })
                  }
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full px-3 py-2 text-brand-black"
                  aria-label="BikeModel name"
                  placeholder="BikeModel name"
                  required
                  maxLength={100}
                  value={newModel.name}
                  disabled={reassigning}
                  onChange={(e) =>
                    setNewModel({ ...newModel, name: e.target.value })
                  }
                />
              </div>
            ) : (
              <select
                className="mt-2 w-full px-3 py-2 text-brand-black"
                id="reassignBikeModel"
                required
                value={targetModelId}
                disabled={reassigning}
                onChange={(event) => setTargetModelId(event.target.value)}
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.brandName} - {model.name} ({model.categoryName})
                    {model.id === reassignTargetBike.modelId
                      ? ' (current)'
                      : ''}
                  </option>
                ))}
              </select>
            )}
            <ModalFooter>
              <button
                className="flex-1 border border-white/40 px-5 py-3 font-semibold disabled:opacity-50"
                type="button"
                disabled={reassigning}
                onClick={closeReassign}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-brand-gold px-5 py-3 font-bold text-brand-black disabled:opacity-50"
                type="submit"
                disabled={
                  reassigning ||
                  (creatingModel
                    ? !newModel.brandId ||
                      !newModel.categoryId ||
                      !newModel.name.trim()
                    : !targetModelId ||
                      Number(targetModelId) === reassignTargetBike.modelId)
                }
              >
                {reassigning
                  ? 'Saving...'
                  : creatingModel
                    ? 'Create & Reassign'
                    : 'Reassign'}
              </button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  );
}
