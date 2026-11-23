import type { AdminAuditLogPage, AdminRole, AdminSession, ApiError, BikeAdminDetail, BikeAdminListItem, BikeImage, BikeImportResult, BikeModel, BikeModelRequest, BikeSpecValueItem, BrandAdmin, BrandRequest, CategoryAdmin, CategoryRequest, CreateAdminRoleRequest, CreateBikeRequest, LookupOption, ReassignBikeModelRequest, SpecDefinitionAdmin, SpecDefinitionRequest, SpecGroupAdmin, SpecGroupRequest, SpecValueFilters, UpdateAdminRoleRequest, UpdateBikeRequest, UpdateSingleSpecRequest, BikeSpecGridRow, UpdateSpecGridRequest } from "./types";
import type { AnalyticsDashboard } from "./types";
import type { ContactInquiryPage } from "./types";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "https://localhost:7240";
export const ADMIN_SESSION_EXPIRED_EVENT = "admin-session-expired";

export function beginAdminSignIn(): void {
  sessionStorage.setItem("mc_return_to", window.location.pathname + window.location.search);
  window.location.assign(`${API_BASE_URL}/api/admin/auth/facebook`);
}

export class AdminApiError extends Error {
  status: number;
  details?: ApiError;

  constructor(status: number, details: ApiError) {
    super(details.message);
    this.name = "AdminApiError";
    this.status = status;
    this.details = details;
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { Accept: "application/json", ...options?.headers },
  });

  if (response.status === 401 && path !== "/api/admin/auth/session" && path !== "/api/admin/auth/signout") {
    sessionStorage.setItem("mc_return_to", window.location.pathname + window.location.search);
    window.dispatchEvent(new Event(ADMIN_SESSION_EXPIRED_EVENT));
    throw new AdminApiError(401, { message: "Your administrator session has expired." });
  }

  if (!response.ok) {
    let details: ApiError = { message: response.statusText || "Request failed" };
    try {
      details = (await response.json()) as ApiError;
    } catch {
      // Preserve the status when the API has no JSON error body.
    }
    throw new AdminApiError(response.status, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function getAdminSession(): Promise<AdminSession> { return apiFetch("/api/admin/auth/session"); }
export function signOutAdmin(): Promise<void> { return apiFetch("/api/admin/auth/signout", { method: "POST" }); }
export function getAdminRoles(): Promise<AdminRole[]> {
  return apiFetch("/api/admin/admin-roles");
}

export function getAdminAuditLogs(page: number, pageSize: number): Promise<AdminAuditLogPage> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return apiFetch(`/api/admin/audit-logs?${params}`);
}

export function getContactInquiries(page: number, pageSize: number): Promise<ContactInquiryPage> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return apiFetch(`/api/admin/contact-inquiries?${params}`);
}

export function deleteContactInquiry(id: number): Promise<void> {
  return apiFetch(`/api/admin/contact-inquiries/${id}`, { method: "DELETE" });
}

export function setContactInquiryRead(id: number, isRead: boolean): Promise<void> {
  return apiFetch(`/api/admin/contact-inquiries/${id}/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isRead }),
  });
}

export function getAnalytics(from: string, to: string): Promise<AnalyticsDashboard> {
  return apiFetch(`/api/admin/analytics?${new URLSearchParams({ from, to })}`);
}

export function createAdminRole(request: CreateAdminRoleRequest): Promise<AdminRole> {
  return apiFetch("/api/admin/admin-roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
}

export function updateAdminRole(id: number, request: UpdateAdminRoleRequest): Promise<AdminRole> {
  return apiFetch(`/api/admin/admin-roles/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
}
export function deleteAdminRole(id: number): Promise<void> {
  return apiFetch(`/api/admin/admin-roles/${id}`, { method: "DELETE" });
}

export function getBikeModels(): Promise<BikeModel[]> { return apiFetch("/api/admin/bike-models"); }
export function createBikeModel(request: BikeModelRequest): Promise<BikeModel> { return apiFetch("/api/admin/bike-models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) }); }
export function updateBikeModel(id: number, request: BikeModelRequest): Promise<BikeModel> { return apiFetch(`/api/admin/bike-models/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) }); }
export function deleteBikeModel(id: number): Promise<void> { return apiFetch(`/api/admin/bike-models/${id}`, { method: "DELETE" }); }

async function publicApiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Lookup request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getBrands(): Promise<LookupOption[]> { return publicApiFetch("/brands"); }
export function getCategories(): Promise<LookupOption[]> { return publicApiFetch("/categories"); }
export function getSpecGroups(): Promise<{ code: string; name: string; sortOrder: number; definitions: { id: number; code: string; label: string; dataType: string; unit: string | null; sortOrder: number; isFilterable: boolean; filterType: string | null }[] }[]> {
  return publicApiFetch("/spec-groups");
}

export function getAdminBikes(modelId?: number, brandId?: number): Promise<BikeAdminListItem[]> {
  const params = new URLSearchParams();
  if (modelId !== undefined) {
    params.set("modelId", String(modelId));
  }
  if (brandId !== undefined) {
    params.set("brandId", String(brandId));
  }
  const query = params.toString();
  return apiFetch(`/api/admin/bikes${query ? `?${query}` : ""}`);
}
export function getAdminBikeSpecValues(filters: SpecValueFilters): Promise<BikeSpecValueItem[]> {
  const params = new URLSearchParams({ specCode: filters.specCode });
  if (filters.brandId !== undefined) {
    params.set("brandId", String(filters.brandId));
  }
  if (filters.categoryId) {
    params.set("categoryId", String(filters.categoryId));
  }
  if (filters.minPrice !== undefined) {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice !== undefined) {
    params.set("maxPrice", String(filters.maxPrice));
  }
  return apiFetch(`/api/admin/bikes/spec-values?${params}`);
}
export function updateAdminBikeSpecValues(request: UpdateSingleSpecRequest): Promise<{ updatedCount: number }> {
  return apiFetch("/api/admin/bikes/spec-values", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
}
type BikeGridSort = { field: string; descending: boolean };
type BikeGridFilters = Omit<SpecValueFilters, "specCode"> & {
  yearMin?: number;
  yearMax?: number;
  ccMin?: number;
  ccMax?: number;
  reviewStatus?: import("./types").ReviewStatus;
  bikeIds?: number[];
};

function bikeGridParams(filters: BikeGridFilters, sorts: BikeGridSort[]) {
  const params = new URLSearchParams();
  if (filters.brandId !== undefined) {
    params.set("brandId", String(filters.brandId));
  }
  if (filters.categoryId) {
    params.set("categoryId", String(filters.categoryId));
  }
  if (filters.minPrice !== undefined) {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice !== undefined) {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.yearMin !== undefined) {
    params.set("yearMin", String(filters.yearMin));
  }
  if (filters.yearMax !== undefined) {
    params.set("yearMax", String(filters.yearMax));
  }
  if (filters.ccMin !== undefined) {
    params.set("ccMin", String(filters.ccMin));
  }
  if (filters.ccMax !== undefined) {
    params.set("ccMax", String(filters.ccMax));
  }
  if (filters.reviewStatus) {
    params.set("reviewStatus", filters.reviewStatus);
  }
  if (filters.bikeIds) {
    params.set("bikeIds", filters.bikeIds.join(","));
  }
  if (sorts.length > 0) {
    params.set(
      "sort",
      sorts.map(({ field, descending }) => `${field}:${descending ? "desc" : "asc"}`).join(",")
    );
  }
  return params;
}

export function getAdminBikeSpecGrid(filters: BikeGridFilters, sorts: BikeGridSort[] = []): Promise<BikeSpecGridRow[]> {
  const params = bikeGridParams(filters, sorts);
  return apiFetch(`/api/admin/bikes/spec-grid?${params}`);
}
export async function exportAdminBikes(filters: BikeGridFilters, sorts: BikeGridSort[] = []): Promise<Blob> {
  const params = bikeGridParams(filters, sorts);
  const response = await fetch(`${API_BASE_URL}/api/admin/bikes/export?${params}`, { credentials: "include" });
  if (!response.ok) {
    let details: ApiError = { message: response.statusText || "Export failed" };
    try {
      details = (await response.json()) as ApiError;
    } catch {
      // Preserve the status when the API has no JSON error body.
    }
    throw new AdminApiError(response.status, details);
  }
  return response.blob();
}
export function importAdminBikes(file: File): Promise<BikeImportResult> {
  const body = new FormData();
  body.append("file", file);
  return apiFetch("/api/admin/bikes/import", { method: "POST", body });
}
export function updateAdminBikeSpecGrid(request: UpdateSpecGridRequest): Promise<{ updatedCount: number }> {
  return apiFetch("/api/admin/bikes/spec-grid", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
}
export function getAdminBike(id: number): Promise<BikeAdminDetail> { return apiFetch(`/api/admin/bikes/${id}`); }
export function createAdminBike(request: CreateBikeRequest): Promise<BikeAdminDetail> {
  return apiFetch("/api/admin/bikes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
}
export function updateAdminBike(id: number, request: UpdateBikeRequest): Promise<BikeAdminDetail> {
  return apiFetch(`/api/admin/bikes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
}
export function reassignAdminBikeModel(id: number, request: ReassignBikeModelRequest): Promise<void> {
  return apiFetch(`/api/admin/bikes/${id}/model`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
}
export function publishAdminBike(id: number): Promise<BikeAdminDetail> { return apiFetch(`/api/admin/bikes/${id}/publish`, { method: "PATCH" }); }
export function unpublishAdminBike(id: number): Promise<BikeAdminDetail> { return apiFetch(`/api/admin/bikes/${id}/unpublish`, { method: "PATCH" }); }
export function setAdminBikeReviewed(id: number, isReviewed: boolean): Promise<BikeAdminDetail> {
  return apiFetch(`/api/admin/bikes/${id}/reviewed`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isReviewed }) });
}
export function deleteAdminBike(id: number): Promise<void> { return apiFetch(`/api/admin/bikes/${id}`, { method: "DELETE" }); }

export function getAdminBikeImages(bikeId: number): Promise<BikeImage[]> {
  return apiFetch(`/api/admin/bikes/${bikeId}/images`);
}
export function uploadAdminBikeImage(bikeId: number, file: File): Promise<BikeImage> {
  const body = new FormData();
  body.append("file", file);
  return apiFetch(`/api/admin/bikes/${bikeId}/images`, { method: "POST", body });
}
export function setAdminBikeImagePrimary(bikeId: number, imageId: number): Promise<BikeImage> {
  return apiFetch(`/api/admin/bikes/${bikeId}/images/${imageId}/primary`, { method: "PATCH" });
}
export function reorderAdminBikeImages(bikeId: number, imageIds: number[]): Promise<BikeImage[]> {
  return apiFetch(`/api/admin/bikes/${bikeId}/images/order`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageIds }) });
}
export function deleteAdminBikeImage(bikeId: number, imageId: number): Promise<void> {
  return apiFetch(`/api/admin/bikes/${bikeId}/images/${imageId}`, { method: "DELETE" });
}

export function getAdminSpecGroups(): Promise<SpecGroupAdmin[]> { return apiFetch("/api/admin/spec-groups"); }
export function createAdminSpecGroup(request: SpecGroupRequest): Promise<SpecGroupAdmin> {
  return apiFetch("/api/admin/spec-groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
}
export function updateAdminSpecGroup(id: number, request: SpecGroupRequest): Promise<SpecGroupAdmin> {
  return apiFetch(`/api/admin/spec-groups/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
}
export function reorderAdminSpecGroups(groupIds: number[]): Promise<SpecGroupAdmin[]> {
  return apiFetch("/api/admin/spec-groups/order", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupIds }) });
}
export function deleteAdminSpecGroup(id: number): Promise<void> { return apiFetch(`/api/admin/spec-groups/${id}`, { method: "DELETE" }); }

export function getAdminSpecDefinitions(groupId?: number): Promise<SpecDefinitionAdmin[]> {
  return apiFetch(groupId ? `/api/admin/spec-definitions?groupId=${groupId}` : "/api/admin/spec-definitions");
}
export function createAdminSpecDefinition(request: SpecDefinitionRequest): Promise<SpecDefinitionAdmin> {
  return apiFetch("/api/admin/spec-definitions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
}
export function updateAdminSpecDefinition(id: number, request: SpecDefinitionRequest): Promise<SpecDefinitionAdmin> {
  return apiFetch(`/api/admin/spec-definitions/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
}
export function reorderAdminSpecDefinitions(groupId: number, definitionIds: number[]): Promise<SpecDefinitionAdmin[]> {
  return apiFetch(`/api/admin/spec-groups/${groupId}/spec-definitions/order`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ definitionIds }) });
}
export function deleteAdminSpecDefinition(id: number): Promise<void> { return apiFetch(`/api/admin/spec-definitions/${id}`, { method: "DELETE" }); }

export function getAdminBrands(): Promise<BrandAdmin[]> { return apiFetch("/api/admin/brands"); }
export function createAdminBrand(request: BrandRequest): Promise<BrandAdmin> { return apiFetch("/api/admin/brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) }); }
export function updateAdminBrand(id: number, request: BrandRequest): Promise<BrandAdmin> { return apiFetch(`/api/admin/brands/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) }); }
export function deleteAdminBrand(id: number): Promise<void> { return apiFetch(`/api/admin/brands/${id}`, { method: "DELETE" }); }

export function getAdminCategories(): Promise<CategoryAdmin[]> { return apiFetch("/api/admin/categories"); }
export function createAdminCategory(request: CategoryRequest): Promise<CategoryAdmin> { return apiFetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) }); }
export function updateAdminCategory(id: number, request: CategoryRequest): Promise<CategoryAdmin> { return apiFetch(`/api/admin/categories/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) }); }
export function deleteAdminCategory(id: number): Promise<void> { return apiFetch(`/api/admin/categories/${id}`, { method: "DELETE" }); }
