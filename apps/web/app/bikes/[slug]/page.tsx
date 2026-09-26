import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageShell from '@/components/PageShell';
import Sidebar, { SidebarLink, SidebarSection } from '@/components/Sidebar';
import Button from '@/components/Button';
import { getBikeBySlug, getBrands } from '@/lib/api';
import type { Metadata } from 'next';

interface BikeDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BikeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const bike = await getBikeBySlug(slug);
    return {
      title: `${bike.brandName} ${bike.modelName} ${bike.variantName} (${bike.year})`,
      description: `Specs and details for the ${bike.year} ${bike.brandName} ${bike.modelName} ${bike.variantName}.`,
      openGraph: {
        title: `${bike.brandName} ${bike.modelName} ${bike.variantName}`,
        images: bike.images[0] ? [bike.images[0].blobUrl] : [],
      },
    };
  } catch {
    return { title: 'Bike not found' };
  }
}

export const dynamic = 'force-dynamic';

export default async function BikeDetailPage({ params }: BikeDetailPageProps) {
  const { slug } = await params;

  let bike;
  try {
    bike = await getBikeBySlug(slug);
  } catch {
    notFound();
  }

  const brands = await getBrands();

  const groupsWithSpecs = bike.specGroups.filter(
    (group) => group.specs.length > 0
  );
  const highlightSpecs = groupsWithSpecs
    .flatMap((group) => group.specs)
    .slice(0, 6);

  return (
    <PageShell>
      <div className="flex flex-col md:flex-row gap-6">
        <Sidebar>
          <SidebarSection title="Brands">
            <div className="flex flex-col">
              <SidebarLink href="/bikes">All Brands</SidebarLink>
              {brands.map((brand) => (
                <SidebarLink key={brand.id} href={`/bikes?brandId=${brand.id}`}>
                  {brand.name}
                </SidebarLink>
              ))}
            </div>
          </SidebarSection>
        </Sidebar>

        <div className="flex-1">
          <p className="text-sm text-zinc-500">
            {bike.brandName} · {bike.categoryName}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {bike.modelName} {bike.variantName}
          </h1>
          <p className="mt-1 text-lg text-zinc-700">
            {bike.year}{' '}
            {bike.msrpPrice ? `· $${bike.msrpPrice.toLocaleString()}` : ''}
          </p>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div id="pictures">
              <div className="relative aspect-[4/3] bg-zinc-100 rounded-md overflow-hidden">
                {bike.images[0] && (
                  <Image
                    src={bike.images[0].blobUrl}
                    alt={bike.modelName}
                    fill
                    className="object-cover"
                    priority
                  />
                )}
              </div>
              {bike.images.length > 1 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {bike.images.slice(1).map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-square bg-zinc-100 rounded overflow-hidden"
                    >
                      <Image
                        src={image.blobUrl}
                        alt={bike.modelName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              {highlightSpecs.length > 0 && (
                <div>
                  <h2 className="font-semibold text-brand-button mb-2">
                    Highlights
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {highlightSpecs.map((spec) => (
                      <div
                        key={spec.code}
                        className="rounded-md border border-zinc-200 p-3"
                      >
                        <p className="text-xs text-zinc-500">{spec.label}</p>
                        <p className="font-semibold">
                          {spec.value !== null && spec.value !== undefined
                            ? `${spec.value}${spec.unit ? ` ${spec.unit}` : ''}`
                            : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <Link href={`/compare?ids=${bike.id}`}>
                  <Button variant="gold">Compare</Button>
                </Link>
                <a href="#pictures">
                  <Button variant="black">Pictures</Button>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <h2 className="text-xl font-bold">Full Specifications</h2>
            {groupsWithSpecs.map((group) => (
              <div key={group.code}>
                <h3 className="font-semibold text-brand-button mb-2">
                  {group.name}
                </h3>
                <table className="w-full text-sm">
                  <tbody>
                    {group.specs.map((spec) => (
                      <tr key={spec.code} className="border-b border-zinc-100">
                        <td className="py-1.5 text-zinc-500">{spec.label}</td>
                        <td className="py-1.5 text-right font-medium">
                          {spec.value !== null && spec.value !== undefined
                            ? `${spec.value}${spec.unit ? ` ${spec.unit}` : ''}`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold mb-2">Reviews</h2>
            <p className="text-sm text-zinc-500 italic">
              Coming soon — user reviews and opinions.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
