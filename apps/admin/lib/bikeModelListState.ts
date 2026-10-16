import {
  parseSortRules,
  serializeSortRules,
  type SortRule,
} from '@/lib/multiSort';

export const bikeModelSortFields = ['brand', 'category', 'name'] as const;
export type BikeModelSortField = (typeof bikeModelSortFields)[number];
export const defaultBikeModelSort: SortRule<BikeModelSortField>[] = [
  { field: 'brand', direction: 'asc' },
];

export type BikeModelListState = {
  brandFilter: string;
  categoryFilter: string;
  sort: SortRule<BikeModelSortField>[];
};

export function parseBikeModelListState(search: string): BikeModelListState {
  const params = new URLSearchParams(search);
  const brandId = params.get('brandId') ?? '';
  const categoryId = params.get('categoryId') ?? '';
  const isValidId = (id: string) =>
    /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0;

  return {
    brandFilter: isValidId(brandId) ? brandId : '',
    categoryFilter: isValidId(categoryId) ? categoryId : '',
    sort: parseSortRules(
      params.get('sort'),
      params.get('direction'),
      bikeModelSortFields,
      defaultBikeModelSort
    ),
  };
}

export function getBikeModelListSearch(search: string): string {
  const listState = parseBikeModelListState(search);
  return serializeBikeModelListState(listState);
}

export function serializeBikeModelListState(
  listState: BikeModelListState
): string {
  const params = new URLSearchParams();
  if (listState.brandFilter) {params.set('brandId', listState.brandFilter);}
  if (listState.categoryFilter)
    {params.set('categoryId', listState.categoryFilter);}
  const sort = serializeSortRules(listState.sort, defaultBikeModelSort);
  if (sort) {params.set('sort', sort);}
  const query = params.toString();
  return query ? `?${query}` : '';
}
