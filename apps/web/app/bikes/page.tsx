import Link from "next/link";
import Image from "next/image";
import PageShell from "@/components/PageShell";
import Sidebar, { SidebarLink } from "@/components/Sidebar";
import { getBikes, getBrands, getCategories } from "@/lib/api";

interface BikesPageProps {
  searchParams: Promise<{
    brandId?: string;
    categoryId?: string;
    sortBy?: string;
    sortDescending?: string;
    page?: string;
  }>;
}

export const metadata = {
  title: "Browse Bikes",
};

export const dynamic = "force-dynamic";

export default async function BikesPage({ searchParams }: BikesPageProps) {
  const params = await searchParams;
  const page = params.page ? Number(params.page) : 1;

  const [{ items: bikes, totalPages, totalCount }, brands, categories] = await Promise.all([
    getBikes({
      page,
      pageSize: 12,
      brandId: params.brandId,
      categoryId: params.categoryId,
      sortBy: (params.sortBy as "price" | "year" | "model_name") ?? undefined,
      sortDescending: params.sortDescending === "true",
    }),
    getBrands(),
    getCategories(),
  ]);

  const buildFilterHref = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { ...params, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    return `/bikes?${next.toString()}`;
  };

  return (
    <PageShell>
      <div className="flex flex-col md:flex-row gap-6">
        <Sidebar>
          <h2 className="font-semibold mb-3">Filters</h2>

          <p className="text-xs uppercase tracking-wide text-white/60 mb-1">Brand</p>
          <div className="mb-4 flex flex-col">
            <SidebarLink href={buildFilterHref({ brandId: undefined, page: undefined })}>All Brands</SidebarLink>
            {brands.map((brand) => (
              <SidebarLink key={brand.id} href={buildFilterHref({ brandId: brand.id, page: undefined })}>
                {brand.name}
              </SidebarLink>
            ))}
          </div>

          <p className="text-xs uppercase tracking-wide text-white/60 mb-1">Category</p>
          <div className="flex flex-col">
            <SidebarLink href={buildFilterHref({ categoryId: undefined, page: undefined })}>All Categories</SidebarLink>
            {categories.map((category) => (
              <SidebarLink key={category.id} href={buildFilterHref({ categoryId: category.id, page: undefined })}>
                {category.name}
              </SidebarLink>
            ))}
          </div>
        </Sidebar>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Browse Bikes</h1>
            <p className="text-sm text-zinc-500">{totalCount} bikes</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bikes.map((bike) => (
              <Link
                key={bike.id}
                href={`/bikes/${bike.slug}`}
                className="rounded-md border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[4/3] bg-zinc-100">
                  {bike.primaryImageUrl && (
                    <Image src={bike.primaryImageUrl} alt={bike.modelName} fill className="object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-zinc-500">{bike.brandName} · {bike.categoryName}</p>
                  <p className="font-semibold">{bike.modelName}</p>
                  <p className="text-sm text-zinc-600">
                    {bike.year} {bike.msrpPrice ? `· $${bike.msrpPrice.toLocaleString()}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {bikes.length === 0 && (
            <p className="text-center text-zinc-500 py-12">No bikes match the selected filters.</p>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildFilterHref({ page: String(p) })}
                  className={`px-3 py-1.5 rounded text-sm ${
                    p === page ? "bg-brand-button text-white" : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
