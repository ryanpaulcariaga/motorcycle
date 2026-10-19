import PageShell from '@/components/PageShell';

export default function Loading() {
  return (
    <PageShell>
      <p role="status" aria-live="polite" className="animate-pulse">
        Loading...
      </p>
    </PageShell>
  );
}
