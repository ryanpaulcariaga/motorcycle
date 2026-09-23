'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import {
  AdminApiError,
  deleteAdminBikeImage,
  getAdminBikeImages,
  reorderAdminBikeImages,
  setAdminBikeImagePrimary,
  uploadAdminBikeImage,
} from '@/lib/api';
import type { BikeImage } from '@/lib/types';

export default function BikeImageManagement({ bikeId }: { bikeId: number }) {
  const [images, setImages] = useState<BikeImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setError(null);
    try {
      setImages(await getAdminBikeImages(bikeId));
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : 'Unable to load images.');
    }
  }

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [bikeId]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await uploadAdminBikeImage(bikeId, file);
      await load();
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : 'Unable to upload image.');
    } finally {
      setBusy(false);
    }
  }

  async function makePrimary(imageId: number) {
    setBusy(true);
    try {
      await setAdminBikeImagePrimary(bikeId, imageId);
      await load();
    } catch {
      setError('Unable to set the primary image.');
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setBusy(true);
    try {
      setImages(await reorderAdminBikeImages(bikeId, next.map((image) => image.id)));
    } catch {
      setError('Unable to reorder images.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(image: BikeImage) {
    if (!window.confirm('Delete this image?')) return;
    setBusy(true);
    try {
      await deleteAdminBikeImage(bikeId, image.id);
      await load();
    } catch {
      setError('Unable to delete image.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 border-t border-white/20 pt-6">
      <h2 className="text-xl font-bold">Images</h2>
      <label className="mt-4 block text-sm font-semibold" htmlFor="bike-image-upload">
        Upload image
      </label>
      <input
        className="mt-2 block w-full text-sm"
        id="bike-image-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(event) => void upload(event)}
        disabled={busy}
      />
      {error && <p className="mt-3 text-sm text-red-200" role="alert">{error}</p>}
      {images.length === 0 ? (
        <p className="mt-4 text-sm text-white/70">No images assigned.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {images.map((image, index) => (
            <div className="flex items-center gap-3 bg-white/10 p-2" key={image.id}>
              <img src={image.blobUrl} alt="Bike" width={80} height={56} className="h-14 w-20 object-cover" />
              <div className="min-w-0 flex-1 text-xs">
                {image.isPrimary && <p className="font-bold text-brand-gold">Primary</p>}
                <a className="block truncate underline" href={image.blobUrl} target="_blank" rel="noreferrer">Open image</a>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <button type="button" onClick={() => void move(index, -1)} disabled={busy || index === 0}>Up</button>
                <button type="button" onClick={() => void move(index, 1)} disabled={busy || index === images.length - 1}>Down</button>
                {!image.isPrimary && <button type="button" onClick={() => void makePrimary(image.id)} disabled={busy}>Primary</button>}
                <button className="text-red-200" type="button" onClick={() => void remove(image)} disabled={busy}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
