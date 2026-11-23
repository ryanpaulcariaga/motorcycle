'use client';

import { useEffect, useState } from 'react';
import PageShell from '@/components/PageShell';
import BikeComments from '@/components/BikeComments';
import BikeImageGallery from '@/components/BikeImageGallery';
import BikeReviews from '@/components/BikeReviews';
import {
  getBikeBySlug,
  getBikeComments,
  getBikeReviews,
} from '@/lib/api';
import type {
  BikeCommentDto,
  BikeDetailDto,
  BikeReviewsDto,
} from '@/lib/types';

export default function TestBikeDetailFallback({ slug }: { slug: string }) {
  const [bike, setBike] = useState<BikeDetailDto | null>(null);
  const [reviews, setReviews] = useState<BikeReviewsDto | null>(null);
  const [comments, setComments] = useState<BikeCommentDto[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getBikeBySlug(slug)
      .then(async (result) => {
        const [bikeReviews, bikeComments] = await Promise.all([
          getBikeReviews(result.id),
          getBikeComments(result.id),
        ]);
        if (active) {
          setBike(result);
          setReviews(bikeReviews);
          setComments(bikeComments);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <PageShell>
        <p className="py-12 text-center text-brand-grey">Loading bike...</p>
      </PageShell>
    );
  }

  if (!bike || !reviews || !comments) {
    return (
      <PageShell>
        <h1 className="text-2xl font-bold">Bike not found</h1>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-4 border border-amber-700 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
        Test-data preview. This bike is visible only while signed in with an
        active administrator account that has test-data preview enabled in the
        admin Administrators tab.
      </div>
      <p className="text-sm text-brand-grey">{bike.categoryName}</p>
      <h1 className="text-2xl font-bold">{bike.variantName}</h1>
      <p className="mt-1 text-brand-grey">
        {bike.year}
        {bike.msrpPrice ? ` · $${bike.msrpPrice.toLocaleString()}` : ''}
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <BikeImageGallery images={bike.images} alt={bike.variantName} />
        <div>
          <BikeReviews bikeId={bike.id} initialReviews={reviews} />
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-bold">Full Specifications</h2>
        {bike.specGroups
          .filter((group) => group.specs.length > 0)
          .map((group) => (
            <div key={group.code}>
              <h3 className="mb-2 font-semibold text-brand-button">
                {group.name}
              </h3>
              <table className="w-full table-fixed text-sm">
                <tbody>
                  {group.specs.map((spec) => (
                    <tr key={spec.code} className="border-b border-zinc-100">
                      <td className="w-3/5 break-words py-1.5 text-brand-grey">
                        {spec.label}
                      </td>
                      <td className="break-words py-1.5 text-right font-medium">
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

      <BikeComments bikeId={bike.id} initialComments={comments} />
    </PageShell>
  );
}
