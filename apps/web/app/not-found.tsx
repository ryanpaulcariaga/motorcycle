import Link from 'next/link';
import PageShell from '@/components/PageShell';

export default function NotFound() {
  return (
    <PageShell>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2">We could not find what you were looking for.</p>
      <p className="mt-4">
        <Link href="/bikes" className="font-semibold underline">
          Browse all bikes
        </Link>
      </p>
    </PageShell>
  );
}
