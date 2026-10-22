'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { IconButton } from '@/components/IconButton';
import Modal, { ModalFooter } from '@/components/Modal';
import {
  AdminApiError,
  createAdminBike,
  createBikeModel,
  updateBikeModel,
  deleteAdminBike,
  getAdminBike,
  getAdminBikes,
  getBikeModels,
  getBrands,
  getCategories,
  getSpecGroups,
  publishAdminBike,
  reassignAdminBikeModel,
  setAdminBikeReviewed,
  unpublishAdminBike,
  updateAdminBike,
} from '@/lib/api';
import type { BikeAdminListItem, BikeModel, LookupOption } from '@/lib/types';
import { getBikeModelListSearch } from '@/lib/bikeModelListState';
import {
  ClearFiltersButton,
  GridSidebar,
  SidebarGroup,
  SidebarSelect,
  SortGroup,
} from '@/components/GridSidebar';
import { compareText, sortRows, type SortRule } from '@/lib/multiSort';
import BikeImageManagement from './BikeImageManagement';

type SpecGroup = Awaited<ReturnType<typeof getSpecGroups>>[number];

const emptyForm = {
  modelId: '',
  variantName: '',
  year: '',
  msrpPrice: '',
  specs: {} as Record<string, string>,
};

type SortField = 'variant' | 'model' | 'brand' | 'year' | 'msrp' | 'status' | 'reviewed';

const sortFieldOptions: { key: SortField; label: string }[] = [
  { key: 'year', label: 'Year' },
  { key: 'brand', label: 'Brand' },
  { key: 'variant', label: 'Variant' },
  { key: 'model', label: 'Bike Model' },
  { key: 'msrp', label: 'MSRP' },
  { key: 'status', label: 'Status' },
  { key: 'reviewed', label: 'Reviewed' },
];

export default function BikeManagement({
  modelId,
  embedded = false,
  onModelsChanged,
}: {
  modelId?: number;
  embedded?: boolean;
  onModelsChanged?: () => void;
}) {
  const [bikes, setBikes] = useState<BikeAdminListItem[]>([]);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [models, setModels] = useState<BikeModel[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastTouchedId, setLastTouchedId] = useState<number | null>(null);
  const [reassignTargetBike, setReassignTargetBike] =
    useState<BikeAdminListItem | null>(null);
  const [imagesBike, setImagesBike] = useState<BikeAdminListItem | null>(null);
  const [targetModelId, setTargetModelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [creatingModel, setCreatingModel] = useState(false);
  const [modelFormMode, setModelFormMode] = useState<'new' | 'edit' | 'clone'>('new');
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
  const [imageFilter, setImageFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortRules, setSortRules] = useState<SortRule<SortField>[]>(
    modelId
      ? [{ field: 'year', direction: 'desc' }]
      : [{ field: 'variant', direction: 'asc' }]
  );
  const showModel = modelId === undefined;
  const brandNames = [...new Set(models.map((model) => model.brandName))].sort(
    (a, b) => a.localeCompare(b)
  );
  const filterModels = models.filter(
    (model) => !brandFilter || model.brandName === brandFilter
  );
  const visibleBikes = sortRows(
    bikes.filter(
      (bike) =>
        (!brandFilter || bike.brandName === brandFilter) &&
        (!modelFilter || String(bike.modelId) === modelFilter) &&
        (!statusFilter ||
          (statusFilter === 'published') === bike.isPublished) &&
        (!imageFilter ||
          (imageFilter === 'has-images'
            ? bike.imageCount > 0
            : bike.imageCount === 0)) &&
        (!search ||
          ` ${bike.variantName} ${bike.year}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()))
    ),
    sortRules,
    {
      variant: (a, b) => compareText(a.variantName, b.variantName),
      model: (a, b) => compareText(a.modelName, b.modelName),
      brand: (a, b) => compareText(a.brandName, b.brandName),
      year: (a, b) => a.year - b.year,
      msrp: (a, b) => (a.msrpPrice ?? -1) - (b.msrpPrice ?? -1),
      status: (a, b) => Number(a.isPublished) - Number(b.isPublished),
      reviewed: (a, b) => Number(a.isReviewed) - Number(b.isReviewed),
    }
  );
  const primarySort = sortRules[0];

  function sortHeader(field: SortField, label: string) {
    return (
      <th
        className="p-3"
        aria-sort={
          primarySort?.field !== field
            ? undefined
            : primarySort.direction === 'asc'
              ? 'ascending'
              : 'descending'
        }
      >
        {label}
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

  async function toggleReviewed(bike: BikeAdminListItem) {
    setError(null);
    setLastTouchedId(bike.id);
    try {
      await setAdminBikeReviewed(bike.id, !bike.isReviewed);
      await load();
    } catch {
      setError('Unable to update reviewed state.');
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

  async function startCreateModel(mode: 'new' | 'edit' | 'clone' = 'new') {
    setError(null);
    const source =
      mode === 'new'
        ? undefined
        : models.find((model) => model.id === Number(targetModelId));
    setNewModel(
      source
        ? {
            brandId: String(source.brandId),
            categoryId: String(source.categoryId),
            name: mode === 'clone' ? `${source.name} (Copy)` : source.name,
          }
        : { brandId: '', categoryId: '', name: '' }
    );
    setModelFormMode(source ? mode : 'new');
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

  function closeImages() {
    void load();
    setImagesBike(null);
    void load();
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
        const request = {
          brandId: Number(newModel.brandId),
          categoryId: Number(newModel.categoryId),
          name: newModel.name.trim(),
        };
        targetModel =
          modelFormMode === 'edit'
            ? await updateBikeModel(Number(targetModelId), request)
            : await createBikeModel(request);
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
      onModelsChanged?.();
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
              <h3 className="text-base font-bold">Bike Variants</h3>
            ) : (
              <h1 className="mt-2 text-xl font-bold">Bike Variants</h1>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!embedded && modelId === undefined && (
              <a
                className="text-sm font-semibold text-brand-button underline"
                href="/admin/bulk-spec"
              >
                Bulk Edit
              </a>
            )}
            <IconButton
              icon="refresh"
              label="Refresh"
              onClick={() => void load()}
              disabled={loading}
            />
            <IconButton
              icon="add"
              label="Add variant"
              variant="primary"
              onClick={startCreate}
            />
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
        {!embedded && (
        <GridSidebar>
          <SidebarGroup
            title="Filters"
            action={
              <ClearFiltersButton
                disabled={
                  !search &&
                  !brandFilter &&
                  !modelFilter &&
                  !statusFilter &&
                  !imageFilter
                }
                onClick={() => {
                  setSearch('');
                  setBrandFilter('');
                  setModelFilter('');
                  setStatusFilter('');
                  setImageFilter('');
                }}
              />
            }
          >
            <label className="block text-sm font-semibold">
              Search
              <input
                className="mt-1 block w-full px-2 py-2 text-sm font-normal text-brand-black"
                placeholder="Search variants"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {showModel && (
              <SidebarSelect
                label="Brand"
                value={brandFilter}
                onChange={(value) => {
                  setBrandFilter(value);
                  setModelFilter('');
                }}
              >
                <option value="">All brands</option>
                {brandNames.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </SidebarSelect>
            )}
            {showModel && (
              <SidebarSelect
                label="Model"
                value={modelFilter}
                onChange={setModelFilter}
              >
                <option value="">All models</option>
                {filterModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.brandName} - {model.name}
                  </option>
                ))}
              </SidebarSelect>
            )}
            <SidebarSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </SidebarSelect>
            <SidebarSelect
              label="Images"
              value={imageFilter}
              onChange={setImageFilter}
            >
              <option value="">All bikes</option>
              <option value="has-images">Has images</option>
              <option value="no-images">No images</option>
            </SidebarSelect>
          </SidebarGroup>
          <SortGroup
            fields={sortFieldOptions}
            rules={sortRules}
            onChange={setSortRules}
          />
        </GridSidebar>
        )}
        {loading && bikes.length === 0 ? (
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
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  {sortHeader('year', 'Year')}
                  {sortHeader('brand', 'Brand')}
                  {sortHeader('variant', 'Variant')}
                  {sortHeader('model', 'Bike Model')}
                  {sortHeader('msrp', 'MSRP')}
                  {sortHeader('status', 'Status')}
                  {sortHeader('reviewed', 'Reviewed')}
                  <th className="p-2">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleBikes.map((bike) => (
                  <tr
                    className={`border-b border-black/10 ${bike.id === lastTouchedId ? 'bg-brand-button/10' : ''}`}
                    key={bike.id}
                    onClick={() => setLastTouchedId(bike.id)}
                  >
                    <td className="p-2">{bike.year}</td>
                    <td className="p-2">{bike.brandName}</td>
                    <td className="p-2 font-semibold">{bike.variantName}</td>
                    <td className="p-2">
                      <span className="inline-flex items-center gap-2">
                        {bike.modelName}
                        <button
                          type="button"
                          className="text-brand-button hover:opacity-70"
                          aria-label={`Reassign BikeModel for ${bike.brandName} - ${bike.variantName} (${bike.year})`}
                          title="Reassign BikeModel"
                          onClick={() => {
                            setLastTouchedId(bike.id);
                            startReassign(bike);
                          }}
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
                    <td className="p-2">
                      {bike.msrpPrice
                        ? `$${bike.msrpPrice.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={bike.isPublished}
                        aria-label={`Published status for ${bike.brandName} - ${bike.variantName} (${bike.year})`}
                        title={bike.isPublished ? 'Published - click to unpublish' : 'Not published - click to publish'}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bike.isPublished ? 'bg-green-600' : 'bg-black/20'}`}
                        onClick={() => {
                          setLastTouchedId(bike.id);
                          void togglePublish(bike);
                        }}
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${bike.isPublished ? 'translate-x-5' : 'translate-x-0.5'}`}
                        />
                      </button>
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={bike.isReviewed}
                        aria-label={`Specs reviewed for ${bike.brandName} - ${bike.variantName} (${bike.year})`}
                        title={bike.isReviewed ? 'Reviewed - click to unmark' : 'Not reviewed - click to mark reviewed'}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bike.isReviewed ? 'bg-green-600' : 'bg-black/20'}`}
                        onClick={() => void toggleReviewed(bike)}
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${bike.isReviewed ? 'translate-x-5' : 'translate-x-0.5'}`}
                        />
                      </button>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon="edit"
                          label="Edit"
                          onClick={() => {
                            setLastTouchedId(bike.id);
                            void startEdit(bike);
                          }}
                        />
                        <IconButton
                          icon="images"
                          label={
                            bike.imageCount > 0
                              ? `Images (${bike.imageCount})`
                              : 'Images'
                          }
                          variant={bike.imageCount > 0 ? 'success' : 'default'}
                          badge={bike.imageCount}
                          onClick={() => {
                            setLastTouchedId(bike.id);
                            setImagesBike(bike);
                          }}
                        />
                        <IconButton
                          icon="clone"
                          label="Clone"
                          onClick={() => {
                            setLastTouchedId(bike.id);
                            void startClone(bike);
                          }}
                        />
                        <IconButton
                          icon="delete"
                          label="Delete"
                          variant="danger"
                          onClick={() => {
                            setLastTouchedId(bike.id);
                            void remove(bike);
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
                  autoFocus
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
                className="mt-4 border-t border-black/10 pt-4"
                key={group.code}
              >
                <legend className="text-sm font-semibold uppercase tracking-wide text-brand-button">
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
      {imagesBike && (
        <Modal
          title={`Images - ${imagesBike.year} ${imagesBike.brandName} ${imagesBike.variantName}`}
          wide
          onClose={closeImages}
        >
          <BikeImageManagement bikeId={imagesBike.id} />
          <ModalFooter>
            <button
              className="border border-black/30 px-4 py-3 font-semibold"
              type="button"
              onClick={closeImages}
            >
              Close
            </button>
          </ModalFooter>
        </Modal>
      )}
      {reassignTargetBike && (
        <Modal
          title="Reassign Bike Model"
          error={error}
          onClose={closeReassign}
        >
          <form onSubmit={reassignModel}>
            <p className="mt-5 text-sm text-brand-grey">
              {reassignTargetBike.year} {reassignTargetBike.brandName} -{' '}
              {reassignTargetBike.variantName}
            </p>
            <p className="mt-2 text-sm text-brand-grey">
              Only the BikeModel assignment will change.
            </p>
            <div className="mt-5 flex items-center justify-between">
              <label
                className="block text-sm font-semibold"
                htmlFor="reassignBikeModel"
              >
                BikeModel
              </label>
              <div className="flex items-center">
                {!creatingModel && (
                  <>
                    <IconButton
                      icon="edit"
                      label="Edit selected BikeModel"
                      variant="gold"
                      disabled={reassigning || !targetModelId}
                      onClick={() => void startCreateModel('edit')}
                    />
                    <IconButton
                      icon="clone"
                      label="Clone selected BikeModel"
                      variant="gold"
                      disabled={reassigning || !targetModelId}
                      onClick={() => void startCreateModel('clone')}
                    />
                  </>
                )}
                <IconButton
                  icon={creatingModel ? 'list' : 'add'}
                  label={creatingModel ? 'Choose existing' : 'New BikeModel'}
                  variant="gold"
                  disabled={reassigning}
                  onClick={() =>
                    creatingModel
                      ? setCreatingModel(false)
                      : void startCreateModel()
                  }
                />
              </div>
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
                className="flex-1 border border-black/30 px-5 py-3 font-semibold disabled:opacity-50"
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
                    ? modelFormMode === 'edit'
                      ? 'Save & Reassign'
                      : 'Create & Reassign'
                    : 'Reassign'}
              </button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  );
}
