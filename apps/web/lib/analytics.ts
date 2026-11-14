'use client';

import { sendAnalyticsEvent } from '@/lib/api';
import type { AnalyticsEvent } from '@/lib/types';
import { trackUserInterest } from '@/lib/user-interest';

export const CONSENT_KEY = 'mc_analytics_consent';
const SEARCH_PENDING_KEY = 'mc_analytics_search_pending';
export const CONSENT_CHANGE_EVENT = 'mc-analytics-consent-change';

export function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'yes';
  } catch (error) {
    console.error('Unable to read analytics preference.', error);
    return false;
  }
}

export function trackAnalytics(event: AnalyticsEvent): void {
  if (event.type !== 'search') {
    trackUserInterest(event);
  }
  if (!hasAnalyticsConsent()) {
    return;
  }
  void sendAnalyticsEvent(event).catch((error: unknown) => {
    console.error('Analytics event could not be recorded.', error);
  });
}

export function markSearchSubmitted(): void {
  if (!hasAnalyticsConsent()) {
    return;
  }
  try {
    sessionStorage.setItem(SEARCH_PENDING_KEY, String(Date.now()));
  } catch (error) {
    console.error('Unable to record search submission.', error);
  }
}

export function consumeSearchSubmitted(): boolean {
  try {
    const submittedAt = Number(sessionStorage.getItem(SEARCH_PENDING_KEY));
    sessionStorage.removeItem(SEARCH_PENDING_KEY);
    return submittedAt > 0 && Date.now() - submittedAt >= 0 &&
      Date.now() - submittedAt < 120000 && hasAnalyticsConsent();
  } catch (error) {
    console.error('Unable to read search submission.', error);
    return false;
  }
}
