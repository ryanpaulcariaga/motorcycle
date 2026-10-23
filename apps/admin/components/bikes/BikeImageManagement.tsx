'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { IconButton } from '@/components/IconButton';
import {
  AdminApiError,
  deleteAdminBikeImage,
  getAdminBikeImages,
  reorderAdminBikeImages,
  setAdminBikeImagePrimary,
  uploadAdminBikeImage,
} from '@/lib/api';
import type { BikeImage } from '@/lib/types';
import ImageCropper, { IMAGE_ASPECT, MIN_IMAGE_WIDTH } from './ImageCropper';

export default function BikeImageManagement({ bikeId }: { bikeId: number }) {
  const [images, setImages] = useState<BikeImage[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setError(null);
    try {
      setImages(await getAdminBikeImages(bikeId));
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to load images.'
      );
    }
  }

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [bikeId]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    let dimensions: ImageBitmap;
    try {
      dimensions = await createImageBitmap(file);
    } catch {
      setError('Unable to read image dimensions. Choose a valid image file.');
      return;
    }
    const { width, height } = dimensions;
    dimensions.close();
    if (Math.min(width, height * IMAGE_ASPECT) < MIN_IMAGE_WIDTH) {
      setError(
        `A 4:3 crop of this image would be under ${MIN_IMAGE_WIDTH} pixels wide. Choose a larger image.`
      );
      return;
    }

    setError(null);
    if (Math.abs(width / height / IMAGE_ASPECT - 1) <= 0.01) {
      await send(file);
    } else {
      setPendingFile(file);
    }
  }

  async function send(file: File) {
    setBusy(true);
    setError(null);
    try {
      await uploadAdminBikeImage(bikeId, file);
      setPendingFile(null);
      await load();
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to upload image.'
      );
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
    if (target < 0 || target >= images.length) {
      return;
    }
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setBusy(true);
    try {
      setImages(
        await reorderAdminBikeImages(
          bikeId,
          next.map((image) => image.id)
        )
      );
    } catch {
      setError('Unable to reorder images.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(image: BikeImage) {
    if (!window.confirm('Delete this image?')) {
      return;
    }
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
    <section className="mt-8">
      <label
        className="mt-4 block text-sm font-bold text-brand-button"
        htmlFor="bike-image-upload"
      >
        Upload image (10 MiB max)
      </label>
      <p className="mt-1 text-xs text-brand-grey">
        Upload the largest, highest-quality version available. Images are
        saved as 4:3 landscape and must be at least 1200 pixels wide after
        cropping; you can position and zoom the crop before uploading. Smaller
        WebP variants are generated automatically.
      </p>
      <input
        className="mt-2 block w-full cursor-pointer text-sm file:mr-3 file:cursor-pointer file:border-0 file:bg-brand-button file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-brand-sidebar disabled:cursor-not-allowed disabled:opacity-60"
        id="bike-image-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(event) => void upload(event)}
        disabled={busy || pendingFile !== null}
      />
      {pendingFile && (
        <ImageCropper
          file={pendingFile}
          busy={busy}
          onCancel={() => setPendingFile(null)}
          onConfirm={(cropped) => void send(cropped)}
        />
      )}
      {error && (
        <p className="mt-3 text-sm text-red-200" role="alert">
          {error}
        </p>
      )}
      {images.length === 0 ? (
        <p className="mt-4 text-sm text-brand-grey">No images assigned.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {images.map((image, index) => (
            <div
              className="flex items-center gap-3 bg-black/5 p-2"
              key={image.id}
            >
              <img
                src={image.variants?.small ?? image.blobUrl}
                alt="Bike"
                width={80}
                height={56}
                className="h-14 w-20 object-cover"
              />
              <div className="min-w-0 flex-1 text-xs">
                {image.isPrimary && (
                  <p className="font-bold text-brand-button">Primary</p>
                )}
                <p className="text-brand-grey">
                  {image.width > 0 && image.height > 0
                    ? `${image.width} × ${image.height} px`
                    : 'Dimensions not recorded'}
                </p>
                <p className="text-brand-grey">
                  Download:{' '}
                  {[
                    ['320', image.variants?.small],
                    ['640', image.variants?.medium],
                    ['1280', image.variants?.large],
                    ['2048', image.variants?.xl],
                    ['Original', image.blobUrl],
                  ]
                    .filter((item): item is [string, string] => Boolean(item[1]))
                    .map(([label, url], linkIndex) => (
                      <span key={label}>
                        {linkIndex > 0 && ', '}
                        <a
                          className="font-semibold text-brand-button underline"
                          href={url}
                          download
                          target="_blank"
                          rel="noreferrer"
                        >
                          {label}
                        </a>
                      </span>
                    ))}
                  {image.variants ? ' px' : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!image.isPrimary && (
                  <IconButton
                    icon="primary"
                    label="Set as primary image"
                    variant="gold"
                    onClick={() => void makePrimary(image.id)}
                    disabled={busy}
                  />
                )}
                <IconButton
                  icon="up"
                  label={`Move image ${index + 1} up`}
                  onClick={() => void move(index, -1)}
                  disabled={busy || index === 0}
                />
                <IconButton
                  icon="down"
                  label={`Move image ${index + 1} down`}
                  onClick={() => void move(index, 1)}
                  disabled={busy || index === images.length - 1}
                />
                <IconButton
                  icon="delete"
                  label="Delete image"
                  variant="danger"
                  onClick={() => void remove(image)}
                  disabled={busy}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
