'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  AdminApiError,
  exportAdminBikes,
  getAdminBikeSpecGrid,
  getBrands,
  getCategories,
  getSpecGroups,
  importAdminBikes,
} from '@/lib/api';
import type { BikeImportError, BikeSpecGridRow, LookupOption } from '@/lib/types';
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
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [importErrors, setImportErrors] = useState<BikeImportError[]>([]);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getBrands(), getCategories(), getSpecGroups()])
      .then(([brandResult, categoryResult, groupResult]) => {
        setBrands(brandResult);
        setCategories(categoryResult);
        setSpecGroups(groupResult);
      })
      .catch(() => setError('Unable to load filter options.'));
  }, []);

  function currentFilters() {
    return {
      brandId: brandId ? Number(brandId) : undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      minPrice: minPrice === '' ? undefined : Number(minPrice),
      maxPrice: maxPrice === '' ? undefined : Number(maxPrice),
    };
  }

  async function exportExcel() {
    setExporting(true);
    setError(null);
    try {
      const blob = await exportAdminBikes(currentFilters());
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
          : 'Unable to export motorcycles.'
      );
    } finally {
      setExporting(false);
    }
  }

  async function importExcel() {
    if (!importFile) {
      return;
    }
    setImporting(true);
    setImportErrors([]);
    setImportMessage(null);
    try {
      const result = await importAdminBikes(importFile);
      setImportMessage(
        `Import complete: ${result.created} added, ${result.updated} updated, ${result.unchanged} unchanged.`
      );
      setImportFile(null);
      setFileKey((key) => key + 1);
      setBikes([]);
      setLoaded(false);
      setModalOpen(false);
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

  async function load(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminBikeSpecGrid(currentFilters());
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
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Bulk Spec Edit</h1>
        <a
          className="text-sm font-semibold text-brand-button underline"
          href="/admin/bike-variants"
        >
          Single Edit
        </a>
      </div>
      <p className="mt-1 text-sm text-brand-grey">
        Filter motorcycles, then edit their specifications in an on-screen grid
        or export them to Excel.
      </p>
      <form
        className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
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
        <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-4">
          <button
            className="bg-brand-button px-5 py-2 font-semibold text-white disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Opening...' : 'Edit in grid'}
          </button>
          <button
            className="bg-brand-button px-5 py-2 font-semibold text-white disabled:opacity-50"
            type="button"
            disabled={exporting}
            onClick={() => void exportExcel()}
          >
            {exporting ? 'Exporting...' : 'Export to Excel'}
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

      <div className="mt-8 border-t border-black/10 pt-6">
        <h2 className="text-base font-bold">Import from Excel</h2>
        <p className="mt-1 text-sm text-brand-grey">
          Edit an exported file in Excel, then import it here. Rows with an Id
          update that bike; rows with a blank Id are added as new unpublished
          bikes. If any row is invalid, nothing is saved.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-semibold" htmlFor="bulk-file">
              Excel file (.xlsx)
            </label>
            <input
              accept=".xlsx"
              className="mt-1 block text-sm"
              id="bulk-file"
              key={fileKey}
              type="file"
              onChange={(e) => {
                setImportFile(e.target.files?.[0] ?? null);
                setImportErrors([]);
                setImportMessage(null);
              }}
            />
          </div>
          <button
            className="bg-brand-button px-5 py-2 font-semibold text-white disabled:opacity-50"
            type="button"
            disabled={!importFile || importing}
            onClick={() => void importExcel()}
          >
            {importing ? 'Importing...' : 'Import from Excel'}
          </button>
        </div>
        {importMessage && (
          <p
            className="mt-4 border-l-4 border-green-700 bg-green-50 p-3 text-sm text-green-800"
            role="status"
          >
            {importMessage}
          </p>
        )}
        {importErrors.length > 0 && (
          <div
            className="mt-4 border-l-4 border-red-700 bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            <p className="font-semibold">
              Import rejected: {importErrors.length} problem
              {importErrors.length === 1 ? '' : 's'} found. Nothing was saved.
            </p>
            <ul className="mt-2 max-h-64 list-disc overflow-y-auto pl-5">
              {importErrors.map((item, index) => (
                <li key={index}>
                  {item.row > 0 ? `Row ${item.row}` : 'File'} · {item.column}:{' '}
                  {item.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

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
