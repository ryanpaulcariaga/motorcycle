"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminApiError, createBikeModel, deleteBikeModel, getBikeModels, getBrands, getCategories, updateBikeModel } from "@/lib/api";
import type { BikeModel, LookupOption } from "@/lib/types";

const emptyForm = { brandId: "", categoryId: "", name: "" };

export default function BikeModelManagement() {
  const [models, setModels] = useState<BikeModel[]>([]);
  const [brands, setBrands] = useState<LookupOption[]>([]);
  const [categories, setCategories] = useState<LookupOption[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [modelResult, brandResult, categoryResult] = await Promise.all([getBikeModels(), getBrands(), getCategories()]);
      setModels(modelResult); setBrands(brandResult); setCategories(categoryResult);
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "Unable to load BikeModels.");
    } finally { setLoading(false); }
  }

  useEffect(() => { queueMicrotask(() => void load()); }, []);

  function reset() { setForm(emptyForm); setEditingId(null); }

  function edit(model: BikeModel) { setEditingId(model.id); setForm({ brandId: String(model.brandId), categoryId: String(model.categoryId), name: model.name }); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const request = { brandId: Number(form.brandId), categoryId: Number(form.categoryId), name: form.name };
      if (editingId === null) await createBikeModel(request); else await updateBikeModel(editingId, request);
      reset(); await load();
    } catch (cause) {
      setError(cause instanceof AdminApiError ? (cause.details?.code === "bike_model_referenced" ? "This BikeModel is referenced by existing bikes and cannot be deleted." : cause.message) : "Unable to save BikeModel.");
    } finally { setSubmitting(false); }
  }

  async function remove(model: BikeModel) {
    if (!window.confirm(`Delete ${model.brandName} ${model.name}?`)) return;
    setError(null);
    try { await deleteBikeModel(model.id); await load(); }
    catch (cause) { setError(cause instanceof AdminApiError && cause.details?.code === "bike_model_referenced" ? "This BikeModel is referenced by existing bikes and cannot be deleted." : "Unable to delete BikeModel."); }
  }

  return <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
    <section className="bg-brand-content p-6 shadow-lg">
      <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-brand-button">Catalog</p><h1 className="text-2xl font-bold">BikeModels</h1></div><button className="border border-brand-button px-3 py-2 text-sm font-semibold text-brand-button" onClick={() => void load()} disabled={loading}>Refresh</button></div>
      {error && <p className="mt-4 border-l-4 border-red-700 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
      {loading ? <p className="mt-8 text-brand-grey">Loading BikeModels...</p> : models.length === 0 ? <p className="mt-8 text-brand-grey">No BikeModels have been added.</p> : <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[38rem] text-left text-sm"><thead><tr className="border-b border-black/10"><th className="p-3">Brand</th><th className="p-3">Category</th><th className="p-3">Model line</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead><tbody>{models.map((model) => <tr className="border-b border-black/10" key={model.id}><td className="p-3">{model.brandName}</td><td className="p-3">{model.categoryName}</td><td className="p-3 font-semibold">{model.name}</td><td className="p-3 text-right"><button className="mr-3 font-semibold text-brand-button underline" onClick={() => edit(model)}>Edit</button><button className="font-semibold text-red-700 underline" onClick={() => void remove(model)}>Delete</button></td></tr>)}</tbody></table></div>}
    </section>
    <form className="h-fit bg-brand-sidebar p-6 text-white shadow-lg" onSubmit={submit}>
      <h2 className="text-xl font-bold">{editingId === null ? "Add BikeModel" : "Edit BikeModel"}</h2>
      <label className="mt-5 block text-sm font-semibold" htmlFor="brandId">Brand</label><select className="mt-2 w-full px-3 py-2 text-brand-black" id="brandId" required value={form.brandId} onChange={(event) => setForm({ ...form, brandId: event.target.value })}><option value="">Select brand</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select>
      <label className="mt-4 block text-sm font-semibold" htmlFor="categoryId">Category</label><select className="mt-2 w-full px-3 py-2 text-brand-black" id="categoryId" required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
      <label className="mt-4 block text-sm font-semibold" htmlFor="modelName">Model-line name</label><input className="mt-2 w-full px-3 py-2 text-brand-black" id="modelName" required maxLength={255} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      <div className="mt-6 flex gap-3"><button className="flex-1 bg-brand-gold px-4 py-3 font-bold text-brand-black disabled:opacity-50" disabled={submitting}>{submitting ? "Saving..." : editingId === null ? "Add model" : "Save changes"}</button>{editingId !== null && <button className="border border-white px-4 py-3 font-semibold" type="button" onClick={reset}>Cancel</button>}</div>
    </form>
  </div>;
}
