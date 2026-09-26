'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  AdminApiError,
  createAdminSpecDefinition,
  deleteAdminSpecDefinition,
  getAdminSpecDefinitions,
  reorderAdminSpecDefinitions,
  updateAdminSpecDefinition,
} from '@/lib/api';
import type { SpecDefinitionAdmin, SpecGroupAdmin } from '@/lib/types';

// Mirrors the ISpecFilterStrategy implementations currently registered in Program.cs;
// the API validates filterType dynamically against the actual registered set.
const FILTER_TYPES = ['range', 'exact', 'multiselect', 'boolean'];
const DATA_TYPES: SpecDefinitionAdmin['dataType'][] = [
  'number',
  'text',
  'boolean',
  'enum',
];

const emptyForm = {
  groupId: 0,
  code: '',
  label: '',
  dataType: 'text' as SpecDefinitionAdmin['dataType'],
  unit: '',
  isFilterable: false,
  filterType: '',
};

export default function SpecDefinitionManagement({
  groupId,
  groups,
  onDefinitionCountChanged,
}: {
  groupId: number;
  groups: SpecGroupAdmin[];
  onDefinitionCountChanged: () => void;
}) {
  const [definitions, setDefinitions] = useState<SpecDefinitionAdmin[]>([]);
  const [form, setForm] = useState({ ...emptyForm, groupId });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDefinitions(await getAdminSpecDefinitions(groupId));
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to load spec definitions.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [groupId]);

  function reset() {
    setForm({ ...emptyForm, groupId });
    setEditingId(null);
  }

  function edit(definition: SpecDefinitionAdmin) {
    setEditingId(definition.id);
    setForm({
      groupId: definition.groupId,
      code: definition.code,
      label: definition.label,
      dataType: definition.dataType,
      unit: definition.unit ?? '',
      isFilterable: definition.isFilterable,
      filterType: definition.filterType ?? '',
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const existing =
      editingId === null ? null : definitions.find((d) => d.id === editingId);
    if (existing && existing.code !== form.code) {
      const confirmed = window.confirm(
        `Renaming the code from "${existing.code}" to "${form.code}" will update this value on every bike that currently stores it. Continue?`
      );
      if (!confirmed) return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const request = {
        groupId: form.groupId,
        code: form.code,
        label: form.label,
        dataType: form.dataType,
        unit: form.unit || null,
        isFilterable: form.isFilterable,
        filterType: form.isFilterable ? form.filterType || null : null,
      };
      if (editingId === null) await createAdminSpecDefinition(request);
      else await updateAdminSpecDefinition(editingId, request);
      reset();
      await load();
      onDefinitionCountChanged();
    } catch (cause) {
      if (
        cause instanceof AdminApiError &&
        cause.details?.code === 'spec_definition_code_exists'
      )
        setError(`A spec definition with code "${form.code}" already exists.`);
      else if (
        cause instanceof AdminApiError &&
        cause.details?.code === 'spec_definition_datatype_incompatible'
      )
        setError(
          `${cause.details.affectedBikeCount ?? 'Some'} bike(s) have a value incompatible with the new data type. Fix or clear those values first.`
        );
      else
        setError(
          cause instanceof AdminApiError
            ? cause.message
            : 'Unable to save spec definition.'
        );
    } finally {
      setSubmitting(false);
    }
  }

  async function move(definition: SpecDefinitionAdmin, direction: -1 | 1) {
    const ordered = [...definitions].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((d) => d.id === definition.id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= ordered.length) return;
    [ordered[index], ordered[swapIndex]] = [ordered[swapIndex], ordered[index]];
    setError(null);
    try {
      setDefinitions(
        await reorderAdminSpecDefinitions(
          groupId,
          ordered.map((d) => d.id)
        )
      );
    } catch {
      setError('Unable to reorder spec definitions.');
    }
  }

  async function remove(definition: SpecDefinitionAdmin) {
    if (
      !window.confirm(`Delete spec "${definition.label}" (${definition.code})?`)
    )
      return;
    setError(null);
    try {
      await deleteAdminSpecDefinition(definition.id);
      await load();
      onDefinitionCountChanged();
    } catch (cause) {
      setError(
        cause instanceof AdminApiError &&
          cause.details?.code === 'spec_definition_referenced'
          ? `${cause.details.affectedBikeCount ?? 'Some'} bike(s) currently have a value for this spec and it cannot be deleted.`
          : 'Unable to delete spec definition.'
      );
    }
  }

  const ordered = [...definitions].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="bg-brand-content p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-button">
              Spec Definitions
            </p>
            <h2 className="text-xl font-bold">
              {groups.find((g) => g.id === groupId)?.name ?? 'Group'}
            </h2>
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
          <p className="mt-8 text-brand-grey">Loading spec definitions...</p>
        ) : ordered.length === 0 ? (
          <p className="mt-8 text-brand-grey">
            No spec definitions in this group yet.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[50rem] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="p-3">Order</th>
                  <th className="p-3">Code</th>
                  <th className="p-3">Label</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Bikes</th>
                  <th className="p-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((definition, index) => (
                  <tr className="border-b border-black/10" key={definition.id}>
                    <td className="p-3">
                      <button
                        className="mr-1 disabled:opacity-30"
                        disabled={index === 0}
                        onClick={() => void move(definition, -1)}
                        aria-label="Move up"
                      >
                        &uarr;
                      </button>
                      <button
                        className="disabled:opacity-30"
                        disabled={index === ordered.length - 1}
                        onClick={() => void move(definition, 1)}
                        aria-label="Move down"
                      >
                        &darr;
                      </button>
                    </td>
                    <td className="p-3 font-mono text-xs">{definition.code}</td>
                    <td className="p-3">
                      {definition.label}
                      {definition.unit ? ` (${definition.unit})` : ''}
                    </td>
                    <td className="p-3">
                      {definition.dataType}
                      {definition.isFilterable
                        ? ` / ${definition.filterType}`
                        : ''}
                    </td>
                    <td className="p-3">{definition.bikesWithValueCount}</td>
                    <td className="p-3 text-right">
                      <button
                        className="mr-3 font-semibold text-brand-button underline"
                        onClick={() => edit(definition)}
                      >
                        Edit
                      </button>
                      <button
                        className="font-semibold text-red-700 underline"
                        onClick={() => void remove(definition)}
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
          {editingId === null ? 'Add spec definition' : 'Edit spec definition'}
        </h2>

        <label className="mt-5 block text-sm font-semibold" htmlFor="defGroup">
          Group
        </label>
        <select
          className="mt-2 w-full px-3 py-2 text-brand-black"
          id="defGroup"
          value={form.groupId}
          onChange={(event) =>
            setForm({ ...form, groupId: Number(event.target.value) })
          }
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-sm font-semibold" htmlFor="defCode">
          Code
        </label>
        <input
          className="mt-2 w-full px-3 py-2 text-brand-black"
          id="defCode"
          required
          value={form.code}
          onChange={(event) => setForm({ ...form, code: event.target.value })}
          placeholder="cubic_centimeter"
        />

        <label className="mt-4 block text-sm font-semibold" htmlFor="defLabel">
          Label
        </label>
        <input
          className="mt-2 w-full px-3 py-2 text-brand-black"
          id="defLabel"
          required
          value={form.label}
          onChange={(event) => setForm({ ...form, label: event.target.value })}
          placeholder="Displacement"
        />

        <label
          className="mt-4 block text-sm font-semibold"
          htmlFor="defDataType"
        >
          Data type
        </label>
        <select
          className="mt-2 w-full px-3 py-2 text-brand-black"
          id="defDataType"
          value={form.dataType}
          onChange={(event) =>
            setForm({
              ...form,
              dataType: event.target.value as SpecDefinitionAdmin['dataType'],
            })
          }
        >
          {DATA_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-sm font-semibold" htmlFor="defUnit">
          Unit (optional)
        </label>
        <input
          className="mt-2 w-full px-3 py-2 text-brand-black"
          id="defUnit"
          value={form.unit}
          onChange={(event) => setForm({ ...form, unit: event.target.value })}
          placeholder="cc"
        />

        <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.isFilterable}
            onChange={(event) =>
              setForm({
                ...form,
                isFilterable: event.target.checked,
                filterType: event.target.checked ? form.filterType : '',
              })
            }
          />
          Filterable
        </label>

        {form.isFilterable && (
          <>
            <label
              className="mt-4 block text-sm font-semibold"
              htmlFor="defFilterType"
            >
              Filter type
            </label>
            <select
              className="mt-2 w-full px-3 py-2 text-brand-black"
              id="defFilterType"
              required
              value={form.filterType}
              onChange={(event) =>
                setForm({ ...form, filterType: event.target.value })
              }
            >
              <option value="">Select...</option>
              {FILTER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </>
        )}

        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 bg-brand-gold px-4 py-3 font-bold text-brand-black disabled:opacity-50"
            disabled={submitting}
          >
            {submitting
              ? 'Saving...'
              : editingId === null
                ? 'Add spec'
                : 'Save changes'}
          </button>
          {editingId !== null && (
            <button
              type="button"
              className="border border-white px-4 py-3 font-semibold"
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
