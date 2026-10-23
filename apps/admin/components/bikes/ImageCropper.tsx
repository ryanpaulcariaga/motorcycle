'use client';

import { useEffect, useMemo, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';

export const IMAGE_ASPECT = 4 / 3;
export const MIN_IMAGE_WIDTH = 1200;
const MAX_OUTPUT_WIDTH = 4096;

function outputSize(area: Area) {
  const width = Math.min(Math.round(area.width), MAX_OUTPUT_WIDTH);
  return { width, height: Math.round(width / IMAGE_ASPECT) };
}

export async function cropImage(
  file: File,
  area: Area
): Promise<File> {
  const image = await createImageBitmap(file, {
    imageOrientation: 'from-image',
  });

  const { width, height } = outputSize(area);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not available.');
  }
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    width,
    height
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.95)
  );
  if (!blob) {
    throw new Error('Unable to crop the image.');
  }
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
  image.close();
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
}

export default function ImageCropper({
  file,
  busy,
  onCancel,
  onConfirm,
}: {
  file: File;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
}) {
  const imageUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => URL.revokeObjectURL(imageUrl), [imageUrl]);

  const tooSmall = area !== null && area.width < MIN_IMAGE_WIDTH;

  async function confirm() {
    if (!area || tooSmall) {
      return;
    }
    setError(null);
    try {
      onConfirm(await cropImage(file, area));
    } catch {
      setError('Unable to crop the image.');
    }
  }

  return (
    <div className="mt-3 bg-black/5 p-3">
      <p className="text-xs text-brand-grey">
        Drag to position the image and use the slider to zoom. The selected 4:3
        area is saved as the original and used for every size.
      </p>
      <div className="relative mt-3 h-72 w-full bg-black">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={IMAGE_ASPECT}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setArea(pixels)}
        />
      </div>
      <label className="mt-3 block text-xs font-semibold" htmlFor="crop-zoom">
        Zoom
      </label>
      <input
        className="w-full"
        id="crop-zoom"
        type="range"
        min={1}
        max={4}
        step={0.01}
        value={zoom}
        onChange={(event) => setZoom(Number(event.target.value))}
      />
      {area && (
        <p className="mt-1 text-xs text-brand-grey">
          Output size: {outputSize(area).width} × {outputSize(area).height} px
        </p>
      )}
      {tooSmall && (
        <p className="mt-2 text-sm text-red-200" role="alert">
          The selected area is {Math.round(area.width)} pixels wide; it must be
          at least {MIN_IMAGE_WIDTH}. Zoom out.
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-200" role="alert">
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          className="bg-brand-button px-4 py-2 text-sm font-semibold text-white hover:bg-brand-sidebar disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={() => void confirm()}
          disabled={busy || !area || tooSmall}
        >
          Crop and upload
        </button>
        <button
          className="px-4 py-2 text-sm font-semibold text-brand-button underline disabled:opacity-60"
          type="button"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
