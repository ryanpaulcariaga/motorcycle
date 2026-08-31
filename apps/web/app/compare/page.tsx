import PageShell from "@/components/PageShell";
import CompareClient from "@/components/CompareClient";
import { compareBikes, getBikes } from "@/lib/api";

interface ComparePageProps {
  searchParams: Promise<{ ids?: string }>;
}

export const metadata = {
  title: "Compare Bikes",
};

export const dynamic = "force-dynamic";

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { ids } = await searchParams;
  const selectedIds = ids ? ids.split(",").filter(Boolean) : [];

  const [{ items: allBikes }, compareResult] = await Promise.all([
    getBikes({ pageSize: 100 }),
    selectedIds.length > 0 ? compareBikes(selectedIds) : Promise.resolve(null),
  ]);

  return (
    <PageShell>
      <h1 className="text-2xl font-bold mb-4">Compare Bikes</h1>
      <CompareClient allBikes={allBikes} selectedIds={selectedIds} compareResult={compareResult} />
    </PageShell>
  );
}
