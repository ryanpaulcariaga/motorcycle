"use client";

import { FormEvent, useEffect, useState } from "react";
import { createAdminRole, getAdminRoles, updateAdminRole, AdminApiError } from "@/lib/api";
import type { AdminRole } from "@/lib/types";

const emptyForm = { facebookUserId: "", emailSnapshot: "", displayNameSnapshot: "" };

export default function RoleManagement() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRoles() {
    setLoading(true);
    setError(null);
    try {
      setRoles(await getAdminRoles());
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "Unable to load administrator roles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { queueMicrotask(() => void loadRoles()); }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createAdminRole({ ...form, role: "Administrator" });
      setForm(emptyForm);
      await loadRoles();
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "Unable to provision administrator.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleRole(role: AdminRole) {
    setError(null);
    try {
      const updated = await updateAdminRole(role.id, {
        emailSnapshot: role.emailSnapshot ?? "",
        displayNameSnapshot: role.displayNameSnapshot ?? "",
        role: "Administrator",
        isActive: !role.isActive,
      });
      setRoles((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "Unable to update administrator.");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="bg-brand-content p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-wide text-brand-button">Access</p><h1 className="text-2xl font-bold">Administrators</h1></div>
          <button className="border border-brand-button px-3 py-2 text-sm font-semibold text-brand-button" onClick={() => void loadRoles()} disabled={loading}>Refresh</button>
        </div>
        {error && <p className="mt-4 border-l-4 border-red-700 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
        {loading ? <p className="mt-8 text-brand-grey">Loading administrator roles...</p> : roles.length === 0 ? <p className="mt-8 text-brand-grey">No administrator roles have been provisioned.</p> : (
          <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[42rem] text-left text-sm"><thead><tr className="border-b border-black/10"><th className="p-3">Identity</th><th className="p-3">Name</th><th className="p-3">Status</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead><tbody>{roles.map((role) => <tr className="border-b border-black/10" key={role.id}><td className="p-3"><div className="font-semibold">{role.facebookUserId}</div><div className="text-brand-grey">{role.emailSnapshot ?? "No email snapshot"}</div></td><td className="p-3">{role.displayNameSnapshot ?? "No display name"}</td><td className="p-3">{role.isActive ? "Active" : "Inactive"}</td><td className="p-3 text-right"><button className="font-semibold text-brand-button underline" onClick={() => void toggleRole(role)}>{role.isActive ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table></div>
        )}
      </section>
      <form className="h-fit bg-brand-sidebar p-6 text-white shadow-lg" onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold">Provision administrator</h2>
        <label className="mt-5 block text-sm font-semibold" htmlFor="facebookUserId">Facebook user ID</label><input className="mt-2 w-full px-3 py-2 text-brand-black" id="facebookUserId" required value={form.facebookUserId} onChange={(event) => setForm({ ...form, facebookUserId: event.target.value })} />
        <label className="mt-4 block text-sm font-semibold" htmlFor="emailSnapshot">Email snapshot</label><input className="mt-2 w-full px-3 py-2 text-brand-black" id="emailSnapshot" type="email" value={form.emailSnapshot} onChange={(event) => setForm({ ...form, emailSnapshot: event.target.value })} />
        <label className="mt-4 block text-sm font-semibold" htmlFor="displayNameSnapshot">Display name snapshot</label><input className="mt-2 w-full px-3 py-2 text-brand-black" id="displayNameSnapshot" required value={form.displayNameSnapshot} onChange={(event) => setForm({ ...form, displayNameSnapshot: event.target.value })} />
        <button className="mt-6 w-full bg-brand-gold px-4 py-3 font-bold text-brand-black disabled:opacity-50" disabled={submitting}>{submitting ? "Provisioning..." : "Provision administrator"}</button>
      </form>
    </div>
  );
}
