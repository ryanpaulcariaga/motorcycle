'use client';

import type { ReactNode } from 'react';
import { trackAnalytics } from '@/lib/analytics';

export default function AnalyticsFilterForm({ children }: { children: ReactNode }) {
  return (
    <form
      action="/bikes"
      className="mt-4 border-t border-white/20 pt-4"
      onInvalidCapture={(event) => {
        if (event.target instanceof HTMLElement) {
          event.target.closest('details')?.setAttribute('open', '');
        }
      }}
      onSubmit={(event) => {
        const data = new FormData(event.currentTarget);
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
