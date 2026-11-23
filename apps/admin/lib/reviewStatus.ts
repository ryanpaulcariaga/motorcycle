import type { ReviewStatus } from './types';

export const reviewStatusOptions: { value: ReviewStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'inProgress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];
