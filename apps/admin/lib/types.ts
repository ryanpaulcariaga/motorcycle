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
