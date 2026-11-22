import type {
  AnalyticsEvent,
  BikeDetailDto,
  BikeListItemDto,
  BikeCommentDto,
  BikeReviewDto,
  BikeReviewsDto,
  BikesQuery,
  BrandDto,
  CategoryDto,
  ContactInquiryRequest,
  CompareResultDto,
  ComparedBikeDto,
  PagedResult,
  PopularComparisonDto,
  SpecGroupDto,
  UserDataExport,
  UserSessionDto,
  UserInterestEvent,
  UserInterestPreference,
} from "./types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7240";

export async function sendContactInquiry(inquiry: ContactInquiryRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/contact`, {
    method: "POST",
    credentials: "omit",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inquiry),
  });
  if (response.status === 429) {
    throw new Error("Too many messages were sent. Please wait a minute and try again.");
  }
  if (!response.ok) {
    throw new Error("Your message could not be sent. Please check your details and try again.");
  }
}

export async function sendAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/events`, {
    method: "POST",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    keepalive: true,
  });
  if (!response.ok) {
    throw new Error(`Analytics request failed: ${response.status}`);
  }
}

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

export function searchBikes(term: string, pageSize = 8): Promise<PagedResult<BikeListItemDto>> {
  return apiFetch(`/api/bikes${buildQueryString({ search: term, pageSize })}`);
}

export function getBikeBySlug(slug: string): Promise<BikeDetailDto> {
  return apiFetch(`/api/bikes/${encodeURIComponent(slug)}`);
}

export function compareBikes(ids: string[]): Promise<CompareResultDto> {
  return apiFetch(`/api/bikes/compare${buildQueryString({ ids: ids.join(",") })}`);
}

export function getComparedWith(slug: string, limit = 4): Promise<ComparedBikeDto[]> {
  return apiFetch(`/api/bikes/${encodeURIComponent(slug)}/compared-with${buildQueryString({ limit })}`);
}

export function getBikeReviews(bikeId: number): Promise<BikeReviewsDto> {
  return apiFetch(`/api/bikes/${bikeId}/reviews`);
}

export function getBikeComments(bikeId: number): Promise<BikeCommentDto[]> {
  return apiFetch(`/api/bikes/${bikeId}/comments`);
}

export function getPopularComparisons(limit = 10): Promise<PopularComparisonDto[]> {
  return apiFetch(`/api/bikes/popular-comparisons${buildQueryString({ limit })}`);
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
    cache: "no-store",
    headers: { Accept: "application/json", ...options?.headers },
  });

  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText} (${path})`);
  }
  if (res.status === 204) {
    return null;
  }
  return res.json() as Promise<T>;
}

export function getUserSession(): Promise<UserSessionDto | null> {
  return authFetch<UserSessionDto>("/api/auth/session");
}

export async function exportUserData(): Promise<UserDataExport> {
  const result = await authFetch<UserDataExport>("/api/user/account/export");
  if (!result) {
    throw new Error("Please sign in again to export your data.");
  }
  return result;
}

export async function deleteUserAccount(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/user/account`, {
    method: "DELETE",
    credentials: "include",
    cache: "no-store",
    headers: { "X-Account-Request": "1" },
  });
  if (!response.ok) {
    throw new Error(`Delete account request failed: ${response.status}`);
  }
}

export function getUserInterestPreference(): Promise<UserInterestPreference | null> {
  return authFetch<UserInterestPreference>("/api/user/interests/preference");
}

export function getMyBikeReview(bikeId: number): Promise<BikeReviewDto | null> {
  return authFetch<BikeReviewDto>(`/api/bikes/${bikeId}/reviews/mine`);
}

export async function getMyBikeComments(bikeId: number): Promise<BikeCommentDto[]> {
  return (await authFetch<BikeCommentDto[]>(`/api/bikes/${bikeId}/comments/mine`)) ?? [];
}

export async function saveBikeReview(
  bikeId: number,
  review: { rating: number; body: string },
): Promise<BikeReviewDto> {
  const result = await authFetch<BikeReviewDto>(`/api/bikes/${bikeId}/reviews`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Review-Request": "1" },
    body: JSON.stringify(review),
  });
  if (!result) {
    throw new Error("Please sign in again to save your review.");
  }
  return result;
}

export async function deleteBikeReview(bikeId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/bikes/${bikeId}/reviews`, {
    method: "DELETE",
    credentials: "include",
    cache: "no-store",
    headers: { "X-Review-Request": "1" },
  });
  if (!res.ok) {
    throw new Error(`Delete review request failed: ${res.status}`);
  }
}

export async function createBikeComment(bikeId: number, body: string): Promise<BikeCommentDto> {
  const result = await authFetch<BikeCommentDto>(`/api/bikes/${bikeId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Review-Request": "1" },
    body: JSON.stringify({ body }),
  });
  if (!result) {
    throw new Error("Please sign in again to post your comment.");
  }
  return result;
}

export async function updateBikeComment(
  bikeId: number,
  commentId: number,
  body: string,
): Promise<BikeCommentDto> {
  const result = await authFetch<BikeCommentDto>(
    `/api/bikes/${bikeId}/comments/${commentId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Review-Request": "1" },
      body: JSON.stringify({ body }),
    },
  );
  if (!result) {
    throw new Error("Please sign in again to update your comment.");
  }
  return result;
}

export async function deleteBikeComment(bikeId: number, commentId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/bikes/${bikeId}/comments/${commentId}`, {
    method: "DELETE",
    credentials: "include",
    cache: "no-store",
    headers: { "X-Review-Request": "1" },
  });
  if (!res.ok) {
    throw new Error(`Delete comment request failed: ${res.status}`);
  }
}

export async function setUserInterestPreference(enabled: boolean): Promise<UserInterestPreference> {
  const result = await authFetch<UserInterestPreference>("/api/user/interests/preference", {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Interest-Request": "1" },
    body: JSON.stringify({ enabled }),
  });
  if (!result) {
    throw new Error("Please sign in again to change your interest preference.");
  }
  return result;
}

export async function sendUserInterestEvent(event: UserInterestEvent): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/user/interests/events`, {
    method: "POST",
    credentials: "include",
    referrerPolicy: "no-referrer",
    headers: { "Content-Type": "application/json", "X-Interest-Request": "1" },
    body: JSON.stringify(event),
    keepalive: true,
  });
  if (!res.ok) {
    throw new Error(`Interest event request failed: ${res.status}`);
  }
}

export async function signOutUser(): Promise<void> {
  await authFetch<void>("/api/auth/signout", { method: "POST" });
}

export function facebookSignInUrl(): string {
  return `${API_BASE_URL}/api/auth/facebook`;
}
