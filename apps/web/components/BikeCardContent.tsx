import Image from 'next/image';
import type { ReactNode } from 'react';
import type { BikeListItemDto } from '@/lib/types';

export default function BikeCardContent({ bike, children }: {
  bike: BikeListItemDto;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 p-3 sm:block sm:p-0">
      <div className="relative h-20 w-28 shrink-0 overflow-hidden bg-zinc-100 sm:aspect-[4/3] sm:h-auto sm:w-full">
        {bike.primaryImageUrl && (
          <Image
            src={bike.primaryImageVariants?.medium ?? bike.primaryImageUrl}
            alt={bike.variantName}
            fill
            className="object-cover"
            sizes="(max-width: 639px) 112px, (max-width: 1024px) 50vw, 33vw"
          />
        )}
      </div>
      <div className="min-w-0 flex-1 break-words sm:p-2">
        {children}
      </div>
    </div>
  );
}
