'use client';

import { getUserInterestPreference, sendUserInterestEvent } from '@/lib/api';
import type { UserInterestEvent, UserInterestPreference } from '@/lib/types';

let preference: Promise<UserInterestPreference | null> | null = null;

export function loadInterestPreference(): Promise<UserInterestPreference | null> {
  if (!preference) {
    const request = getUserInterestPreference().catch((error: unknown) => {
      if (preference === request) {
        preference = null;
      }
      throw error;
    });
    preference = request;
  }
  return preference;
}

export function updateCachedInterestPreference(value: UserInterestPreference | null): void {
  preference = Promise.resolve(value);
}

export function trackUserInterest(event: UserInterestEvent): void {
  void loadInterestPreference()
    .then((value) => value?.enabled ? sendUserInterestEvent(event) : undefined)
    .catch((error: unknown) => console.error('Interest event could not be recorded.', error));
}
