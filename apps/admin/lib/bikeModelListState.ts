export type BikeModelSortField = 'brand' | 'category' | 'name';
export type BikeModelSortDirection = 'asc' | 'desc';

export type BikeModelListState = {
  brandFilter: string;
  categoryFilter: string;
  sortField: BikeModelSortField;
  sortDirection: BikeModelSortDirection;
};

export function parseBikeModelListState(search: string): BikeModelListState {
  const params = new URLSearchParams(search);
  const brandId = params.get('brandId') ?? '';
  const categoryId = params.get('categoryId') ?? '';
  const sort = params.get('sort');
  const isValidId = (id: string) =>
    /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0;

  return {
    brandFilter: isValidId(brandId) ? brandId : '',
    categoryFilter: isValidId(categoryId) ? categoryId : '',
    sortField:
      sort === 'category' || sort === 'name' || sort === 'brand'
        ? sort
        : 'brand',
    sortDirection: params.get('direction') === 'desc' ? 'desc' : 'asc',
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
  if (listState.brandFilter) params.set('brandId', listState.brandFilter);
  if (listState.categoryFilter)
    params.set('categoryId', listState.categoryFilter);
  if (listState.sortField !== 'brand') params.set('sort', listState.sortField);
  if (listState.sortDirection !== 'asc')
    params.set('direction', listState.sortDirection);
  const query = params.toString();
  return query ? `?${query}` : '';
}
