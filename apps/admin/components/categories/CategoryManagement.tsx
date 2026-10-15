import { FormEvent, useEffect, useState } from 'react';
import {
  AdminApiError,
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from '@/lib/api';
import type { CategoryAdmin } from '@/lib/types';

const emptyForm = { name: '' };

export default function CategoryManagement() {
  const [categories, setCategories] = useState<CategoryAdmin[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCategories() {
    setLoading(true);
    try {
      setCategories(await getAdminCategories());
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to load categories.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadCategories());
  }, []);

  function reset() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const request = { name: form.name };
    try {
      if (editingId === null) {
        await createAdminCategory(request);
      } else {
        await updateAdminCategory(editingId, request);
      }
      reset();
      await loadCategories();
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to save category.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(category: CategoryAdmin) {
    if (!window.confirm(`Delete category "${category.name}"?`)) {
      return;
    }
    setError(null);
    try {
      await deleteAdminCategory(category.id);
      if (editingId === category.id) {
        reset();
      }
      await loadCategories();
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to delete category.'
      );
    }
  }

  function startEdit(category: CategoryAdmin) {
    setEditingId(category.id);
    setForm({ name: category.name });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="bg-brand-content p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-button">
              Catalog
            </p>
            <h1 className="text-2xl font-bold">Categories</h1>
          </div>
          <button
            className="border border-brand-button px-3 py-2 text-sm font-semibold text-brand-button"
            onClick={() => void loadCategories()}
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
          <p className="mt-8 text-brand-grey">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="mt-8 text-brand-grey">
            No categories have been created.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="p-3">Name</th>
                  <th className="p-3">Models</th>
                  <th className="p-3">Bikes</th>
                  <th className="p-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr className="border-b border-black/10" key={category.id}>
                    <td className="p-3 font-semibold">{category.name}</td>
                    <td className="p-3">{category.modelCount}</td>
                    <td className="p-3">{category.bikeCount}</td>
                    <td className="space-x-4 p-3 text-right">
                      <button
                        className="font-semibold text-brand-button underline"
                        onClick={() => startEdit(category)}
                      >
                        Edit
                      </button>
                      <button
                        className="font-semibold text-red-700 underline"
                        onClick={() => void handleDelete(category)}
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
        onSubmit={handleSubmit}
      >
        <h2 className="text-xl font-bold">
          {editingId === null ? 'Add category' : 'Edit category'}
        </h2>
        <label
          className="mt-5 block text-sm font-semibold"
          htmlFor="categoryName"
        >
          Name
        </label>
        <input
          className="mt-2 w-full px-3 py-2 text-brand-black"
          id="categoryName"
          required
          maxLength={255}
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <button
          className="mt-6 w-full bg-brand-gold px-4 py-3 font-bold text-brand-black disabled:opacity-50"
          disabled={submitting}
        >
          {submitting
            ? 'Saving...'
            : editingId === null
              ? 'Add category'
              : 'Save changes'}
        </button>
        {editingId !== null && (
          <button
            className="mt-3 w-full border border-white px-4 py-2 font-semibold"
            type="button"
            onClick={reset}
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}
