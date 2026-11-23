export interface BrandDto {
  id: number;
  name: string;
  logoBlobUrl: string | null;
}

export type AnalyticsEvent =
  | { type: 'bike_view' | 'brand_filter' | 'category_filter'; id: number }
  | { type: 'comparison'; bikeIds: number[] }
  | { type: 'search'; zeroResults: boolean };

export type UserInterestEvent =
  | { type: 'bike_view' | 'bike_search_selection' | 'brand_filter' | 'category_filter'; id: number }
  | { type: 'comparison'; bikeIds: number[] };

export interface UserInterestPreference {
  enabled: boolean;
}

export interface UserSessionDto {
  userId: number;
  email: string | null;
  displayName: string | null;
  isAdministrator: boolean;
}

export interface UserDataExport {
  schemaVersion: string;
  generatedAtUtc: string;
  account: {
    id: number;
    email: string | null;
    emailVerified: boolean;
    displayName: string | null;
    interestTrackingEnabled: boolean;
    createdAtUtc: string;
    updatedAtUtc: string;
  };
  externalLogins: Array<{
    provider: string;
    providerUserId: string;
    emailAtProvider: string | null;
    linkedAtUtc: string;
  }>;
  interestActivity: Array<{
    day: string;
    metric: string;
    catalogId: number;
    count: number;
  }>;
  reviews: Array<{
    id: number;
    bikeId: number;
    rating: number;
    body: string | null;
    createdAtUtc: string;
    updatedAtUtc: string;
  }>;
  comments: Array<{
    id: number;
    bikeId: number;
    body: string;
    createdAtUtc: string;
    updatedAtUtc: string;
  }>;
}

export interface BikeReviewDto {
  id: number;
  authorName: string;
  rating: number;
  body: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BikeReviewsDto {
  averageRating: number | null;
  ratingCount: number;
  reviews: BikeReviewDto[];
}

export interface BikeCommentDto {
  id: number;
  parentCommentId: number | null;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}


export interface CategoryDto {
  id: number;
  name: string;
}

export interface BikeImageDto {
  id: number;
  blobUrl: string;
  width: number;
  height: number;
  variants: BikeImageVariantsDto | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface BikeImageVariantsDto {
  small: string | null;
  medium: string | null;
  large: string | null;
  xl: string | null;
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
  isPublished: boolean;
  isTestData: boolean;
  modelIsTestData: boolean;
  primaryImageUrl: string | null;
  primaryImageVariants: BikeImageVariantsDto | null;
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
  isPublished: boolean;
  isTestData: boolean;
  modelIsTestData: boolean;
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
  primaryImageVariants: BikeImageVariantsDto | null;
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
  sort?: string;
  sortBy?: "price" | "year" | "model_name";
  sortDescending?: boolean;
  thenSortBy?: "price" | "year" | "model_name";
  thenSortDescending?: boolean;
  search?: string;
  includeDiscontinued?: boolean;
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

export interface PopularComparisonDto {
  bikeA: BikeListItemDto;
  bikeB: BikeListItemDto;
  compareCount: number;
}

export interface ComparedBikeDto {
  bike: BikeListItemDto;
  compareCount: number;
}

export interface FanRankedBikeDto {
  bike: BikeListItemDto;
  fanCount: number;
  averageRating: number;
}

export interface DailyInterestRankedBikeDto {
  bike: BikeListItemDto;
  viewCount: number;
}

export interface ContactInquiryRequest {
  name: string | null;
  email: string;
  message: string;
}
