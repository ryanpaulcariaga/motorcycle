'use client';

import { useEffect, useState } from 'react';
import {
  createBikeComment,
  deleteBikeComment,
  facebookSignInUrl,
  getMyBikeComments,
  getUserSession,
  updateBikeComment,
} from '@/lib/api';
import type { BikeCommentDto } from '@/lib/types';

interface BikeCommentsProps {
  bikeId: number;
  initialComments: BikeCommentDto[];
}

export default function BikeComments({ bikeId, initialComments }: BikeCommentsProps) {
  const [comments, setComments] = useState(initialComments);
  const [mineIds, setMineIds] = useState<Set<number>>(new Set());
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [body, setBody] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([getUserSession(), getMyBikeComments(bikeId)])
      .then(([session, mine]) => {
        if (!cancelled) {
          setIsSignedIn(Boolean(session));
          setMineIds(new Set(mine.map((comment) => comment.id)));
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

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) {
      setMessage('Enter a comment before posting.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const created = await createBikeComment(bikeId, body);
      setBody('');
      setComments((current) => [created, ...current]);
      setMineIds((current) => new Set(current).add(created.id));
      setMessage('Your comment was posted.');
    } catch {
      setMessage('Your comment could not be posted. Please sign in and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(commentId: number) {
    if (!editingBody.trim()) {
      setMessage('A comment cannot be empty.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const updated = await updateBikeComment(bikeId, commentId, editingBody);
      setComments((current) =>
        current.map((comment) => comment.id === commentId ? updated : comment),
      );
      setEditingId(null);
      setEditingBody('');
      setMessage('Your comment was updated.');
    } catch {
      setMessage('Your comment could not be updated. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(commentId: number) {
    setDeletingId(commentId);
    setMessage('');
    try {
      await deleteBikeComment(bikeId, commentId);
      setComments((current) => current.filter((comment) => comment.id !== commentId));
      setMineIds((current) => {
        const next = new Set(current);
        next.delete(commentId);
        return next;
      });
      setMessage('Your comment was removed.');
    } catch {
      setMessage('Your comment could not be removed. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mt-10 border-t border-zinc-200 pt-6" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="text-xl font-bold">Questions &amp; comments</h2>
      <p className="mt-1 text-sm text-brand-grey">
        Ask a question or share information without leaving a rating.
      </p>

      {loadingSession ? null : isSignedIn ? (
        <form onSubmit={handleCreate} className="mt-4 border border-zinc-200 p-4">
          <label className="block text-sm font-semibold" htmlFor="bike-comment-body">
            Add a comment
          </label>
          <textarea
            id="bike-comment-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={1000}
            rows={4}
            className="mt-1 w-full border border-zinc-300 bg-white p-3"
            placeholder="Ask a question or share a useful tip."
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving || !body.trim()}
              className="bg-brand-button px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Posting…' : 'Post comment'}
            </button>
            <span className="text-sm text-brand-grey" role="status">{message}</span>
          </div>
        </form>
      ) : (
        <div className="mt-4 border border-zinc-200 p-4">
          <a href={facebookSignInUrl()} className="font-semibold text-brand-button underline">
            Sign in with Facebook to join the conversation.
          </a>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {comments.map((comment) => {
          const isMine = mineIds.has(comment.id);
          const isEditing = editingId === comment.id;
          return (
            <article key={comment.id} className="border border-zinc-200 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">{comment.authorName}</h3>
                <p className="text-xs text-brand-grey">
                  {new Date(comment.updatedAt).toLocaleDateString()}
                  {isMine ? ' · Yours' : ''}
                </p>
              </div>
              {isEditing ? (
                <div className="mt-3">
                  <textarea
                    value={editingBody}
                    onChange={(event) => setEditingBody(event.target.value)}
                    maxLength={1000}
                    rows={4}
                    aria-label="Edit comment"
                    className="w-full border border-zinc-300 bg-white p-3"
                  />
                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      disabled={saving || !editingBody.trim()}
                      onClick={() => void handleUpdate(comment.id)}
                      className="bg-brand-button px-4 py-2 font-semibold text-white disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditingBody('');
                      }}
                      className="border border-zinc-400 px-4 py-2 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 whitespace-pre-wrap break-words">{comment.body}</p>
              )}
              {isMine && !isEditing && (
                <div className="mt-3 flex gap-4 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditingBody(comment.body);
                    }}
                    className="text-brand-button underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === comment.id}
                    onClick={() => void handleDelete(comment.id)}
                    className="underline disabled:opacity-50"
                  >
                    {deletingId === comment.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              )}
            </article>
          );
        })}
        {comments.length === 0 && (
          <p className="text-sm text-brand-grey">No comments yet. Start the conversation.</p>
        )}
      </div>
    </section>
  );
}
