'use client';

import { useEffect, useState } from 'react';
import { facebookSignInUrl, setUserInterestPreference } from '@/lib/api';
import { loadInterestPreference, updateCachedInterestPreference } from '@/lib/user-interest';

export default function UserInterestPreference() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let signedOut = false;
    loadInterestPreference().then((value) => {
      if (active && !signedOut && value) {
        setSignedIn(true);
        setEnabled(value.enabled);
      }
    }).catch((reason: unknown) => {
      console.error('Unable to load interest preference.', reason);
      if (active) {
        setError('Unable to load interest preferences. Refresh to try again.');
      }
    }).finally(() => {
      if (active) {
        setLoading(false);
      }
    });
    const signOut = () => {
      signedOut = true;
      updateCachedInterestPreference(null);
      setSignedIn(false);
      setEnabled(null);
    };
    window.addEventListener('mc-user-signout', signOut);
    return () => {
      active = false;
      window.removeEventListener('mc-user-signout', signOut);
    };
  }, []);

  async function change(value: boolean) {
    setSaving(true);
    setError('');
    if (!value) {
      updateCachedInterestPreference({ enabled: false });
    }
    try {
      const result = await setUserInterestPreference(value);
      updateCachedInterestPreference(result);
      setEnabled(result.enabled);
    } catch (reason) {
      console.error('Unable to update interest preference.', reason);
      updateCachedInterestPreference({ enabled: false });
      setError('Could not save your preference. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-3 text-sm" aria-label="Personalized interest preferences">
      <h2 className="text-lg font-semibold">Interest profile</h2>
      <div className="flex flex-wrap items-center gap-3">
        {loading && <p>Loading interest preferences...</p>}
        {!loading && !signedIn && !error && (
          <p>Sign in to manage your optional interest profile. <a className="underline" href={facebookSignInUrl()}>Sign in with Facebook</a></p>
        )}
        {signedIn && (
          <>
            <p className="flex-1">
              Optional interest profile: save bikes you view, select from search, or compare, and brand and category choices
              to your account for future recommendations. No search text is saved. Activity is kept for 12 months;
              turning this off deletes it. This does not enable marketing emails or sharing personal profiles.
            </p>
            <button type="button" className="border border-brand-grey px-3 py-2 transition-colors hover:border-brand-button hover:bg-brand-button hover:text-white disabled:hover:border-brand-grey disabled:hover:bg-transparent disabled:hover:text-inherit" disabled={saving}
              onClick={() => void change(!enabled)}>
              {saving ? 'Saving...' : enabled ? 'Turn off and delete activity' : 'Allow interest profile'}
            </button>
            <span>Current preference: <strong>{enabled ? 'On' : 'Off'}</strong></span>
          </>
        )}
        {error && <p role="alert" className="w-full text-red-700">{error}</p>}
      </div>
    </section>
  );
}
