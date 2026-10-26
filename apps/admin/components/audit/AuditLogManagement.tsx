'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminApiError, getAdminAuditLogs } from '@/lib/api';
import type { AdminAuditLogPage } from '@/lib/types';

const pageSize = 50;

export default function AuditLogManagement() {
  const [result, setResult] = useState<AdminAuditLogPage | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError(null);
    try {
      setResult(await getAdminAuditLogs(nextPage, pageSize));
      setPage(nextPage);
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to load the administrator audit log.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadLogs(1));
  }, [loadLogs]);

  return (
    <section className="bg-brand-content p-6 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Administrator audit log</h1>
          <p className="mt-1 text-sm text-brand-grey">
            Administrative changes, actors, and affected fields. Field values are not stored.
          </p>
        </div>
        <button
          className="bg-brand-button px-4 py-2 text-sm font-semibold text-white hover:bg-brand-button-active disabled:opacity-50"
          type="button"
          disabled={loading}
          onClick={() => void loadLogs(page)}
        >
          Refresh
        </button>
      </div>

      {error && (
        <p className="mt-4 border-l-4 border-red-700 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-brand-grey/30">
              <th className="px-3 py-2 font-semibold">When</th>
              <th className="px-3 py-2 font-semibold">Administrator</th>
              <th className="px-3 py-2 font-semibold">Action</th>
              <th className="px-3 py-2 font-semibold">Entity</th>
              <th className="px-3 py-2 font-semibold">Key</th>
              <th className="px-3 py-2 font-semibold">Changed fields</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-3 py-6 text-brand-grey" colSpan={6}>Loading audit entries...</td>
              </tr>
            )}
            {!loading && result?.items.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-brand-grey" colSpan={6}>No administrator changes recorded.</td>
              </tr>
            )}
            {!loading && result?.items.map((item) => (
              <tr className="border-b border-brand-grey/20 align-top" key={item.id}>
                <td className="whitespace-nowrap px-3 py-2">{new Date(item.occurredAt).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <span className="block">{item.actorDisplayName || item.actorId}</span>
                  {item.actorDisplayName && <span className="text-xs text-brand-grey">{item.actorId}</span>}
                </td>
                <td className="px-3 py-2">{item.action}</td>
                <td className="px-3 py-2">{item.entityType}</td>
                <td className="px-3 py-2">{item.entityKey ?? '—'}</td>
                <td className="max-w-sm break-words px-3 py-2">{item.changedFields || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 text-sm">
        <span className="text-brand-grey">
          {result ? `${result.totalCount.toLocaleString()} entries` : ''}
        </span>
        <div className="flex items-center gap-3">
          <button
            className="border border-brand-grey/40 px-3 py-2 font-semibold disabled:opacity-50"
            type="button"
            disabled={loading || page <= 1}
            onClick={() => void loadLogs(page - 1)}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            className="border border-brand-grey/40 px-3 py-2 font-semibold disabled:opacity-50"
            type="button"
            disabled={loading || !result || page * pageSize >= result.totalCount}
            onClick={() => void loadLogs(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
