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
  exportAdminBikes,
  getAdminBike,
  getAdminBikeSpecGrid,
  getAdminBikes,
  getBikeModels,
  getBrands,
  getCategories,
  getSpecGroups,
  importAdminBikes,
  publishAdminBike,
  reassignAdminBikeModel,
  unpublishAdminBike,
  updateAdminBike,
  updateAdminBikeSpecGrid,
} from '@/lib/api';
import type {
  BikeAdminListItem,
  BikeImportError,
  BikeModel,
  BikeSpecGridRow,
  LookupOption,
  ReviewStatus,
} from '@/lib/types';
import { reviewStatusOptions } from '@/lib/reviewStatus';
import { bikeModelLabel } from '@/lib/bikeModelLabel';
import { getBikeModelListSearch } from '@/lib/bikeModelListState';
import { SortGroup } from '@/components/GridSidebar';
import { compareText, sortRows, type SortRule } from '@/lib/multiSort';
import { AdminToolbar, AdminToolbarButton } from '@/components/AdminToolbar';
import BikeImageManagement from './BikeImageManagement';
import SpecGridModal from './SpecGridModal';

type SpecGroup = Awaited<ReturnType<typeof getSpecGroups>>[number];

const emptyForm = {
  modelId: '',
  variantName: '',
  year: '',
  msrpPrice: '',
  specs: {} as Record<string, string>,
  verifications: {} as Record<string, string>,
  sourceUrls: {} as Record<string, string>,
  savedVerificationCodes: [] as string[],
  resetVerifications: false,
  isTestData: false,
};

type SortField =
  | 'variant'
  | 'model'
  | 'brand'
  | 'year'
  | 'msrp'
  | 'status'
  | 'reviewed'
  | 'reviewCompleted';

const sortFieldOptions: { key: SortField; label: string }[] = [
  { key: 'year', label: 'Year' },
  { key: 'brand', label: 'Brand' },
  { key: 'variant', label: 'Variant' },
  { key: 'model', label: 'Bike Model' },
  { key: 'msrp', label: 'MSRP' },
  { key: 'status', label: 'Published' },
  { key: 'reviewed', label: 'Review status' },
  { key: 'reviewCompleted', label: 'Review completed' },
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
  const [resettingTags, setResettingTags] = useState(false);
  const [markingDisplayedInReview, setMarkingDisplayedInReview] = useState(false);
  const [openingGrid, setOpeningGrid] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [gridBikes, setGridBikes] = useState<BikeSpecGridRow[]>([]);
  const [gridOpen, setGridOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<BikeImportError[]>([]);
  const [reassigning, setReassigning] = useState(false);
  const [creatingModel, setCreatingModel] = useState(false);
  const [modelFormMode, setModelFormMode] = useState<'new' | 'edit' | 'clone'>('new');
  const [newModel, setNewModel] = useState({
    brandId: '',
    categoryId: '',
    name: '',
    isTestData: false,
  });
  const [brands, setBrands] = useState<LookupOption[]>([]);
  const [categories, setCategories] = useState<LookupOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modelFilter, setModelFilter] = useState(
    () =>
      (modelId === undefined &&
        new URLSearchParams(window.location.search).get('modelId')) ||
      ''
  );
  const [statusFilter, setStatusFilter] = useState('');
  const [testDataFilter, setTestDataFilter] = useState('');
  const [reviewFilter, setReviewFilter] = useState('');
  const [imageFilter, setImageFilter] = useState('');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(() =>
    window.matchMedia('(min-width: 768px)').matches
  );
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortRules, setSortRules] = useState<SortRule<SortField>[]>(
    modelId
      ? [{ field: 'year', direction: 'desc' }]
      : [{ field: 'variant', direction: 'asc' }]
  );
  const showModel = modelId === undefined;
  const modelBikeCounts = new Map(models.map((model) => [model.id, model.bikeCount]));
  const modelById = new Map(models.map((model) => [model.id, model]));
  const brandNames = [...new Set(models.map((model) => model.brandName))].sort(
    (a, b) => a.localeCompare(b)
  );
  const categoryNames = [...new Set(models.map((model) => model.categoryName))].sort(
    (a, b) => a.localeCompare(b)
  );
  const filterModels = models.filter(
    (model) =>
      (!brandFilter || model.brandName === brandFilter) &&
      (!categoryFilter || model.categoryName === categoryFilter)
  );
  const visibleBikes = sortRows(
    bikes.filter(
      (bike) =>
        (!brandFilter || bike.brandName === brandFilter) &&
        (!categoryFilter || modelById.get(bike.modelId)?.categoryName === categoryFilter) &&
        (!modelFilter || String(bike.modelId) === modelFilter) &&
        (!yearMin || bike.year >= Number(yearMin)) &&
        (!yearMax || bike.year <= Number(yearMax)) &&
        (!minPrice || bike.msrpPrice !== null && bike.msrpPrice >= Number(minPrice)) &&
        (!maxPrice || bike.msrpPrice !== null && bike.msrpPrice <= Number(maxPrice)) &&
        (!statusFilter ||
          (statusFilter === 'published') === bike.isPublished) &&
        (!testDataFilter ||
          (testDataFilter === 'test-data') ===
            (bike.isTestData || bike.modelIsTestData)) &&
        (!reviewFilter || bike.reviewStatus === reviewFilter) &&
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
      reviewed: (a, b) => reviewStatusOptions.findIndex((option) => option.value === a.reviewStatus) - reviewStatusOptions.findIndex((option) => option.value === b.reviewStatus),
      reviewCompleted: (a, b) =>
        (a.reviewCompletedAt ? Date.parse(a.reviewCompletedAt) : 0) -
        (b.reviewCompletedAt ? Date.parse(b.reviewCompletedAt) : 0),
    }
  );
  const primarySort = sortRules[0];
  const activeFilterCount = [
    search,
    brandFilter,
    categoryFilter,
    modelFilter,
    yearMin || yearMax,
    minPrice || maxPrice,
    statusFilter,
    testDataFilter,
    reviewFilter,
    imageFilter,
  ].filter(Boolean).length;

  function sortHeader(field: SortField, label: string) {
    return (
      <th
        className="p-2"
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

  function displayedGridOptions() {
    return {
      filters: { bikeIds: visibleBikes.map((bike) => bike.id) },
      sorts: [],
    };
  }

  async function openDisplayedGrid() {
    if (visibleBikes.length === 0) {
      return;
    }

    setOpeningGrid(true);
    setError(null);
    try {
      const options = displayedGridOptions();
      const rows = await getAdminBikeSpecGrid(options.filters, options.sorts);
      setGridBikes(rows);
      setGridOpen(true);
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to open the displayed motorcycles in the grid.'
      );
    } finally {
      setOpeningGrid(false);
    }
  }

  async function exportDisplayed() {
    if (visibleBikes.length === 0) {
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const options = displayedGridOptions();
      const blob = await exportAdminBikes(options.filters, options.sorts);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bikes-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to export the displayed motorcycles.'
      );
    } finally {
      setExporting(false);
    }
  }

  function closeImport() {
    if (importing) {
      return;
    }
    setImportOpen(false);
    setImportFile(null);
    setImportErrors([]);
  }

  async function importExcel() {
    if (!importFile) {
      return;
    }

    setImporting(true);
    setError(null);
    setNotice(null);
    setImportErrors([]);
    try {
      const result = await importAdminBikes(importFile);
      setImportOpen(false);
      setImportFile(null);
      setNotice(
        `Import complete: ${result.created} added, ${result.updated} updated, ${result.unchanged} unchanged.`
      );
      await load();
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.details?.errors?.length) {
        setImportErrors(cause.details.errors);
      } else {
        setImportErrors([
          {
            row: 0,
            column: 'File',
            message:
              cause instanceof AdminApiError
                ? cause.message
                : 'Unable to import the file.',
          },
        ]);
      }
    } finally {
      setImporting(false);
    }
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
      verifications: Object.fromEntries(
        Object.entries(detail.specVerifications).map(([code, value]) => [code, value.sourceUrl ?? ''])
      ),
      sourceUrls: Object.fromEntries(
        Object.entries(detail.specVerifications).map(([code, value]) => [code, value.sourceUrl ?? ''])
      ),
      savedVerificationCodes: Object.keys(detail.specVerifications),
      resetVerifications: false,
      isTestData: detail.isTestData,
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
      const loaded = await loadBikeForm(bike);
      setForm({ ...loaded, verifications: {}, sourceUrls: {}, savedVerificationCodes: [] });
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

  async function resetVisibleConfirmations() {
    const ids = visibleBikes.map((bike) => bike.id);
    if (ids.length === 0 || !window.confirm(
      `Reset spec verifications and Completed status for ${ids.length} displayed bike${ids.length === 1 ? '' : 's'}? This also removes stored source information and cannot be undone.`
    )) {
      return;
    }

    setResettingTags(true);
    setError(null);
    setNotice(null);
    try {
      await updateAdminBikeSpecGrid({ resetVerificationBikeIds: ids });
      await load();
      setNotice(`Reset spec verifications and Completed status for ${ids.length} displayed bike${ids.length === 1 ? '' : 's'}.`);
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : 'Unable to reset spec verifications.');
    } finally {
      setResettingTags(false);
    }
  }

  async function markDisplayedInReview() {
    const bikesToUpdate = visibleBikes.filter(
      (bike) => bike.reviewStatus !== 'inProgress'
    );
    if (
      bikesToUpdate.length === 0 ||
      !window.confirm(
        `Mark ${bikesToUpdate.length} displayed bike${bikesToUpdate.length === 1 ? '' : 's'} In Progress? Existing spec verifications will be kept.`
      )
    ) {
      return;
    }

    setMarkingDisplayedInReview(true);
    setError(null);
    setNotice(null);
    try {
      const result = await updateAdminBikeSpecGrid({
        reviewStatusChanges: bikesToUpdate.map((bike) => ({
          bikeId: bike.id,
          reviewStatus: 'inProgress',
        })),
      });
      await load();
      setNotice(
        `Marked ${result.updatedCount} displayed bike${result.updatedCount === 1 ? '' : 's'} In Progress.`
      );
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to mark displayed bikes In Progress.'
      );
    } finally {
      setMarkingDisplayedInReview(false);
    }
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
        isTestData: form.isTestData,
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
          resetVerifications: form.resetVerifications,
          verificationChanges: [...new Set([...form.savedVerificationCodes, ...Object.keys(form.verifications)])].map((specCode) => ({
            specCode,
            isVerified: Object.hasOwn(form.verifications, specCode),
            sourceUrl: form.verifications[specCode] || null,
          })),
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

  async function setReviewStatus(bike: BikeAdminListItem, reviewStatus: ReviewStatus) {
    setError(null);
    setLastTouchedId(bike.id);
    try {
      await updateAdminBikeSpecGrid({ reviewStatusChanges: [{ bikeId: bike.id, reviewStatus }] });
      await load();
    } catch {
      setError('Unable to update review status.');
    }
  }

  async function remove(bike: BikeAdminListItem) {
    if (
      !window.confirm(
        `Delete ${bike.variantName} (${bike.year})?`
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
            isTestData: mode === 'clone' ? false : source.isTestData,
          }
        : { brandId: '', categoryId: '', name: '', isTestData: false }
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
          isTestData: newModel.isTestData,
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
        `${reassignTargetBike.variantName} (${reassignTargetBike.year}) was reassigned to ${targetModel ? targetModel.name : 'the selected BikeModel'}.`
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

  const managementActions = (
    <AdminToolbar>
      {!embedded && modelId === undefined && (
        <>
          <AdminToolbarButton
            disabled={loading || openingGrid || visibleBikes.length === 0}
            onClick={() => void openDisplayedGrid()}
          >
            {openingGrid
              ? 'Opening...'
              : 'Edit All'}
          </AdminToolbarButton>
          <AdminToolbarButton
            disabled={loading || exporting || visibleBikes.length === 0}
            onClick={() => void exportDisplayed()}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </AdminToolbarButton>
          <AdminToolbarButton
            disabled={loading}
            onClick={() => {
              setError(null);
              setImportErrors([]);
              setImportOpen(true);
            }}
          >
            Import
          </AdminToolbarButton>
        </>
      )}
      <AdminToolbarButton
        disabled={
          loading ||
          resettingTags ||
          markingDisplayedInReview ||
          !visibleBikes.some((bike) => bike.reviewStatus !== 'inProgress')
        }
        onClick={() => void markDisplayedInReview()}
      >
        {markingDisplayedInReview
          ? 'Marking...'
          : "Set displayed to 'In Progress'"}
      </AdminToolbarButton>
      <AdminToolbarButton
        disabled={
          loading ||
          resettingTags ||
          markingDisplayedInReview ||
          visibleBikes.length === 0
        }
        onClick={() => void resetVisibleConfirmations()}
      >
        {resettingTags ? 'Resetting...' : "Set displayed to 'Draft'"}
      </AdminToolbarButton>
      <AdminToolbarButton disabled={loading} onClick={() => void load()}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </AdminToolbarButton>
      <AdminToolbarButton onClick={startCreate}>Add variant</AdminToolbarButton>
    </AdminToolbar>
  );

  return (
    <div>
      <section className="min-w-0 bg-brand-content p-4 shadow-lg sm:p-6">
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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
          {embedded && managementActions}
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
          <>
            <details
              className="mb-4 mt-6 border border-zinc-200 bg-zinc-50 p-4 text-sm"
              open={filtersOpen}
              onToggle={(event) => setFiltersOpen(event.currentTarget.open)}
            >
              <summary className="cursor-pointer font-semibold text-brand-button hover:underline">
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block text-sm font-semibold">
                  Search
                  <input
                    className="mt-1 block w-full border border-black/20 bg-white px-3 py-2 text-sm font-normal"
                    placeholder="Search variants"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                {showModel && (
                  <label className="block text-sm font-semibold">
                    Brand
                    <select
                      className="mt-1 block w-full border border-black/20 bg-white px-3 py-2 font-normal"
                      value={brandFilter}
                      onChange={(event) => {
                        setBrandFilter(event.target.value);
                        setModelFilter('');
                      }}
                    >
                      <option value="">All brands</option>
                      {brandNames.map((brand) => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </label>
                )}
                {showModel && (
                  <label className="block text-sm font-semibold">
                    Category
                    <select
                      className="mt-1 block w-full border border-black/20 bg-white px-3 py-2 font-normal"
                      value={categoryFilter}
                      onChange={(event) => {
                        setCategoryFilter(event.target.value);
                        setModelFilter('');
                      }}
                    >
                      <option value="">All categories</option>
                      {categoryNames.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                )}
                {showModel && (
                  <label className="block text-sm font-semibold">
                    Model
                    <select
                      className="mt-1 block w-full border border-black/20 bg-white px-3 py-2 font-normal"
                      value={modelFilter}
                      onChange={(event) => setModelFilter(event.target.value)}
                    >
                      <option value="">All models</option>
                      {filterModels.map((model) => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="block text-sm font-semibold">
                  Year from
                  <input className="mt-1 w-full border border-black/20 bg-white px-3 py-2 font-normal" min="1" step="1" type="number" value={yearMin} onChange={(event) => setYearMin(event.target.value)} />
                </label>
                <label className="block text-sm font-semibold">
                  Year to
                  <input className="mt-1 w-full border border-black/20 bg-white px-3 py-2 font-normal" min="1" step="1" type="number" value={yearMax} onChange={(event) => setYearMax(event.target.value)} />
                </label>
                <label className="block text-sm font-semibold">
                  Minimum price ($)
                  <input className="mt-1 w-full border border-black/20 bg-white px-3 py-2 font-normal" min="0" step="0.01" type="number" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} />
                </label>
                <label className="block text-sm font-semibold">
                  Maximum price ($)
                  <input className="mt-1 w-full border border-black/20 bg-white px-3 py-2 font-normal" min="0" step="0.01" type="number" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} />
                </label>
                <label className="block text-sm font-semibold">
                  Published
                  <select className="mt-1 block w-full border border-black/20 bg-white px-3 py-2 font-normal" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="">All publication states</option>
                    <option value="published">Published</option>
                    <option value="unpublished">Unpublished</option>
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Data
                  <select
                    className="mt-1 block w-full border border-black/20 bg-white px-3 py-2 font-normal"
                    value={testDataFilter}
                    onChange={(event) => setTestDataFilter(event.target.value)}
                  >
                    <option value="">All data</option>
                    <option value="production">Production data</option>
                    <option value="test-data">Test data</option>
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Review status
                  <select className="mt-1 block w-full border border-black/20 bg-white px-3 py-2 font-normal" value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value)}>
                    <option value="">All review statuses</option>
                    {reviewStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Images
                  <select className="mt-1 block w-full border border-black/20 bg-white px-3 py-2 font-normal" value={imageFilter} onChange={(event) => setImageFilter(event.target.value)}>
                    <option value="">All bikes</option>
                    <option value="has-images">Has images</option>
                    <option value="no-images">No images</option>
                  </select>
                </label>
              </div>
              <p className="mt-3 text-xs text-brand-grey">Range filters exclude motorcycles with missing values.</p>
              <button
                className="mt-3 text-sm font-semibold text-brand-button underline disabled:opacity-40 disabled:no-underline"
                disabled={activeFilterCount === 0}
                type="button"
                onClick={() => {
                  setSearch('');
                  setBrandFilter('');
                  setCategoryFilter('');
                  setModelFilter('');
                  setYearMin('');
                  setYearMax('');
                  setMinPrice('');
                  setMaxPrice('');
                  setStatusFilter('');
                  setTestDataFilter('');
                  setReviewFilter('');
                  setImageFilter('');
                }}
              >
                Clear filters
              </button>
            </details>
            <SortGroup
              fields={sortFieldOptions}
              defaultInlineOpen={window.matchMedia('(min-width: 768px)').matches}
              inline
              rules={sortRules}
              onChange={setSortRules}
            />
            <div className="mt-4">{managementActions}</div>
          </>
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
          <div className="mt-6 max-w-full overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  {sortHeader('year', 'Year')}
                  {sortHeader('brand', 'Brand')}
                  {sortHeader('variant', 'Variant')}
                  {sortHeader('model', 'Bike Model')}
                  {sortHeader('msrp', 'MSRP')}
                  {sortHeader('status', 'Published')}
                  <th className="p-2">In Progress</th>
                  {sortHeader('reviewed', 'Review status')}
                  <th className="p-2">Data</th>
                  <th className="relative p-2">
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
                        {bikeModelLabel(bike.modelName, modelBikeCounts.get(bike.modelId))}
                        <button
                          type="button"
                          className="text-brand-button hover:opacity-70"
                          aria-label={`Reassign BikeModel for ${bike.variantName} (${bike.year})`}
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
                      <input
                        type="checkbox"
                        checked={bike.isPublished}
                        aria-label={`Published status for ${bike.variantName} (${bike.year})`}
                        title={bike.isPublished ? 'Published - click to unpublish' : 'Not published - click to publish'}
                        className="h-4 w-4 accent-brand-gold"
                        onChange={() => {
                          setLastTouchedId(bike.id);
                          void togglePublish(bike);
                        }}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={bike.reviewStatus === 'inProgress'}
                        aria-label={`In Progress status for ${bike.variantName} (${bike.year})`}
                        title={
                          bike.reviewStatus === 'inProgress'
                            ? 'In Progress - uncheck to return to Draft'
                            : 'Not in progress - check to set In Progress'
                        }
                        className="h-4 w-4 accent-brand-gold"
                        onChange={(event) => {
                          void setReviewStatus(
                            bike,
                            event.target.checked ? 'inProgress' : 'draft'
                          );
                        }}
                      />
                    </td>
                    <td className="p-2">
                      <select
                        className="border border-black/20 px-2 py-1"
                        value={bike.reviewStatus}
                        aria-label={`Review status for ${bike.variantName} (${bike.year})`}
                        onChange={(event) => void setReviewStatus(bike, event.target.value as ReviewStatus)}
                      >
                        {reviewStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      {(bike.isTestData || bike.modelIsTestData) && (
                        <span className="border border-amber-700 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
                          {bike.modelIsTestData ? 'Test model' : 'Test data'}
                        </span>
                      )}
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
                    setForm({ ...form, modelId: event.target.value, verifications: {}, sourceUrls: {} })
                  }
                >
                  {editingId === null && (
                    <option value="">Select a model</option>
                  )}
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
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
                setForm({ ...form, variantName: event.target.value, verifications: {}, sourceUrls: {} })
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
                setForm({ ...form, year: event.target.value, verifications: {}, sourceUrls: {} })
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
            <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.isTestData}
                className="h-4 w-4 accent-brand-gold"
                onChange={(event) =>
                  setForm({ ...form, isTestData: event.target.checked })
                }
              />
              Test data
            </label>
            <p className="mt-1 text-xs text-brand-grey">
              Tagged variants are hidden from the public catalog.
            </p>
            {editingId !== null && (
              <div className="mt-4">
                <p className="text-sm text-brand-grey">
                  Changing a spec clears its verification. Changing the model, variant, or year clears all verifications.
                  Check a spec again to verify the new value. Completed is set automatically when all populated specs are verified.
                </p>
                <p className="mt-1 text-sm text-brand-grey">
                  {Object.keys(form.verifications).length} of {Object.values(form.specs).filter((value) => value.trim()).length} populated specs verified
                </p>
                <button
                  type="button"
                  className="mt-2 border border-black/30 px-3 py-2 text-sm font-semibold disabled:opacity-50"
                  disabled={submitting || (form.resetVerifications && Object.keys(form.verifications).length === 0)}
                  onClick={() => {
                    if (window.confirm('Reset spec verifications and Completed status for this bike? This also removes stored source information. Save changes to apply.')) {
                      setForm({ ...form, verifications: {}, sourceUrls: {}, resetVerifications: true });
                    }
                  }}
                >
                  Reset review
                </button>
              </div>
            )}
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
                        onChange={(event) => {
                          const verifications = { ...form.verifications };
                          const sourceUrls = { ...form.sourceUrls };
                          delete verifications[def.code];
                          delete sourceUrls[def.code];
                          setForm({ ...form, specs: { ...form.specs, [def.code]: event.target.value }, verifications, sourceUrls });
                        }}
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
                        onChange={(event) => {
                          const verifications = { ...form.verifications };
                          const sourceUrls = { ...form.sourceUrls };
                          delete verifications[def.code];
                          delete sourceUrls[def.code];
                          setForm({ ...form, specs: { ...form.specs, [def.code]: event.target.value }, verifications, sourceUrls });
                        }}
                      />
                    )}
                    {editingId !== null && (
                      <div className="mt-2">
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            aria-label={`Verified ${def.label} from official brand source`}
                            checked={Object.hasOwn(form.verifications, def.code)}
                            disabled={!form.specs[def.code]?.trim() || submitting}
                            onChange={(event) => {
                              const verifications = { ...form.verifications };
                              if (event.target.checked) {
                                verifications[def.code] = form.sourceUrls[def.code] ?? '';
                              } else {
                                delete verifications[def.code];
                              }
                              setForm({ ...form, verifications });
                            }}
                          />
                          Verified from official brand source
                        </label>
                      </div>
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
      {gridOpen && (
        <SpecGridModal
          title={`Edit displayed motorcycles (${gridBikes.length})`}
          bikes={gridBikes}
          specGroups={specGroups}
          onClose={() => {
            setGridOpen(false);
            setGridBikes([]);
            void load();
          }}
        />
      )}
      {importOpen && (
        <Modal title="Import motorcycles from Excel" error={error} onClose={closeImport}>
          <p className="mt-4 text-sm text-brand-grey">
            Upload an exported .xlsx file. Rows with an Id update that
            motorcycle; rows without an Id add a new unpublished motorcycle.
            If any row is invalid, nothing is saved.
          </p>
          <label className="mt-4 block text-sm font-semibold" htmlFor="bike-import-file">
            Excel file (.xlsx)
          </label>
          <input
            accept=".xlsx"
            className="mt-2 block w-full text-sm"
            id="bike-import-file"
            type="file"
            onChange={(event) => {
              setImportFile(event.target.files?.[0] ?? null);
              setImportErrors([]);
            }}
          />
          {importErrors.length > 0 && (
            <div
              className="mt-4 border-l-4 border-red-700 bg-red-50 p-3 text-sm text-red-800"
              role="alert"
            >
              <p className="font-semibold">
                Import rejected: {importErrors.length} problem
                {importErrors.length === 1 ? '' : 's'} found. Nothing was saved.
              </p>
              <ul className="mt-2 list-disc pl-5">
                {importErrors.map((item, index) => (
                  <li key={index}>
                    {item.row > 0 ? `Row ${item.row}` : 'File'} · {item.column}:{' '}
                    {item.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ModalFooter>
            <button
              type="button"
              className="border border-black/30 px-4 py-2 font-semibold"
              disabled={importing}
              onClick={closeImport}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bg-brand-button px-4 py-2 font-semibold text-white disabled:opacity-50"
              disabled={!importFile || importing}
              onClick={() => void importExcel()}
            >
              {importing ? 'Importing...' : 'Import'}
            </button>
          </ModalFooter>
        </Modal>
      )}
      {imagesBike && (
        <Modal
          title={`Images - ${imagesBike.year} ${imagesBike.variantName}`}
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
              {reassignTargetBike.year} {reassignTargetBike.variantName}
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
                      disabled={reassigning || !targetModelId}
                      onClick={() => void startCreateModel('edit')}
                    />
                    <IconButton
                      icon="clone"
                      label="Clone selected BikeModel"
                      disabled={reassigning || !targetModelId}
                      onClick={() => void startCreateModel('clone')}
                    />
                  </>
                )}
                <IconButton
                  icon={creatingModel ? 'list' : 'add'}
                  label={creatingModel ? 'Choose existing' : 'New BikeModel'}
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
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={newModel.isTestData}
                    className="h-4 w-4 accent-brand-gold"
                    disabled={reassigning}
                    onChange={(e) =>
                      setNewModel({ ...newModel, isTestData: e.target.checked })
                    }
                  />
                  Test data
                </label>
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
                    {model.name} ({model.categoryName})
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
