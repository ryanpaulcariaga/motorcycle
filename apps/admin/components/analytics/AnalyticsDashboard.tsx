import { useCallback, useEffect, useState } from 'react';
import { getAnalytics } from '@/lib/api';
import type { AnalyticsCount, AnalyticsDashboard as Dashboard } from '@/lib/types';

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function CountList({ title, items }: { title: string; items: AnalyticsCount[] }) {
  return (
    <section>
      <h2 className="font-semibold">{title}</h2>
      {items.length === 0 ? <p className="mt-2 text-sm text-brand-grey">No data for this period.</p> : (
        <ol className="mt-2 text-sm">
          {items.map((item) => (
            <li className="flex justify-between gap-4 border-b border-zinc-200 py-2" key={item.id}>
              <span>{item.name}</span><span>{item.count.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function AnalyticsDashboard() {
  const [to, setTo] = useState(() => isoDate(new Date()));
  const [from, setFrom] = useState(() => isoDate(new Date(Date.now() - 29 * 86400000)));
  const [result, setResult] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (start: string, end: string) => {
    setLoading(true);
    setError('');
    try {
      setResult(await getAnalytics(start, end));
    } catch (cause) {
      console.error('Unable to load analytics.', cause);
      setError('Unable to load analytics. Check that the dates are within the past 12 months and try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 29 * 86400000);
    queueMicrotask(() => void load(isoDate(start), isoDate(end)));
  }, [load]);

  return (
    <section className="min-w-0 bg-brand-content p-4 shadow-lg sm:p-6">
      <h1 className="text-xl font-bold">Interest analytics</h1>
      <p className="mt-1 text-sm text-brand-grey">
        Opted-in activity only, counted in UTC. Counts are not unique visitors; refreshes may count again.
        Comparisons over 25 bikes are excluded. Data is retained for 12 months.
      </p>
      <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={(event) => {
        event.preventDefault();
        void load(from, to);
      }}>
        <label className="flex flex-col gap-1 text-sm">From
          <input required type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="border border-zinc-300 px-2 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">To
          <input required type="date" value={to} min={from} max={isoDate(new Date())} onChange={(event) => setTo(event.target.value)} className="border border-zinc-300 px-2 py-2" />
        </label>
        <button disabled={loading} className="bg-brand-button px-4 py-2 font-semibold text-white disabled:opacity-50">Show</button>
      </form>
      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      {loading && <p className="mt-4">Loading analytics...</p>}
      {result && !loading && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Bike views', result.bikeViews.toLocaleString()],
              ['Comparisons', result.comparisons.toLocaleString()],
              ['Searches', result.searches.toLocaleString()],
              ['Zero-result searches', `${result.zeroResults.toLocaleString()} (${result.searches ? (result.zeroResults / result.searches * 100).toFixed(1) : '0'}%)`],
            ].map(([label, value]) => (
              <div className="border border-zinc-200 p-3" key={label}>
                <p className="text-sm text-brand-grey">{label}</p><p className="text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <CountList title="Most-viewed bikes" items={result.bikes} />
            <section>
              <h2 className="font-semibold">Popular comparison pairs</h2>
              {result.pairs.length === 0 ? <p className="mt-2 text-sm text-brand-grey">No data for this period.</p> : (
                <ol className="mt-2 text-sm">
                  {result.pairs.map((pair) => (
                    <li className="flex justify-between gap-4 border-b border-zinc-200 py-2" key={`${pair.bikeAId}-${pair.bikeBId}`}>
                      <span>{pair.bikeAName} vs {pair.bikeBName}</span><span>{pair.count.toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <CountList title="Brand filter selections" items={result.brands} />
            <CountList title="Category filter selections" items={result.categories} />
          </div>
          <h2 className="mt-6 font-semibold">Daily activity</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead><tr><th>Date (UTC)</th><th>Bike views</th><th>Comparisons</th><th>Searches</th><th>Zero results</th></tr></thead>
              <tbody>
                {result.daily.map((day) => (
                  <tr className="border-t border-zinc-200" key={day.day}>
                    <td className="py-2">{day.day}</td><td>{day.bikeViews}</td><td>{day.comparisons}</td><td>{day.searches}</td><td>{day.zeroResults}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.daily.length === 0 && <p className="py-2 text-sm text-brand-grey">No data for this period.</p>}
          </div>
        </>
      )}
    </section>
  );
}
