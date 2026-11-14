'use client';

import { useEffect, useState } from 'react';
import { CONSENT_CHANGE_EVENT, CONSENT_KEY } from '@/lib/analytics';

export default function AnalyticsConsent() {
  const [choice, setChoice] = useState<string | null>('loading');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const read = () => {
      try {
        setChoice(localStorage.getItem(CONSENT_KEY));
      } catch {
        setChoice(null);
        setError('Your browser could not save your preference. Analytics is off.');
      }
    };
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, []);

  function choose(value: 'yes' | 'no') {
    try {
      localStorage.setItem(CONSENT_KEY, value);
      setChoice(value);
      setEditing(false);
      setError('');
      window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
    } catch {
      setError('Your browser could not save your preference. Analytics is off.');
    }
  }

  const prompt = choice !== 'loading' && (choice === null || editing);

  return (
    <div className={`${prompt ? 'sticky bottom-0 z-50 border-t border-brand-grey/30 shadow-lg' : ''} bg-brand-content px-4 py-3 text-sm text-brand-black`}>
      {choice !== 'loading' && (choice === null || editing) ? (
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <p className="flex-1">
            Allow optional analytics? We count bike views, filter choices, comparisons, and search results
            without saving search text or analytics identifiers. Daily counts are kept for 12 months.
            You can change this choice anytime.
            Comparison requests are counted separately for recommendations even if you decline.
          </p>
          <button type="button" className="border border-brand-grey px-3 py-2" onClick={() => choose('no')}>Decline</button>
          <button type="button" className="bg-brand-button px-3 py-2 font-semibold text-white" onClick={() => choose('yes')}>Allow analytics</button>
          {error && <p role="alert" className="w-full text-red-700">{error}</p>}
        </div>
      ) : choice !== 'loading' ? (
        <div className="mx-auto max-w-7xl text-right">
          <button type="button" className="underline" onClick={() => setEditing(true)}>Analytics preferences</button>
        </div>
      ) : null}
    </div>
  );
}
