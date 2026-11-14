'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CONSENT_CHANGE_EVENT, CONSENT_KEY } from '@/lib/analytics';

export default function AnalyticsConsent({ mode = 'prompt' }: { mode?: 'prompt' | 'settings' }) {
  const pathname = usePathname();
  const [choice, setChoice] = useState<string | null>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const read = () => {
      try {
        const saved = localStorage.getItem(CONSENT_KEY);
        setChoice(saved === 'yes' || saved === 'no' ? saved : null);
        setError('');
      } catch {
        setChoice(null);
        setError('Your browser could not read your preference. Analytics is off.');
      }
    };
    read();
    window.addEventListener('storage', read);
    window.addEventListener(CONSENT_CHANGE_EVENT, read);
    return () => {
      window.removeEventListener('storage', read);
      window.removeEventListener(CONSENT_CHANGE_EVENT, read);
    };
  }, []);

  function choose(value: 'yes' | 'no') {
    try {
      localStorage.setItem(CONSENT_KEY, value);
      setChoice(value);
      setError('');
      window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
    } catch {
      setError('Your browser could not save your preference. Your previous choice may still apply.');
    }
  }

  if (choice === 'loading' || (mode === 'prompt' && (choice !== null || pathname === '/settings'))) {
    return null;
  }

  return (
    <section className={mode === 'prompt' ? 'sticky bottom-0 z-50 border-t border-brand-grey/30 bg-brand-content px-4 py-3 text-sm text-brand-black shadow-lg' : 'space-y-3 text-sm'} aria-label="Analytics preferences">
        <div className={mode === 'prompt' ? 'mx-auto flex max-w-7xl flex-wrap items-center gap-3' : 'space-y-3'}>
          {mode === 'settings' && <h2 className="text-lg font-semibold">Anonymous analytics</h2>}
          <p className="flex-1">
            Allow optional analytics? We count bike views, filter choices, comparisons, and search results
            without saving search text or analytics identifiers. Daily counts are kept for 12 months.
            You can change this choice anytime in settings.
            Comparison requests are counted separately for recommendations even if you decline.
          </p>
          {mode === 'settings' && <p>Current preference: <strong>{choice === 'yes' ? 'Allowed' : choice === 'no' ? 'Declined' : 'Not set'}</strong></p>}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="border border-brand-grey px-3 py-2" onClick={() => choose('no')} disabled={choice === 'no'}>
              {mode === 'settings' ? 'Turn off analytics' : 'Decline'}
            </button>
            <button type="button" className="bg-brand-button px-3 py-2 font-semibold text-white" onClick={() => choose('yes')} disabled={choice === 'yes'}>Allow analytics</button>
          </div>
          {error && <p role="alert" className="w-full text-red-700">{error}</p>}
        </div>
    </section>
  );
}
