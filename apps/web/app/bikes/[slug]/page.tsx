import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageShell from '@/components/PageShell';
import Sidebar, { SidebarLink, SidebarSection } from '@/components/Sidebar';
import Button from '@/components/Button';
import BikeImageGallery from '@/components/BikeImageGallery';
import { getBikeBySlug, getBrands, getComparedWith } from '@/lib/api';
import { SITE_URL } from '@/lib/site';
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
    const title = `${bike.brandName} - ${bike.variantName} (${bike.year})`;
    const description = `Specs and details for the ${bike.year} ${bike.brandName} - ${bike.variantName}.`;
    const primaryImage =
      bike.images.find((image) => image.isPrimary) ?? bike.images[0];
    const imageUrl = primaryImage?.blobUrl ?? `${SITE_URL}/opengraph-image`;
    const imageAlt = `${bike.year} ${bike.brandName} - ${bike.variantName}`;

    return {
      title,
      description,
      alternates: { canonical: `/bikes/${bike.slug}` },
      openGraph: {
        title,
        description,
        url: `/bikes/${bike.slug}`,
        siteName: 'MotoCompare',
        type: 'website',
        images: [
          {
            url: imageUrl,
            alt: imageAlt,
            ...(primaryImage
              ? { width: primaryImage.width, height: primaryImage.height }
              : {}),
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [{ url: imageUrl, alt: imageAlt }],
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
  const comparedWith = await getComparedWith(slug).catch(() => []);

  const groupsWithSpecs = bike.specGroups.filter(
    (group) => group.specs.length > 0
  );
  const highlightSpecs = groupsWithSpecs
    .flatMap((group) => group.specs)
    .slice(0, 6);
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${bike.year} ${bike.brandName} - ${bike.variantName}`,
    description: `Specs and details for the ${bike.year} ${bike.brandName} - ${bike.variantName}.`,
    url: `${SITE_URL}/bikes/${bike.slug}`,
    brand: { '@type': 'Brand', name: bike.brandName },
    model: bike.variantName,
    category: bike.categoryName,
    image: bike.images.map((image) => image.blobUrl),
    additionalProperty: bike.specGroups.flatMap((group) =>
      group.specs.flatMap((spec) => {
        if (
          spec.value === null ||
          spec.value === undefined ||
          typeof spec.value === 'object'
        ) {
          return [];
        }

        return [
          {
            '@type': 'PropertyValue',
            name: spec.label,
            value: spec.value,
            ...(spec.unit ? { unitText: spec.unit } : {}),
          },
        ];
      })
    ),
  };
  const productJsonLdString = JSON.stringify(productJsonLd).replace(
    /</g,
    '\\u003c'
  );

  return (
    <PageShell bare>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: productJsonLdString }}
      />
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <Sidebar>
          {comparedWith.length > 0 && (
            <SidebarSection
              title={`${bike.variantName} is usually compared to`}
            >
              <div className="flex flex-col">
                {comparedWith.map(({ bike: other }) => (
                  <SidebarLink
                    key={other.id}
                    href={`/bikes/${other.slug}`}
                  >
                    {other.variantName}
                  </SidebarLink>
                ))}
              </div>
            </SidebarSection>
          )}
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

        <div className="min-w-0 flex-1 bg-brand-content p-6 shadow-lg">
          <p className="text-sm text-brand-grey">{bike.categoryName}</p>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {bike.brandName} - {bike.variantName}
          </h1>
          <p className="mt-1 text-lg text-brand-grey">
            {bike.year}{' '}
            {bike.msrpPrice ? `· $${bike.msrpPrice.toLocaleString()}` : ''}
          </p>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BikeImageGallery
              images={bike.images}
              alt={`${bike.brandName} - ${bike.variantName}`}
            />

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
                        className=" border border-zinc-200 p-3"
                      >
                        <p className="text-xs text-brand-grey">{spec.label}</p>
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
              </div>
            </div>
          </div>

          {comparedWith.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-3">
                {bike.brandName} - {bike.variantName} is usually compared to
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {comparedWith.map(({ bike: other, compareCount }) => (
                  <div
                    key={other.id}
                    className="flex gap-3 border border-zinc-200 p-3"
                  >
                    <div className="relative h-20 w-28 shrink-0 bg-zinc-100 overflow-hidden">
                      {other.primaryImageUrl && (
                        <Image
                          src={other.primaryImageVariants?.small ?? other.primaryImageUrl}
                          alt={`${other.brandName} - ${other.variantName}`}
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {other.brandName} - {other.variantName}
                      </p>
                      <p className="text-xs text-brand-grey">
                        Compared {compareCount}{' '}
                        {compareCount === 1 ? 'time' : 'times'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Link href={`/bikes/${other.slug}`}>
                          <Button variant="black">View specs</Button>
                        </Link>
                        <Link href={`/compare?ids=${bike.id},${other.id}`}>
                          <Button variant="gold">View comparison</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href={`/compare?ids=${[bike.id, ...comparedWith.map((c) => c.bike.id)].join(',')}`}
                className="mt-3 inline-block text-sm font-semibold text-brand-button hover:underline"
              >
                Compare all {comparedWith.length + 1} bikes
              </Link>
            </div>
          )}

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
                        <td className="py-1.5 text-brand-grey">{spec.label}</td>
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
            <p className="text-sm text-brand-grey italic">
              Coming soon — user reviews and opinions.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
