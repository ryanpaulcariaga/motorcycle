import PageShell from '@/components/PageShell';
import CompareClient from '@/components/CompareClient';
import { compareBikes } from '@/lib/api';
import type { Metadata } from 'next';

interface ComparePageProps {
  searchParams: Promise<{ ids?: string }>;
}

export const metadata: Metadata = {
  title: 'Compare Bikes',
  description: 'Compare motorcycle specifications side-by-side on MotoCompare.',
  alternates: { canonical: '/compare' },
  openGraph: {
    title: 'Compare Bikes | MotoCompare',
    description: 'Compare motorcycle specifications side-by-side on MotoCompare.',
    url: '/compare',
    type: 'website',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare Bikes | MotoCompare',
    description: 'Compare motorcycle specifications side-by-side on MotoCompare.',
    images: ['/opengraph-image'],
  },
};

export const dynamic = 'force-dynamic';

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { ids } = await searchParams;
  const selectedIds = ids ? ids.split(',').filter(Boolean) : [];

  const compareResult =
    selectedIds.length > 0 ? await compareBikes(selectedIds) : null;

  return (
    <PageShell>
      <h1 className="text-2xl font-bold mb-4">Compare Bikes</h1>
      <CompareClient selectedIds={selectedIds} compareResult={compareResult} />
    </PageShell>
  );
}
