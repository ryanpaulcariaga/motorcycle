'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  AdminApiError,
  createAdminSpecGroup,
  deleteAdminSpecGroup,
  getAdminSpecGroups,
  reorderAdminSpecGroups,
  updateAdminSpecGroup,
} from '@/lib/api';
import type { SpecGroupAdmin } from '@/lib/types';
import SpecDefinitionManagement from './SpecDefinitionManagement';

const emptyForm = { code: '', name: '', iconName: '' };

export default function SpecGroupManagement() {
  const [groups, setGroups] = useState<SpecGroupAdmin[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminSpecGroups();
      setGroups(result);
      if (selectedGroupId === null && result.length > 0)
        setSelectedGroupId(result[0].id);
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to load spec groups.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void load());
  }, []);

  function reset() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function edit(group: SpecGroupAdmin) {
    setEditingId(group.id);
    setForm({
      code: group.code,
      name: group.name,
      iconName: group.iconName ?? '',
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const request = {
        code: form.code,
        name: form.name,
        iconName: form.iconName || null,
      };
      if (editingId === null) await createAdminSpecGroup(request);
      else await updateAdminSpecGroup(editingId, request);
      reset();
      await load();
    } catch (cause) {
      setError(
        cause instanceof AdminApiError &&
          cause.details?.code === 'spec_group_code_exists'
          ? `A group with code "${form.code}" already exists.`
          : cause instanceof AdminApiError
            ? cause.message
            : 'Unable to save spec group.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function move(group: SpecGroupAdmin, direction: -1 | 1) {
    const ordered = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((g) => g.id === group.id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= ordered.length) return;
    [ordered[index], ordered[swapIndex]] = [ordered[swapIndex], ordered[index]];
    setError(null);
    try {
      const result = await reorderAdminSpecGroups(ordered.map((g) => g.id));
      setGroups(result);
    } catch {
      setError('Unable to reorder spec groups.');
    }
  }

  async function remove(group: SpecGroupAdmin) {
    if (
      !window.confirm(
        `Delete group "${group.name}"? It must have no spec definitions.`
      )
    )
      return;
    setError(null);
    try {
      await deleteAdminSpecGroup(group.id);
      if (selectedGroupId === group.id) setSelectedGroupId(null);
      await load();
    } catch (cause) {
      setError(
        cause instanceof AdminApiError &&
          cause.details?.code === 'spec_group_referenced'
          ? `This group still has ${cause.details.dependentCount ?? 'some'} spec definition(s) and cannot be deleted.`
          : 'Unable to delete spec group.'
      );
    }
  }

  const orderedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="bg-brand-content p-6 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-button">
                Catalog
              </p>
              <h1 className="text-2xl font-bold">Specifications</h1>
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
            <p className="mt-8 text-brand-grey">Loading spec groups...</p>
          ) : orderedGroups.length === 0 ? (
            <p className="mt-8 text-brand-grey">
              No spec groups have been created yet.
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[42rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="p-3">Order</th>
                    <th className="p-3">Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Definitions</th>
                    <th className="p-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderedGroups.map((group, index) => (
                    <tr
                      className={`border-b border-black/10 ${selectedGroupId === group.id ? 'bg-brand-gold/10' : ''}`}
                      key={group.id}
                    >
                      <td className="p-3">
                        <button
                          className="mr-1 disabled:opacity-30"
                          disabled={index === 0}
                          onClick={() => void move(group, -1)}
                          aria-label="Move up"
                        >
                          &uarr;
                        </button>
                        <button
                          className="disabled:opacity-30"
                          disabled={index === orderedGroups.length - 1}
                          onClick={() => void move(group, 1)}
                          aria-label="Move down"
                        >
                          &darr;
                        </button>
                      </td>
                      <td className="p-3 font-mono text-xs">{group.code}</td>
                      <td className="p-3">
                        <button
                          className="font-semibold text-brand-button underline"
                          onClick={() => setSelectedGroupId(group.id)}
                        >
                          {group.name}
                        </button>
                      </td>
                      <td className="p-3">{group.definitionCount}</td>
                      <td className="p-3 text-right">
                        <button
                          className="mr-3 font-semibold text-brand-button underline"
                          onClick={() => edit(group)}
                        >
                          Edit
                        </button>
                        <button
                          className="font-semibold text-red-700 underline"
                          onClick={() => void remove(group)}
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
            {editingId === null ? 'Add spec group' : 'Edit spec group'}
          </h2>
          <label
            className="mt-5 block text-sm font-semibold"
            htmlFor="groupCode"
          >
            Code
          </label>
          <input
            className="mt-2 w-full px-3 py-2 text-brand-black"
            id="groupCode"
            required
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
            placeholder="engine"
          />
          <label
            className="mt-4 block text-sm font-semibold"
            htmlFor="groupName"
          >
            Name
          </label>
          <input
            className="mt-2 w-full px-3 py-2 text-brand-black"
            id="groupName"
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Engine"
          />
          <label
            className="mt-4 block text-sm font-semibold"
            htmlFor="groupIcon"
          >
            Icon name (optional)
          </label>
          <input
            className="mt-2 w-full px-3 py-2 text-brand-black"
            id="groupIcon"
            value={form.iconName}
            onChange={(event) =>
              setForm({ ...form, iconName: event.target.value })
            }
          />
          <div className="mt-6 flex gap-3">
            {' '}
            <button
              className="flex-1 bg-brand-gold px-4 py-3 font-bold text-brand-black disabled:opacity-50"
              disabled={submitting}
            >
              {submitting
                ? 'Saving...'
                : editingId === null
                  ? 'Add group'
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

      {selectedGroupId !== null && (
        <SpecDefinitionManagement
          groupId={selectedGroupId}
          groups={orderedGroups}
          onDefinitionCountChanged={() => void load()}
        />
      )}
    </div>
  );
}
