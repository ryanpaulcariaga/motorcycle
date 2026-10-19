'use client';

import { useEffect } from 'react';
import Button from '@/components/Button';
import PageShell from '@/components/PageShell';

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell>
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2">We could not load this page. Please try again.</p>
      <div className="mt-4">
        <Button onClick={() => retry()}>Try again</Button>
      </div>
    </PageShell>
  );
}
