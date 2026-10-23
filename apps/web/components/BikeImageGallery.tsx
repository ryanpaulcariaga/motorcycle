'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { BikeImageDto } from '@/lib/types';

interface BikeImageGalleryProps {
  images: BikeImageDto[];
  alt: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

export default function BikeImageGallery({
  images,
  alt,
}: BikeImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const activeImage = activeIndex === null ? null : images[activeIndex];
  const isOpen = activeIndex !== null;

  useEffect(() => {
    if (!isOpen) {
      openerRef.current?.focus();
      openerRef.current = null;
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveIndex(null);
      } else if (event.key === 'ArrowLeft' && images.length > 1) {
        setActiveIndex((index) =>
          index === null ? null : (index - 1 + images.length) % images.length
        );
        setZoom(MIN_ZOOM);
      } else if (event.key === 'ArrowRight' && images.length > 1) {
        setActiveIndex((index) =>
          index === null ? null : (index + 1) % images.length
        );
        setZoom(MIN_ZOOM);
      } else if (event.key === '+' || event.key === '=') {
        setZoom((current) => Math.min(MAX_ZOOM, current + ZOOM_STEP));
      } else if (event.key === '-') {
        setZoom((current) => Math.max(MIN_ZOOM, current - ZOOM_STEP));
      } else if (event.key === 'Tab') {
        const buttons =
          dialogRef.current?.querySelectorAll<HTMLButtonElement>(
            'button:not(:disabled)'
          );
        const firstButton = buttons?.[0];
        const lastButton = buttons?.[buttons.length - 1];

        if (firstButton && lastButton) {
          if (event.shiftKey && document.activeElement === firstButton) {
            event.preventDefault();
            lastButton.focus();
          } else if (!event.shiftKey && document.activeElement === lastButton) {
            event.preventDefault();
            firstButton.focus();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, images.length]);

  function openImage(index: number, trigger: HTMLButtonElement) {
    openerRef.current = trigger;
    setZoom(MIN_ZOOM);
    setActiveIndex(index);
  }

  function changeImage(direction: -1 | 1) {
    setActiveIndex((index) =>
      index === null ? null : (index + direction + images.length) % images.length
    );
    setZoom(MIN_ZOOM);
  }

  return (
    <>
      <div id="pictures">
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
          {images[0] && (
            <button
              type="button"
              className="absolute inset-0 block h-full w-full cursor-zoom-in"
              aria-label={`Open image 1 of ${images.length}`}
              onClick={(event) => openImage(0, event.currentTarget)}
            >
              <Image
                src={images[0].variants?.large ?? images[0].blobUrl}
                alt={alt}
                fill
                className="object-cover"
                sizes="(max-width: 1023px) 100vw, 50vw"
                priority
              />
            </button>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {images.slice(1).map((image, index) => (
              <button
                key={image.id}
                type="button"
                className="relative aspect-square cursor-zoom-in overflow-hidden bg-zinc-100"
                aria-label={`Open image ${index + 2} of ${images.length}`}
                onClick={(event) => openImage(index + 1, event.currentTarget)}
              >
                <Image
                  src={image.variants?.small ?? image.blobUrl}
                  alt={alt}
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {activeImage && activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} image viewer`}
          ref={dialogRef}
          tabIndex={-1}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setActiveIndex(null);
            }
          }}
        >
          <div className="flex items-center justify-between gap-4 p-4">
            <p className="text-sm" aria-live="polite">
              {activeIndex + 1} of {images.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-2 text-lg transition-colors hover:bg-brand-gold hover:text-brand-black disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white"
                aria-label="Zoom out"
                disabled={zoom <= MIN_ZOOM}
                onClick={() =>
                  setZoom((current) =>
                    Math.max(MIN_ZOOM, current - ZOOM_STEP)
                  )
                }
              >
                −
              </button>
              <span className="min-w-12 text-center text-sm">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                className="px-3 py-2 text-lg transition-colors hover:bg-brand-gold hover:text-brand-black disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white"
                aria-label="Zoom in"
                disabled={zoom >= MAX_ZOOM}
                onClick={() =>
                  setZoom((current) =>
                    Math.min(MAX_ZOOM, current + ZOOM_STEP)
                  )
                }
              >
                +
              </button>
              <button
                type="button"
                className="ml-2 px-3 py-2 text-sm transition-colors hover:bg-brand-gold hover:text-brand-black"
                onClick={() => setActiveIndex(null)}
              >
                Close
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-auto">
            <div className="absolute inset-0 flex items-center justify-center overflow-auto">
              <div
                className="relative h-full w-full shrink-0 transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
              >
                <Image
                  src={activeImage.variants?.xl ?? activeImage.variants?.large ?? activeImage.blobUrl}
                  alt={alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 px-4 py-3 transition-colors hover:bg-brand-gold hover:text-brand-black"
                  aria-label="Previous image"
                  onClick={() => changeImage(-1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 px-4 py-3 transition-colors hover:bg-brand-gold hover:text-brand-black"
                  aria-label="Next image"
                  onClick={() => changeImage(1)}
                >
                  Next
                </button>
              </>
            )}
          </div>
          <p className="p-3 text-center text-xs text-white/70">
            Use + and − to zoom, arrow keys to change images, or Esc to close.
          </p>
        </div>
      )}
    </>
  );
}
