export interface BrandDto {
  id: number;
  name: string;
  logoBlobUrl: string | null;
}

export interface CategoryDto {
  id: number;
  name: string;
}

export interface BikeImageDto {
  id: number;
  blobUrl: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface BikeListItemDto {
  id: number;
  modelId: number;
  modelName: string;
  variantName: string;
  year: number;
  msrpPrice: number | null;
  slug: string;
  brandName: string;
  categoryName: string;
  primaryImageUrl: string | null;
}

export interface SpecValueDto {
  code: string;
  label: string;
  unit: string | null;
  sortOrder: number;
  value: unknown;
}

export interface SpecGroupWithValuesDto {
  code: string;
  name: string;
  sortOrder: number;
  specs: SpecValueDto[];
}

export interface BikeDetailDto {
  id: number;
  modelId: number;
  modelName: string;
  variantName: string;
  year: number;
  msrpPrice: number | null;
  slug: string;
  brandName: string;
  categoryName: string;
  images: BikeImageDto[];
  specGroups: SpecGroupWithValuesDto[];
}

export interface SpecDefinitionDto {
  id: number;
  code: string;
  label: string;
  dataType: string;
  unit: string | null;
  sortOrder: number;
  isFilterable: boolean;
  filterType: string | null;
}

export interface SpecGroupDto {
  id: number;
  code: string;
  name: string;
  sortOrder: number;
  iconName: string | null;
  definitions: SpecDefinitionDto[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CompareBikeSummaryDto {
  id: number;
  modelId: number;
  modelName: string;
  variantName: string;
  brandName: string;
  slug: string;
  primaryImageUrl: string | null;
}

export interface CompareSpecRowDto {
  code: string;
  label: string;
  unit: string | null;
  valuesByBikeId: Record<string, unknown>;
}

export interface CompareSpecGroupDto {
  code: string;
  name: string;
  sortOrder: number;
  rows: CompareSpecRowDto[];
}

export interface CompareResultDto {
  bikes: CompareBikeSummaryDto[];
  specGroups: CompareSpecGroupDto[];
}

export interface BikesQuery {
  page?: number;
  pageSize?: number;
  sortBy?: "price" | "year" | "model_name";
  sortDescending?: boolean;
  brandId?: string;
  categoryId?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  specCode?: string;
  specValue?: string;
  specMin?: string;
  specMax?: string;
  specValues?: string;
}
