'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  AdminApiError,
  createAdminBike,
  deleteAdminBike,
  getAdminBike,
  getAdminBikes,
  getSpecGroups,
  publishAdminBike,
  unpublishAdminBike,
  updateAdminBike,
} from '@/lib/api';
import type { BikeAdminListItem } from '@/lib/types';
import BikeImageManagement from './BikeImageManagement';

type SpecGroup = Awaited<ReturnType<typeof getSpecGroups>>[number];

const emptyForm = {
  variantName: '',
  year: '',
  msrpPrice: '',
  specs: {} as Record<string, string>,
};

export default function BikeManagement({ modelId }: { modelId: number }) {
  const [bikes, setBikes] = useState<BikeAdminListItem[]>([]);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [bikeResult, specGroupResult] = await Promise.all([
        getAdminBikes(modelId),
        getSpecGroups(),
      ]);
      setBikes(bikeResult);
      setSpecGroups(specGroupResult);
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

  function reset() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function edit(bike: BikeAdminListItem) {
    setError(null);
    try {
      const detail = await getAdminBike(bike.id);
      const specs: Record<string, string> = {};
      for (const [code, value] of Object.entries(detail.specs))
        specs[code] =
          value === null || value === undefined ? '' : String(value);
      setEditingId(bike.id);
      setForm({
        variantName: detail.variantName,
        year: String(detail.year),
        msrpPrice: detail.msrpPrice ? String(detail.msrpPrice) : '',
        specs,
      });
    } catch {
      setError('Unable to load bike details for editing.');
    }
  }

  function buildSpecs(): Record<string, unknown> {
    const specs: Record<string, unknown> = {};
    for (const group of specGroups) {
      for (const def of group.definitions) {
        const raw = form.specs[def.code];
        if (raw === undefined || raw === '') continue;
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
        year: Number(form.year),
        msrpPrice: form.msrpPrice === '' ? null : Number(form.msrpPrice),
        specs: buildSpecs(),
      };
      if (editingId === null) await createAdminBike({ modelId, ...request });
      else await updateAdminBike(editingId, request);
      reset();
      await load();
    } catch (cause) {
      setError(
        cause instanceof AdminApiError ? cause.message : 'Unable to save bike.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublish(bike: BikeAdminListItem) {
    setError(null);
    try {
      if (bike.isPublished) await unpublishAdminBike(bike.id);
      else await publishAdminBike(bike.id);
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
    if (!window.confirm(`Delete ${bike.variantName} (${bike.year})?`)) return;
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

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="bg-brand-content p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <a
              className="text-sm font-semibold text-brand-button underline"
              href="/admin/bike-models"
            >
              ← BikeModels
            </a>
            <h1 className="mt-2 text-2xl font-bold">Bike Variants</h1>
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
        ) : bikes.length === 0 ? (
          <p className="mt-8 text-brand-grey">
            No bike variants have been added.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="p-3">Year</th>
                  <th className="p-3">Variant</th>
                  <th className="p-3">MSRP</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {bikes.map((bike) => (
                  <tr className="border-b border-black/10" key={bike.id}>
                    <td className="p-3">{bike.year}</td>
                    <td className="p-3 font-semibold">{bike.variantName}</td>
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
                    <td className="p-3 text-right">
                      <button
                        className="mr-3 font-semibold text-brand-button underline"
                        onClick={() => void edit(bike)}
                      >
                        Edit
                      </button>
                      <button
                        className="mr-3 font-semibold text-brand-button underline"
                        onClick={() => void togglePublish(bike)}
                      >
                        {bike.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        className="font-semibold text-red-700 underline"
                        onClick={() => void remove(bike)}
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
      </section>
      <form
        className="h-fit bg-brand-sidebar p-6 text-white shadow-lg"
        onSubmit={submit}
      >
        <h2 className="text-xl font-bold">
          {editingId === null ? 'Add Bike Variant' : 'Edit Bike Variant'}
        </h2>
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
          required
          value={form.year}
          onChange={(event) => setForm({ ...form, year: event.target.value })}
        />
        <label className="mt-4 block text-sm font-semibold" htmlFor="msrpPrice">
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
        <div className="mt-6 flex gap-3">
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
        {editingId !== null && <BikeImageManagement bikeId={editingId} />}
      </form>
    </div>
  );
}
