import type {
  BikeDetailDto,
  BikeListItemDto,
  BikesQuery,
  BrandDto,
  CategoryDto,
  CompareResultDto,
  PagedResult,
  SpecGroupDto,
  UserSessionDto,
} from "./types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7240";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { Accept: "application/json", ...options?.headers },
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText} (${path})`);
  }

  return res.json() as Promise<T>;
}

function buildQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function getBikes(query: BikesQuery = {}): Promise<PagedResult<BikeListItemDto>> {
  return apiFetch(`/api/bikes${buildQueryString({ ...query })}`);
}

export function getBikeBySlug(slug: string): Promise<BikeDetailDto> {
  return apiFetch(`/api/bikes/${encodeURIComponent(slug)}`);
}

export function compareBikes(ids: string[]): Promise<CompareResultDto> {
  return apiFetch(`/api/bikes/compare${buildQueryString({ ids: ids.join(",") })}`);
}

export function getBrands(): Promise<BrandDto[]> {
  return apiFetch("/api/brands");
}

export function getCategories(): Promise<CategoryDto[]> {
  return apiFetch("/api/categories");
}

export function getSpecGroups(): Promise<SpecGroupDto[]> {
  return apiFetch("/api/spec-groups");
}

// Public-user authentication (browser-only; relies on the API's HttpOnly session cookie).
async function authFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { Accept: "application/json", ...options?.headers },
  });

  if (res.status === 401) return null;
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText} (${path})`);
  }
  if (res.status === 204) return null;
  return res.json() as Promise<T>;
}

export function getUserSession(): Promise<UserSessionDto | null> {
  return authFetch<UserSessionDto>("/api/auth/session");
}

export async function signOutUser(): Promise<void> {
  await authFetch<void>("/api/auth/signout", { method: "POST" });
}

export function facebookSignInUrl(): string {
  return `${API_BASE_URL}/api/auth/facebook`;
}
