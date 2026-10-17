'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { IconButton } from '@/components/IconButton';
import Modal, { ModalFooter } from '@/components/Modal';
import {
  createAdminRole,
  deleteAdminRole,
  getAdminRoles,
  updateAdminRole,
  AdminApiError,
} from '@/lib/api';
import type { AdminRole } from '@/lib/types';

const emptyForm = {
  facebookUserId: '',
  emailSnapshot: '',
  displayNameSnapshot: '',
};

export default function RoleManagement() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastTouchedId, setLastTouchedId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadRoles() {
    setLoading(true);
    setError(null);
    try {
      setRoles(await getAdminRoles());
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to load administrator roles.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadRoles());
  }, []);

  const closeModal = useCallback(() => {
    setForm(emptyForm);
    setEditingRole(null);
    setModalOpen(false);
  }, []);

  function startEdit(role: AdminRole) {
    setEditingRole(role);
    setForm({
      facebookUserId: role.facebookUserId,
      emailSnapshot: role.emailSnapshot ?? '',
      displayNameSnapshot: role.displayNameSnapshot ?? '',
    });
    setError(null);
    setModalOpen(true);
  }

  function startClone(role: AdminRole) {
    setEditingRole(null);
    setForm({
      facebookUserId: '',
      emailSnapshot: role.emailSnapshot ?? '',
      displayNameSnapshot: role.displayNameSnapshot ?? '',
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingRole) {
        await updateAdminRole(editingRole.id, {
          emailSnapshot: form.emailSnapshot,
          displayNameSnapshot: form.displayNameSnapshot,
          role: 'Administrator',
          isActive: editingRole.isActive,
        });
      } else {
        await createAdminRole({ ...form, role: 'Administrator' });
      }
      closeModal();
      await loadRoles();
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : editingRole
            ? 'Unable to update administrator.'
            : 'Unable to provision administrator.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleRole(role: AdminRole) {
    setError(null);
    try {
      const updated = await updateAdminRole(role.id, {
        emailSnapshot: role.emailSnapshot ?? '',
        displayNameSnapshot: role.displayNameSnapshot ?? '',
        role: 'Administrator',
        isActive: !role.isActive,
      });
      setRoles((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to update administrator.'
      );
    }
  }

  async function removeRole(role: AdminRole) {
    const identity = role.displayNameSnapshot || role.facebookUserId;
    if (
      !window.confirm(
        `Permanently delete administrator "${identity}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(role.id);
    setError(null);
    try {
      await deleteAdminRole(role.id);
      setRoles((current) => current.filter((item) => item.id !== role.id));
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to delete administrator.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <section className="bg-brand-content p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-button">
              Access
            </p>
            <h1 className="text-2xl font-bold">Administrators</h1>
          </div>
          <div className="flex gap-3">
            <button
              className="border border-brand-button px-3 py-2 text-sm font-semibold text-brand-button"
              onClick={() => void loadRoles()}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              className="bg-brand-gold px-3 py-2 text-sm font-bold text-brand-black"
              onClick={() => setModalOpen(true)}
            >
              Provision administrator
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
          <p className="mt-8 text-brand-grey">Loading administrator roles...</p>
        ) : roles.length === 0 ? (
          <p className="mt-8 text-brand-grey">
            No administrator roles have been provisioned.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="p-3">Identity</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr
                    className={`border-b border-black/10 ${lastTouchedId === role.id ? 'bg-brand-button/10' : ''}`}
                    key={role.id}
                  >
                    <td className="p-3">
                      <div className="font-semibold">{role.facebookUserId}</div>
                      <div className="text-brand-grey">
                        {role.emailSnapshot ?? 'No email snapshot'}
                      </div>
                    </td>
                    <td className="p-3">
                      {role.displayNameSnapshot ?? 'No display name'}
                    </td>
                    <td className="p-3">
                      {role.isActive ? 'Active' : 'Inactive'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon="edit"
                          label="Edit"
                          onClick={() => {
                            setLastTouchedId(role.id);
                            startEdit(role);
                          }}
                        />
                        <IconButton
                          icon="clone"
                          label="Clone"
                          onClick={() => {
                            setLastTouchedId(role.id);
                            startClone(role);
                          }}
                        />
                        <IconButton
                          icon={role.isActive ? 'deactivate' : 'activate'}
                          label={role.isActive ? 'Deactivate' : 'Activate'}
                          onClick={() => {
                            setLastTouchedId(role.id);
                            void toggleRole(role);
                          }}
                        />
                        <IconButton
                          icon="delete"
                          label="Delete"
                          variant="danger"
                          onClick={() => {
                            setLastTouchedId(role.id);
                            void removeRole(role);
                          }}
                          disabled={deletingId !== null}
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
          title={editingRole ? 'Edit administrator' : 'Provision administrator'}
          error={error}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit}>
            <label
              className="mt-5 block text-sm font-semibold"
              htmlFor={editingRole ? 'editFacebookUserId' : 'facebookUserId'}
            >
              Facebook user ID
            </label>
            <input
              className="mt-2 w-full px-3 py-2 text-brand-black"
              id={editingRole ? 'editFacebookUserId' : 'facebookUserId'}
              required
              readOnly={Boolean(editingRole)}
              value={form.facebookUserId}
              onChange={(event) =>
                setForm({ ...form, facebookUserId: event.target.value })
              }
            />
            <label
              className="mt-4 block text-sm font-semibold"
              htmlFor="emailSnapshot"
            >
              Email snapshot
            </label>
            <input
              className="mt-2 w-full px-3 py-2 text-brand-black"
              id="emailSnapshot"
              type="email"
              value={form.emailSnapshot}
              onChange={(event) =>
                setForm({ ...form, emailSnapshot: event.target.value })
              }
            />
            <label
              className="mt-4 block text-sm font-semibold"
              htmlFor="displayNameSnapshot"
            >
              Display name snapshot
            </label>
            <input
              className="mt-2 w-full px-3 py-2 text-brand-black"
              id="displayNameSnapshot"
              required
              value={form.displayNameSnapshot}
              onChange={(event) =>
                setForm({ ...form, displayNameSnapshot: event.target.value })
              }
            />
            <ModalFooter>
              <button
                className="flex-1 bg-brand-gold px-4 py-3 font-bold text-brand-black disabled:opacity-50"
                disabled={submitting}
              >
                {submitting
                  ? editingRole
                    ? 'Saving...'
                    : 'Provisioning...'
                  : editingRole
                    ? 'Save changes'
                    : 'Provision administrator'}
              </button>
              <button
                className="border border-white px-4 py-3 font-semibold"
                type="button"
                onClick={closeModal}
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
