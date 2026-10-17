import { FormEvent, useCallback, useEffect, useState } from 'react';
import { IconButton } from '@/components/IconButton';
import Modal, { ModalFooter } from '@/components/Modal';
import {
  AdminApiError,
  createAdminBrand,
  deleteAdminBrand,
  getAdminBrands,
  updateAdminBrand,
} from '@/lib/api';
import type { BrandAdmin } from '@/lib/types';

const emptyForm = { name: '', logoBlobUrl: '' };

export default function BrandManagement() {
  const [brands, setBrands] = useState<BrandAdmin[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastTouchedId, setLastTouchedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBrands() {
    setLoading(true);
    try {
      setBrands(await getAdminBrands());
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to load brands.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadBrands());
  }, []);

  const reset = useCallback(() => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(false);
  }, []);

  function startCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const request = {
      name: form.name,
      logoBlobUrl: form.logoBlobUrl.trim() || null,
    };
    try {
      if (editingId === null) {
        await createAdminBrand(request);
      } else {
        await updateAdminBrand(editingId, request);
      }
      reset();
      await loadBrands();
    } catch (cause) {
      setError(
        cause instanceof AdminApiError ? cause.message : 'Unable to save brand.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(brand: BrandAdmin) {
    if (!window.confirm(`Delete brand "${brand.name}"?`)) {
      return;
    }
    setError(null);
    try {
      await deleteAdminBrand(brand.id);
      if (editingId === brand.id) {
        reset();
      }
      await loadBrands();
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to delete brand.'
      );
    }
  }

  function startEdit(brand: BrandAdmin) {
    setEditingId(brand.id);
    setForm({ name: brand.name, logoBlobUrl: brand.logoBlobUrl ?? '' });
    setModalOpen(true);
  }

  function startClone(brand: BrandAdmin) {
    setEditingId(null);
    setForm({ name: brand.name, logoBlobUrl: brand.logoBlobUrl ?? '' });
    setError(null);
    setModalOpen(true);
  }

  return (
    <div>
      <section className="bg-brand-content p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-button">
              Catalog
            </p>
            <h1 className="text-2xl font-bold">Brands</h1>
          </div>
          <div className="flex gap-3">
            <button
              className="border border-brand-button px-3 py-2 text-sm font-semibold text-brand-button"
              onClick={() => void loadBrands()}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              className="bg-brand-gold px-3 py-2 text-sm font-bold text-brand-black"
              onClick={startCreate}
            >
              Add brand
            </button>
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
        {loading ? (
          <p className="mt-8 text-brand-grey">Loading brands...</p>
        ) : brands.length === 0 ? (
          <p className="mt-8 text-brand-grey">No brands have been created.</p>
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
                {brands.map((brand) => (
                  <tr
                    className={`border-b border-black/10 ${lastTouchedId === brand.id ? 'bg-brand-button/10' : ''}`}
                    key={brand.id}
                  >
                    <td className="p-3 font-semibold">{brand.name}</td>
                    <td className="p-3">{brand.modelCount}</td>
                    <td className="p-3">{brand.bikeCount}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon="edit"
                          label="Edit"
                          onClick={() => {
                            setLastTouchedId(brand.id);
                            startEdit(brand);
                          }}
                        />
                        <IconButton
                          icon="clone"
                          label="Clone"
                          onClick={() => {
                            setLastTouchedId(brand.id);
                            startClone(brand);
                          }}
                        />
                        <IconButton
                          icon="delete"
                          label="Delete"
                          variant="danger"
                          onClick={() => {
                            setLastTouchedId(brand.id);
                            void handleDelete(brand);
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
          title={editingId === null ? 'Add brand' : 'Edit brand'}
          error={error}
          onClose={reset}
        >
          <form onSubmit={handleSubmit}>
            <label
              className="mt-5 block text-sm font-semibold"
              htmlFor="brandName"
            >
              Name
            </label>
            <input
              className="mt-2 w-full px-3 py-2 text-brand-black"
              id="brandName"
              required
              maxLength={255}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
            <label
              className="mt-4 block text-sm font-semibold"
              htmlFor="brandLogo"
            >
              Logo URL (optional)
            </label>
            <input
              className="mt-2 w-full px-3 py-2 text-brand-black"
              id="brandLogo"
              type="url"
              maxLength={2048}
              value={form.logoBlobUrl}
              onChange={(event) =>
                setForm({ ...form, logoBlobUrl: event.target.value })
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
                    ? 'Add brand'
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
          </form>
        </Modal>
      )}
    </div>
  );
}
