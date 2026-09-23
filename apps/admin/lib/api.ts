import type { AdminRole, AdminSession, ApiError, BikeAdminDetail, BikeAdminListItem, BikeImage, BikeModel, BikeModelRequest, CreateAdminRoleRequest, CreateBikeRequest, LookupOption, UpdateAdminRoleRequest, UpdateBikeRequest } from "./types";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "https://localhost:7240";

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

  if (!response.ok) {
    let details: ApiError = { message: response.statusText || "Request failed" };
    try {
      details = (await response.json()) as ApiError;
    } catch {
      // Preserve the status when the API has no JSON error body.
    }
    throw new AdminApiError(response.status, details);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getAdminSession(): Promise<AdminSession> { return apiFetch("/api/admin/auth/session"); }
export function signOutAdmin(): Promise<void> { return apiFetch("/api/admin/auth/signout", { method: "POST" }); }
export function getAdminRoles(): Promise<AdminRole[]> {
  return apiFetch("/api/admin/admin-roles");
}

export function createAdminRole(request: CreateAdminRoleRequest): Promise<AdminRole> {
  return apiFetch("/api/admin/admin-roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
}

export function updateAdminRole(id: number, request: UpdateAdminRoleRequest): Promise<AdminRole> {
  return apiFetch(`/api/admin/admin-roles/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
}

export function getBikeModels(): Promise<BikeModel[]> { return apiFetch("/api/admin/bike-models"); }
export function createBikeModel(request: BikeModelRequest): Promise<BikeModel> { return apiFetch("/api/admin/bike-models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) }); }
export function updateBikeModel(id: number, request: BikeModelRequest): Promise<BikeModel> { return apiFetch(`/api/admin/bike-models/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) }); }
export function deleteBikeModel(id: number): Promise<void> { return apiFetch(`/api/admin/bike-models/${id}`, { method: "DELETE" }); }

async function publicApiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Lookup request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export function getBrands(): Promise<LookupOption[]> { return publicApiFetch("/brands"); }
export function getCategories(): Promise<LookupOption[]> { return publicApiFetch("/categories"); }
export function getSpecGroups(): Promise<{ code: string; name: string; sortOrder: number; definitions: { id: number; code: string; label: string; dataType: string; unit: string | null; sortOrder: number }[] }[]> {
  return publicApiFetch("/spec-groups");
}

export function getAdminBikes(modelId?: number): Promise<BikeAdminListItem[]> {
  return apiFetch(modelId ? `/api/admin/bikes?modelId=${modelId}` : "/api/admin/bikes");
}
export function getAdminBike(id: number): Promise<BikeAdminDetail> { return apiFetch(`/api/admin/bikes/${id}`); }
export function createAdminBike(request: CreateBikeRequest): Promise<BikeAdminDetail> {
  return apiFetch("/api/admin/bikes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
}
export function updateAdminBike(id: number, request: UpdateBikeRequest): Promise<BikeAdminDetail> {
  return apiFetch(`/api/admin/bikes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
}
export function publishAdminBike(id: number): Promise<BikeAdminDetail> { return apiFetch(`/api/admin/bikes/${id}/publish`, { method: "PATCH" }); }
export function unpublishAdminBike(id: number): Promise<BikeAdminDetail> { return apiFetch(`/api/admin/bikes/${id}/unpublish`, { method: "PATCH" }); }
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
