import { useCallback, useEffect, useState } from 'react';
import { deleteContactInquiry, getContactInquiries } from '@/lib/api';
import type { ContactInquiryPage } from '@/lib/types';
import { AdminToolbar, AdminToolbarButton } from '@/components/AdminToolbar';

const pageSize = 20;

export default function ContactInbox() {
  const [result, setResult] = useState<ContactInquiryPage | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getContactInquiries(nextPage, pageSize);
      setResult(data);
      setPage(nextPage);
    } catch {
      setError('Unable to load contact inquiries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load(1));
  }, [load]);

  async function remove(id: number) {
    if (!window.confirm('Permanently delete this inquiry?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await deleteContactInquiry(id);
      await load(result && result.items.length === 1 && page > 1 ? page - 1 : page);
    } catch {
      setError('Unable to delete this inquiry. Please try again.');
      setLoading(false);
    }
  }

  return (
    <section className="min-w-0 bg-brand-content p-4 shadow-lg sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Contact inquiries</h1>
          <p className="mt-1 text-sm text-brand-grey">Messages are stored here; no email notifications are sent.</p>
        </div>
        <AdminToolbar><AdminToolbarButton disabled={loading} onClick={() => void load(page)}>Refresh</AdminToolbarButton></AdminToolbar>
      </div>
      {error && <p className="mt-4 border-l-4 border-red-700 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
      {loading && <p className="mt-5 text-brand-grey">Loading inquiries...</p>}
      {!loading && result?.items.length === 0 && <p className="mt-5 text-brand-grey">No inquiries on this page.</p>}
      {!loading && <div className="mt-5 space-y-4">
        {result?.items.map((item) => (
          <article className="min-w-0 border border-brand-grey/30 p-4" key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 break-words">
                <p className="font-semibold">{item.name || 'No name provided'}</p>
                <a className="underline" href={`mailto:${encodeURIComponent(item.email)}`}>{item.email}</a>
                <p className="text-sm text-brand-grey">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <button className="border border-red-700 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-700 hover:text-white" onClick={() => void remove(item.id)} type="button">Delete</button>
            </div>
            <p className="mt-4 whitespace-pre-wrap break-words">{item.message}</p>
          </article>
        ))}
      </div>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm">
        <span>{result ? `${result.totalCount} inquiries` : ''}</span>
        <div className="flex items-center gap-3">
          <button className="border px-3 py-2 disabled:opacity-50" disabled={loading || page <= 1} onClick={() => void load(page - 1)} type="button">Previous</button>
          <span>Page {page}</span>
          <button className="border px-3 py-2 disabled:opacity-50" disabled={loading || !result || page * pageSize >= result.totalCount} onClick={() => void load(page + 1)} type="button">Next</button>
        </div>
      </div>
    </section>
  );
}
