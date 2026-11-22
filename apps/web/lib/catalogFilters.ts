import type { SpecGroupDto } from '@/lib/types';

export const CATALOG_PAGE_SIZE = 24;

export const catalogSortFields = [
  ['brand', 'Brand'],
  ['category', 'Category'],
  ['model_name', 'Model name'],
  ['variant_name', 'Variant name'],
  ['year', 'Year'],
  ['price', 'Price'],
] as const;

export type CatalogSortField = (typeof catalogSortFields)[number][0];

export interface CatalogSortCriterion {
  field: CatalogSortField;
  descending: boolean;
}

export const rangeFields = [
  ['yearMin', 'Year from', true, 1, 2147483647],
  ['yearMax', 'Year to', true, 1, 2147483647],
  ['priceMin', 'Minimum price ($)', false, 0, 1000000000000],
  ['priceMax', 'Maximum price ($)', false, 0, 1000000000000],
  ['ccMin', 'Minimum displacement (cc)', false, 0, 1000000000000],
  ['ccMax', 'Maximum displacement (cc)', false, 0, 1000000000000],
] as const;

const browseParamKeys = [
  'search', 'brandId', 'categoryId', ...rangeFields.map(([key]) => key),
  'sort', 'page',
] as const;

export function getBrowseParams(params: Record<string, string | string[] | undefined>) {
  const result: Record<string, string | undefined> = {};
  for (const key of browseParamKeys) {
    const value = params[key];
    if (typeof value === 'string' && value) {
      result[key] = value;
    }
  }
  return result;
}

export function isDisplacementFilterAvailable(specGroups: SpecGroupDto[]) {
  return specGroups.some((group) => group.definitions.some(
    (definition) => definition.code === 'cc' && definition.isFilterable && definition.filterType === 'range'
  ));
}

export function getCatalogSorts(
  sort: string | undefined,
  legacy: {
    sortBy?: string;
    sortDescending?: string;
    thenSortBy?: string;
    thenSortDescending?: string;
  }
): CatalogSortCriterion[] {
  if (sort) {
    const parsed: CatalogSortCriterion[] = [];
    for (const rule of sort.split(',')) {
      const [field, direction] = rule.split(':');
      if (
        catalogSortFields.some(([knownField]) => knownField === field) &&
        (direction === 'asc' || direction === 'desc') &&
        !parsed.some((criterion) => criterion.field === field)
      ) {
        parsed.push({ field: field as CatalogSortField, descending: direction === 'desc' });
      }
    }
    if (parsed.length > 0) {
      return parsed;
    }
  }

  const primaryField = catalogSortFields.some(([field]) => field === legacy.sortBy)
    ? legacy.sortBy as CatalogSortField
    : 'model_name';
  const criteria: CatalogSortCriterion[] = [{
    field: primaryField,
    descending: legacy.sortDescending === 'true',
  }];
  const secondaryField = catalogSortFields.find(([field]) => field === legacy.thenSortBy)?.[0];
  if (secondaryField && secondaryField !== primaryField) {
    criteria.push({
      field: secondaryField,
      descending: legacy.thenSortDescending === 'true',
    });
  }
  return criteria;
}

export function serializeCatalogSorts(criteria: CatalogSortCriterion[]) {
  return criteria.map(({ field, descending }) => `${field}:${descending ? 'desc' : 'asc'}`).join(',');
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

export function buildBikeDetailHref(slug: string, params: Record<string, string | undefined>) {
  const browseHref = buildBrowseHref(getBrowseParams(params));
  return `/bikes/${encodeURIComponent(slug)}${browseHref.slice('/bikes'.length)}`;
}
