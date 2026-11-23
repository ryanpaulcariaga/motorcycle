'use client';

import type { ReactNode } from 'react';
import { markSearchSubmitted, trackAnalytics } from '@/lib/analytics';

export default function AnalyticsFilterForm({ children }: { children: ReactNode }) {
  return (
    <form
      action="/bikes"
      className="text-brand-black"
      onInvalidCapture={(event) => {
        if (event.target instanceof HTMLElement) {
          event.target.closest('details')?.setAttribute('open', '');
        }
      }}
      onSubmit={(event) => {
        const data = new FormData(event.currentTarget);
        if (typeof data.get('search') === 'string' && String(data.get('search')).trim()) {
          markSearchSubmitted();
        }
        for (const [field, type] of [['brandId', 'brand_filter'], ['categoryId', 'category_filter']] as const) {
          const value = Number(data.get(field));
          if (Number.isInteger(value) && value > 0) {
            trackAnalytics({ type, id: value });
          }
        }
      }}
    >
      {children}
    </form>
  );
}
