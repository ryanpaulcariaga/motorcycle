import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { mintFirstPartyToken } from "./first-party-token";
import { setAdminSession, type AdminSession } from "./session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7240";
const FACEBOOK_AUTHORIZE_URL = "https://www.facebook.com/v20.0/dialog/oauth";
const FACEBOOK_TOKEN_URL = "https://graph.facebook.com/v20.0/oauth/access_token";
const FACEBOOK_PROFILE_URL = "https://graph.facebook.com/me";

function redirectUri(): string {
  return process.env.FACEBOOK_REDIRECT_URI ?? "https://localhost:3001/api/auth/callback/facebook";
}

function base64Url(value: Uint8Array): string {
  return Buffer.from(value).toString("base64url");
}

export async function createFacebookSignInUrl(): Promise<string> {
  const state = base64Url(randomBytes(24));
  const verifier = base64Url(randomBytes(48));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());
  const cookieStore = await cookies();
  cookieStore.set("mc_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  cookieStore.set("mc_oauth_verifier", verifier, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });

  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_CLIENT_ID ?? "",
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "public_profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `${FACEBOOK_AUTHORIZE_URL}?${params}`;
}

export async function completeFacebookSignIn(code: string, state: string): Promise<void> {
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("mc_oauth_state")?.value;
  const verifier = cookieStore.get("mc_oauth_verifier")?.value;
  if (!expectedState || expectedState !== state || !verifier) throw new Error("Invalid OAuth state.");

  const tokenParams = new URLSearchParams({
    client_id: process.env.FACEBOOK_CLIENT_ID ?? "",
    client_secret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
    redirect_uri: redirectUri(),
    code,
    code_verifier: verifier,
  });
  const tokenResponse = await fetch(`${FACEBOOK_TOKEN_URL}?${tokenParams}`);
  if (!tokenResponse.ok) throw new Error("Facebook token exchange failed.");
  const token = (await tokenResponse.json()) as { access_token?: string };
  if (!token.access_token) throw new Error("Facebook did not return an access token.");

  const profileResponse = await fetch(`${FACEBOOK_PROFILE_URL}?fields=id,email,name&access_token=${encodeURIComponent(token.access_token)}`);
  if (!profileResponse.ok) throw new Error("Facebook profile lookup failed.");
  const profile = (await profileResponse.json()) as { id?: string; email?: string; name?: string };
  if (!profile.id) throw new Error("Facebook profile did not include an ID.");

  const candidate: AdminSession = {
    facebookUserId: profile.id,
    email: profile.email ?? null,
    displayName: profile.name ?? null,
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  };
  const firstPartyToken = await mintFirstPartyToken(candidate);
  const authorization = await fetch(`${API_BASE_URL}/api/admin/admin-roles`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${firstPartyToken}` },
  });
  if (authorization.status === 401 || authorization.status === 403) throw new Error("This Facebook identity is not an active administrator.");
  if (!authorization.ok) throw new Error("Administrator authorization could not be verified.");

  await setAdminSession(candidate);
  cookieStore.delete("mc_oauth_state");
  cookieStore.delete("mc_oauth_verifier");
}
