import type { ReviewStatus } from './types';

export const reviewStatusOptions: { value: ReviewStatus; label: string }[] = [
  { value: 'notReviewed', label: 'Not reviewed' },
  { value: 'inReview', label: 'In review' },
  { value: 'reviewed', label: 'Reviewed' },
];
