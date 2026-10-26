import Link from 'next/link';
import Image from 'next/image';
import PageShell from '@/components/PageShell';
import Sidebar, { SidebarLink, SidebarSection } from '@/components/Sidebar';
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
    <PageShell bare>
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <Sidebar>
          <SidebarSection title="Brand">
            <div className="flex flex-col">
              {brands.map((brand) => (
                <SidebarLink
                  key={brand.id}
                  href={buildFilterHref({ brandId: brand.id, page: undefined })}
                  active={params.brandId === String(brand.id)}
                >
                  {brand.name}
                </SidebarLink>
              ))}
            </div>
            <SidebarLink
              href={buildFilterHref({ brandId: undefined, page: undefined })}
              active={!params.brandId}
            >
              All Brands
            </SidebarLink>
          </SidebarSection>

          <SidebarSection title="Category">
            <div className="flex flex-col">
              {categories.map((category) => (
                <SidebarLink
                  key={category.id}
                  href={buildFilterHref({
                    categoryId: category.id,
                    page: undefined,
                  })}
                  active={params.categoryId === String(category.id)}
                >
                  {category.name}
                </SidebarLink>
              ))}
            </div>
            <SidebarLink
              href={buildFilterHref({
                categoryId: undefined,
                page: undefined,
              })}
              active={!params.categoryId}
            >
              All Categories
            </SidebarLink>
          </SidebarSection>
        </Sidebar>

        <div className="min-w-0 flex-1 bg-brand-content p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h1 className="min-w-0 break-words text-2xl font-bold">
              {params.search
                ? `Search results for "${params.search}"`
                : 'Browse Bikes'}
            </h1>
            <p className="text-sm text-brand-grey">{totalCount} bikes</p>
          </div>

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
                      alt={`${bike.brandName} - ${bike.variantName}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs text-brand-grey">{bike.categoryName}</p>
                  <p className="font-semibold">
                    {bike.brandName} - {bike.variantName}
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
            <div className="mt-6 flex justify-center gap-2">
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
        </div>
      </div>
    </PageShell>
  );
}
