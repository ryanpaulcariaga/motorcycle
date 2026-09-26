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

export type ApiError = {
  code?: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  dependentCount?: number;
  affectedBikeCount?: number;
};

export type AdminSession = {
  facebookUserId: string;
  displayName: string | null;
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
  createdAt: string;
  updatedAt: string;
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
  variantName: string;
  year: number;
  msrpPrice: number | null;
  specs: Record<string, unknown>;
};

export type BikeImage = {
  id: number;
  blobUrl: string;
  sortOrder: number;
  isPrimary: boolean;
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

