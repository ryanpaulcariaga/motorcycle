import Link from 'next/link';
import Image from 'next/image';
import CatalogPageShell from '@/components/CatalogPageShell';
import { getBikes, getBrands, getCategories } from '@/lib/api';
import type { Metadata } from 'next';

interface BikesPageProps {
  searchParams: Promise<{
    search?: string;
    brandId?: string;
    categoryId?: string;
    sortBy?: string;
    sortDescending?: string;
    page?: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Browse Bikes',
  description: 'Browse and compare motorcycle models, variants, and specifications.',
  alternates: { canonical: '/bikes' },
  openGraph: {
    title: 'Browse Bikes | MotoCompare',
    description: 'Browse and compare motorcycle models, variants, and specifications.',
    url: '/bikes',
    type: 'website',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Bikes | MotoCompare',
    description: 'Browse and compare motorcycle models, variants, and specifications.',
    images: ['/opengraph-image'],
  },
};

export const dynamic = 'force-dynamic';

export default async function BikesPage({ searchParams }: BikesPageProps) {
  const params = await searchParams;
  const page = params.page ? Number(params.page) : 1;

  const [{ items: bikes, totalPages, totalCount }, brands, categories] =
    await Promise.all([
      getBikes({
        page,
        pageSize: 12,
        search: params.search,
        brandId: params.brandId,
        categoryId: params.categoryId,
        sortBy: (params.sortBy as 'price' | 'year' | 'model_name') ?? undefined,
        sortDescending: params.sortDescending === 'true',
      }),
      getBrands(),
      getCategories(),
    ]);

  const buildFilterHref = (
    overrides: Record<string, string | number | undefined>
  ) => {
    const next = new URLSearchParams();
    const merged = { ...params, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) {
        next.set(key, String(value));
      }
    }
    return `/bikes?${next.toString()}`;
  };

  return (
    <CatalogPageShell browseParams={params}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h1 className="min-w-0 break-words text-2xl font-bold">
              {params.search
                ? `Search results for "${params.search}"`
                : 'Browse Bikes'}
            </h1>
            <p className="shrink-0 text-sm text-brand-grey">{totalCount} bikes</p>
          </div>

          <form
            key={JSON.stringify([params.brandId, params.categoryId])}
            action="/bikes"
            className="mb-4 flex flex-wrap items-end gap-3"
          >
            {(['search', 'sortBy', 'sortDescending'] as const).map((key) =>
              params[key] ? <input key={key} type="hidden" name={key} value={params[key]} /> : null
            )}
            <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm font-semibold">
              Brand
              <select name="brandId" defaultValue={params.brandId ?? ''} className="border border-zinc-300 bg-white px-2 py-2 font-normal">
                <option value="">All brands</option>
                {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>
            </label>
            <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm font-semibold">
              Category
              <select name="categoryId" defaultValue={params.categoryId ?? ''} className="border border-zinc-300 bg-white px-2 py-2 font-normal">
                <option value="">All categories</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <button type="submit" className="bg-brand-button px-4 py-2 text-sm font-semibold text-white">
              Apply filters
            </button>
          </form>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bikes.map((bike) => (
              <Link
                key={bike.id}
                href={`/bikes/${bike.slug}`}
                className=" border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[4/3] bg-zinc-100">
                  {bike.primaryImageUrl && (
                    <Image
                      src={bike.primaryImageVariants?.medium ?? bike.primaryImageUrl}
                      alt={bike.variantName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs text-brand-grey">{bike.categoryName}</p>
                  <p className="font-semibold">
                    {bike.variantName}
                  </p>
                  <p className="text-sm text-brand-grey">
                    {bike.year}{' '}
                    {bike.msrpPrice
                      ? `· $${bike.msrpPrice.toLocaleString()}`
                      : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {bikes.length === 0 && (
            <p className="text-center text-brand-grey py-12">
              {params.search
                ? `No bikes found for "${params.search}".`
                : 'No bikes match the selected filters.'}
            </p>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildFilterHref({ page: String(p) })}
                  className={`px-3 py-1.5 text-sm ${
                    p === page
                      ? 'bg-brand-button text-white'
                      : 'bg-zinc-100 text-brand-grey'
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
    </CatalogPageShell>
  );
}
