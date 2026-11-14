import type { SpecGroupDto } from '@/lib/types';

export const rangeFields = [
  ['yearMin', 'Year from', true, 1, 2147483647],
  ['yearMax', 'Year to', true, 1, 2147483647],
  ['priceMin', 'Minimum price ($)', false, 0, 1000000000000],
  ['priceMax', 'Maximum price ($)', false, 0, 1000000000000],
  ['ccMin', 'Minimum displacement (cc)', false, 0, 1000000000000],
  ['ccMax', 'Maximum displacement (cc)', false, 0, 1000000000000],
] as const;

export function isDisplacementFilterAvailable(specGroups: SpecGroupDto[]) {
  return specGroups.some((group) => group.definitions.some(
    (definition) => definition.code === 'cc' && definition.isFilterable && definition.filterType === 'range'
  ));
}

export function buildBrowseHref(
  params: Record<string, string | undefined>,
  overrides: Record<string, string | number | undefined> = {}
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...overrides })) {
    if (value) {
      query.set(key, String(value));
    }
  }
  const search = query.toString();
  return search ? `/bikes?${search}` : '/bikes';
}
