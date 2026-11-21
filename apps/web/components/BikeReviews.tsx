'use client';

import { useEffect, useState } from 'react';
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
  const [reviews, setReviews] = useState(initialReviews);
  const [mine, setMine] = useState<BikeReviewDto | null>(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
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
  }, [bikeId]);

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
      setMessage('Your review was removed.');
    } catch {
      setMessage('Your review could not be removed. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="mt-8" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="reviews-heading" className="text-xl font-bold">Ratings and comments</h2>
        <p className="text-sm font-semibold text-brand-button">
          {reviews.averageRating === null
            ? 'No ratings yet'
            : `${reviews.averageRating.toFixed(1)} / 5 · ${reviews.ratingCount} ${
                reviews.ratingCount === 1 ? 'rating' : 'ratings'
              }`}
        </p>
      </div>

      {loadingSession ? null : isSignedIn ? (
        <form onSubmit={handleSubmit} className="mt-4 border border-zinc-200 p-4">
          <fieldset>
            <legend className="font-semibold">{mine ? 'Edit your review' : 'Add your review'}</legend>
            <div className="mt-2 flex gap-1" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="min-h-10 min-w-10 text-2xl text-brand-gold"
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
            Comment <span className="font-normal text-brand-grey">(optional)</span>
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
              className="bg-brand-button px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : mine ? 'Save changes' : 'Post review'}
            </button>
            {mine && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="border border-zinc-400 px-4 py-2 font-semibold disabled:opacity-50"
              >
                {deleting ? 'Removing…' : 'Remove review'}
              </button>
            )}
            <span className="text-sm text-brand-grey" role="status">{message}</span>
          </div>
        </form>
      ) : (
        <div className="mt-4 border border-zinc-200 p-4">
          <a href={facebookSignInUrl()} className="font-semibold text-brand-button underline">
            Sign in with Facebook to rate or comment on this bike.
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
    </section>
  );
}
