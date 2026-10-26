export type AdminRole = {
  id: number;
  facebookUserId: string;
  emailSnapshot: string | null;
  displayNameSnapshot: string | null;
  role: "Administrator";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BikeImportError = {
  row: number;
  column: string;
  message: string;
};

export type BikeImportResult = {
  created: number;
  updated: number;
  unchanged: number;
};

export type ApiError = {
  code?: string;
  message: string;
  errors?: BikeImportError[];
  fieldErrors?: Record<string, string[]>;
  dependentCount?: number;
  affectedBikeCount?: number;
  failures?: { bikeId: number; value: string; reason: string }[];
};

export type AdminSession = {
  facebookUserId: string;
  displayName: string | null;
};

export type AdminAuditLog = {
  id: number;
  occurredAt: string;
  actorId: string;
  actorDisplayName: string | null;
  action: string;
  entityType: string;
  entityKey: string | null;
  changedFields: string;
  requestId: string;
};

export type AdminAuditLogPage = {
  items: AdminAuditLog[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type CreateAdminRoleRequest = {
  facebookUserId: string;
  emailSnapshot: string;
  displayNameSnapshot: string;
  role: "Administrator";
};

export type UpdateAdminRoleRequest = {
  emailSnapshot: string;
  displayNameSnapshot: string;
  role: "Administrator";
  isActive: boolean;
};

export type BikeModel = {
  id: number;
  brandId: number;
  brandName: string;
  categoryId: number;
  categoryName: string;
  name: string;
  createdAt: string;
  bikeCount: number;
};

export type LookupOption = { id: number; name: string };
export type BikeModelRequest = { brandId: number; categoryId: number; name: string };

export type BikeAdminListItem = {
  id: number;
  modelId: number;
  modelName: string;
  brandName: string;
  variantName: string;
  year: number;
  msrpPrice: number | null;
  isPublished: boolean;
  isReviewed: boolean;
  createdAt: string;
  updatedAt: string;
  imageCount: number;
};

export type BikeAdminDetail = BikeAdminListItem & {
  slug: string;
  specs: Record<string, unknown>;
};

export type CreateBikeRequest = {
  modelId: number;
  variantName: string;
  year: number;
  msrpPrice: number | null;
  specs: Record<string, unknown>;
};

export type UpdateBikeRequest = {
  modelId?: number;
  variantName: string;
  year: number;
  msrpPrice: number | null;
  specs: Record<string, unknown>;
};

export type ReassignBikeModelRequest = { modelId: number };

export type BikeSpecValueItem = {
  id: number;
  modelName: string;
  brandName: string;
  categoryName: string;
  variantName: string;
  year: number;
  msrpPrice: number | null;
  isPublished: boolean;
  value: unknown;
};

export type SpecValueFilters = {
  brandId?: number;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  specCode: string;
};

export type UpdateSingleSpecRequest = {
  specCode: string;
  values: { bikeId: number; value: unknown }[];
};

export type BikeSpecGridRow = {
  id: number;
  modelName: string;
  brandName: string;
  categoryName: string;
  variantName: string;
  year: number;
  msrpPrice: number | null;
  isPublished: boolean;
  specs: Record<string, unknown>;
};

export type UpdateSpecGridRequest = {
  changes?: { bikeId: number; specCode: string; value: unknown }[];
  bikeChanges?: {
    bikeId: number;
    variantName: string;
    year: number;
    msrpPrice: number | null;
  }[];
};

export type BikeImage = {
  id: number;
  blobUrl: string;
  sortOrder: number;
  isPrimary: boolean;
  width: number;
  height: number;
  variants: BikeImageVariants | null;
};

export type BikeImageVariants = {
  small: string | null;
  medium: string | null;
  large: string | null;
  xl: string | null;
};

export type SpecGroupAdmin = {
  id: number;
  code: string;
  name: string;
  iconName: string | null;
  sortOrder: number;
  definitionCount: number;
};

export type SpecGroupRequest = { code: string; name: string; iconName: string | null };

export type SpecDefinitionAdmin = {
  id: number;
  groupId: number;
  groupName: string;
  code: string;
  label: string;
  dataType: "number" | "text" | "boolean" | "enum";
  unit: string | null;
  sortOrder: number;
  isFilterable: boolean;
  filterType: string | null;
  bikesWithValueCount: number;
};

export type SpecDefinitionRequest = {
  groupId: number;
  code: string;
  label: string;
  dataType: "number" | "text" | "boolean" | "enum";
  unit: string | null;
  isFilterable: boolean;
  filterType: string | null;
};


export type BrandAdmin = { id: number; name: string; logoBlobUrl: string | null; modelCount: number; bikeCount: number };
export type BrandRequest = { name: string; logoBlobUrl: string | null };
export type CategoryAdmin = { id: number; name: string; modelCount: number; bikeCount: number };
export type CategoryRequest = { name: string };
