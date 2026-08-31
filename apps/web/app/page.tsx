import Link from "next/link";
import Image from "next/image";
import PageShell from "@/components/PageShell";
import Button from "@/components/Button";
import { getBikes } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { items: bikes } = await getBikes({ pageSize: 4, sortBy: "year", sortDescending: true });

  return (
    <PageShell>
      <section className="text-center py-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Find and Compare Motorcycles
        </h1>
        <p className="mt-3 text-zinc-600 max-w-xl mx-auto">
          Search specs, filter by brand or category, and compare bikes side-by-side.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/bikes">
            <Button variant="primary">Browse Bikes</Button>
          </Link>
          <Link href="/compare">
            <Button variant="gold">Compare Bikes</Button>
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Latest Bikes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bikes.map((bike) => (
            <Link
              key={bike.id}
              href={`/bikes/${bike.slug}`}
              className="rounded-md border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[4/3] bg-zinc-100">
                {bike.primaryImageUrl && (
                  <Image
                    src={bike.primaryImageUrl}
                    alt={bike.modelName}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-zinc-500">{bike.brandName}</p>
                <p className="font-semibold">{bike.modelName}</p>
                <p className="text-sm text-zinc-600">
                  {bike.year} {bike.msrpPrice ? `· $${bike.msrpPrice.toLocaleString()}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

