'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { trackUserInterest } from '@/lib/user-interest';

export default function SearchResultLink({ href, bikeId, isSearch, children }: {
  href: string;
  bikeId: number;
  isSearch: boolean;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow"
      onClick={() => {
        if (isSearch) {
          trackUserInterest({ type: 'bike_search_selection', id: bikeId });
        }
      }}>
      {children}
    </Link>
  );
}
