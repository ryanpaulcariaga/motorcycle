import Image from 'next/image';
import type { ReactNode } from 'react';
import type { BikeListItemDto } from '@/lib/types';

export default function BikeCardContent({ bike, children }: {
  bike: BikeListItemDto;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 p-3">
      <div className="relative h-20 w-28 shrink-0 overflow-hidden bg-zinc-100">
        {bike.primaryImageUrl && (
          <Image
            src={bike.primaryImageVariants?.medium ?? bike.primaryImageUrl}
            alt={bike.variantName}
            fill
            className="object-cover"
            sizes="112px"
          />
        )}
      </div>
      <div className="min-w-0 flex-1 break-words">
        {children}
      </div>
    </div>
  );
}
