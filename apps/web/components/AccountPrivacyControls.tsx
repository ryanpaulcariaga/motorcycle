'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  deleteUserAccount,
  exportUserData,
  facebookSignInUrl,
  getUserSession,
} from '@/lib/api';
import { updateCachedInterestPreference } from '@/lib/user-interest';

export default function AccountPrivacyControls() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [working, setWorking] = useState<'export' | 'delete' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getUserSession()
      .then((session) => {
        if (active) {
          setSignedIn(session !== null);
        }
      })
      .catch((reason: unknown) => {
        console.error('Unable to load account privacy status.', reason);
        if (active) {
          setSignedIn(false);
          setError('Unable to check your account. Refresh to try again.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function downloadExport() {
    setWorking('export');
    setError('');
    try {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `motocompare-account-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (reason) {
      console.error('Unable to export account data.', reason);
      setError('Could not export your data. Please sign in again and retry.');
    } finally {
      setWorking(null);
    }
  }

  async function removeAccount() {
    const confirmed = window.confirm(
      'Permanently delete your MotoCompare account and all linked activity, ratings, reviews, and comments? This cannot be undone.',
    );
    if (!confirmed) {
      return;
    }

    setWorking('delete');
    setError('');
    try {
      await deleteUserAccount();
      updateCachedInterestPreference(null);
      window.dispatchEvent(new Event('mc-user-signout'));
      router.push('/');
      router.refresh();
    } catch (reason) {
      console.error('Unable to delete account.', reason);
      setError('Could not delete your account. Please sign in again and retry.');
      setWorking(null);
    }
  }

  return (
    <section className="space-y-3 border border-brand-grey p-4 text-sm">
      <div>
        <h2 className="text-lg font-semibold">Your account data</h2>
        <p>
          Export a copy of your MotoCompare account data, or permanently delete
          your account and user-owned content.
        </p>
      </div>
      {signedIn === null && <p>Checking account status...</p>}
      {signedIn === false && !error && (
        <p>
          <a className="underline" href={facebookSignInUrl()}>
            Sign in with Facebook
          </a>{' '}
          to export or delete account data. You can still review the{' '}
          <Link className="underline" href="/privacy">
            privacy policy
          </Link>
          .
        </p>
      )}
      {signedIn && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <button
            type="button"
            className="border border-brand-grey px-3 py-2 transition-colors hover:border-brand-button hover:bg-brand-button hover:text-white disabled:hover:border-brand-grey disabled:hover:bg-transparent disabled:hover:text-inherit"
            disabled={working !== null}
            onClick={() => void downloadExport()}
          >
            {working === 'export' ? 'Preparing export...' : 'Download my data'}
          </button>
          <button
            type="button"
            className="border border-red-700 px-3 py-2 text-red-700 transition-colors hover:border-brand-button hover:bg-brand-button hover:text-white disabled:hover:border-red-700 disabled:hover:bg-transparent disabled:hover:text-red-700"
            disabled={working !== null}
            onClick={() => void removeAccount()}
          >
            {working === 'delete' ? 'Deleting account...' : 'Delete my account'}
          </button>
          <p className="max-w-xl">
            Deletion is immediate and removes linked sign-ins, interest
            profiles, ratings, reviews, and comments. Anonymous aggregate
            counts contain no account identifier and cannot identify or be
            linked back to you.
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
