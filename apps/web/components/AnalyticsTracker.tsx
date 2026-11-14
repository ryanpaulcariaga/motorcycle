'use client';

import { useEffect, useRef } from 'react';
import { consumeSearchSubmitted, trackAnalytics } from '@/lib/analytics';

type Props =
  | { kind: 'bike'; bikeId: number }
  | { kind: 'comparison'; bikeIds: number[] }
  | { kind: 'search'; hasSearch: boolean; zeroResults: boolean };

export default function AnalyticsTracker(props: Props) {
  const key = JSON.stringify(props);
  const last = useRef('');
  useEffect(() => {
    if (last.current === key) {
      return;
    }
    last.current = key;
    const event = JSON.parse(key) as Props;
    if (event.kind === 'bike') {
      trackAnalytics({ type: 'bike_view', id: event.bikeId });
    } else if (event.kind === 'comparison' && event.bikeIds.length >= 2 && event.bikeIds.length <= 25) {
      trackAnalytics({ type: 'comparison', bikeIds: event.bikeIds });
    } else if (event.kind === 'search' && consumeSearchSubmitted() && event.hasSearch) {
      trackAnalytics({ type: 'search', zeroResults: event.zeroResults });
    }
  }, [key]);
  return null;
}
