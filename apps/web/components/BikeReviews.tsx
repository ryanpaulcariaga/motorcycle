'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import {
  deleteBikeReview,
  facebookSignInUrl,
  getBikeReviews,
  getMyBikeReview,
  getUserSession,
  saveBikeReview,
} from '@/lib/api';
import type { BikeReviewDto, BikeReviewsDto } from '@/lib/types';

interface BikeReviewsProps {
  bikeId: number;
  initialReviews: BikeReviewsDto;
}

export default function BikeReviews({ bikeId, initialReviews }: BikeReviewsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [reviews, setReviews] = useState(initialReviews);
  const [mine, setMine] = useState<BikeReviewDto | null>(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    Promise.all([getUserSession(), getMyBikeReview(bikeId)])
      .then(([session, ownReview]) => {
        if (!cancelled) {
          setIsSignedIn(Boolean(session));
          setMine(ownReview);
          setRating(ownReview?.rating ?? 0);
          setBody(ownReview?.body ?? '');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsSignedIn(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSession(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bikeId, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  async function refreshReviews() {
    setReviews(await getBikeReviews(bikeId));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating < 1) {
      setMessage('Choose a rating from 1 to 5 stars.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const saved = await saveBikeReview(bikeId, { rating, body });
      setMine(saved);
      await refreshReviews();
      router.refresh();
      setMessage('Your review was saved.');
    } catch {
      setMessage('Your review could not be saved. Please sign in and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setMessage('');
    try {
      await deleteBikeReview(bikeId);
      setMine(null);
      setRating(0);
      setBody('');
      await refreshReviews();
      router.refresh();
      setMessage('Your review was removed.');
    } catch {
      setMessage('Your review could not be removed. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  function openReviews() {
    setLoadingSession(true);
    setIsOpen(true);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="black" onClick={openReviews}>
          User reviews
        </Button>
        <p className="text-sm font-semibold">
          {reviews.averageRating === null
            ? 'No ratings yet'
            : (
              <>
                <span className="text-brand-gold">★</span>{' '}
                {reviews.averageRating.toFixed(1)} / 5
                <span className="font-normal text-brand-grey">
                  {' '}({reviews.ratingCount})
                </span>
              </>
            )}
        </p>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reviews-heading"
          ref={dialogRef}
          tabIndex={-1}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <section className="flex max-h-[90dvh] w-full max-w-3xl flex-col bg-white shadow-lg">
            <div className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-black/10 p-4 md:p-6">
              <div>
                <h2 id="reviews-heading" className="text-xl font-bold">User ratings and reviews</h2>
                <p className="mt-1 text-sm font-semibold text-brand-button">
                  {reviews.averageRating === null
                    ? 'No ratings yet'
                    : `${reviews.averageRating.toFixed(1)} / 5 · ${reviews.ratingCount} ${
                        reviews.ratingCount === 1 ? 'rating' : 'ratings'
                      }`}
                </p>
              </div>
              <Button type="button" variant="grey" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 md:p-6">
              {loadingSession ? null : isSignedIn ? (
                <form onSubmit={handleSubmit} className="border border-zinc-200 p-4">
                  <fieldset>
                    <legend className="font-semibold">{mine ? 'Edit your review' : 'Add your review'}</legend>
                    <div className="mt-2 flex gap-1" aria-label="Rating">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          className="min-h-10 min-w-10 text-2xl text-brand-gold transition-colors hover:text-brand-button"
                          aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
                          aria-pressed={rating === value}
                          onClick={() => setRating(value)}
                        >
                          {value <= rating ? '★' : '☆'}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <label className="mt-3 block text-sm font-semibold" htmlFor="bike-review-body">
                    Review text <span className="font-normal text-brand-grey">(optional)</span>
                  </label>
                  <textarea
                    id="bike-review-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    maxLength={1000}
                    rows={4}
                    className="mt-1 w-full border border-zinc-300 bg-white p-3"
                    placeholder="Share your experience with this bike."
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={saving || rating < 1}
                      className="bg-brand-black px-4 py-2 font-semibold text-white transition-colors hover:bg-brand-button disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : mine ? 'Save changes' : 'Post review'}
                    </button>
                    {mine && (
                      <button
                        type="button"
                        onClick={() => void handleDelete()}
                        disabled={deleting}
                        className="border border-zinc-400 px-4 py-2 font-semibold transition-colors hover:bg-brand-button hover:text-white disabled:opacity-50"
                      >
                        {deleting ? 'Removing…' : 'Remove review'}
                      </button>
                    )}
                    <span className="text-sm text-brand-grey" role="status">{message}</span>
                  </div>
                </form>
              ) : (
                <div className="border border-zinc-200 p-4">
                  <a href={facebookSignInUrl()} className="font-semibold text-brand-button underline">
                    Sign in with Facebook to rate or review this bike.
                  </a>
                </div>
              )}

              <div className="mt-4 space-y-3">
                {reviews.reviews.map((review) => (
                  <article key={review.id} className="border border-zinc-200 p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-semibold">{review.authorName}</h3>
                      <p className="text-brand-gold" aria-label={`${review.rating} out of 5 stars`}>
                        {'★'.repeat(review.rating)}
                        <span className="text-zinc-300">{'★'.repeat(5 - review.rating)}</span>
                      </p>
                    </div>
                    {review.body && <p className="mt-2 whitespace-pre-wrap break-words">{review.body}</p>}
                    <p className="mt-2 text-xs text-brand-grey">
                      {new Date(review.updatedAt).toLocaleDateString()}
                      {review.id === mine?.id ? ' · Your review' : ''}
                    </p>
                  </article>
                ))}
                {reviews.reviews.length === 0 && (
                  <p className="text-sm text-brand-grey">Be the first rider to review this bike.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
