import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { CompactEncrypt, compactDecrypt } from "jose";

export type AdminSession = {
  facebookUserId: string;
  email: string | null;
  displayName: string | null;
  expiresAt: number;
};

const SESSION_COOKIE = "mc_admin_session";

function sessionKey(): Uint8Array {
  const configured = process.env.ADMIN_SESSION_SECRET ?? "development-only-admin-session-secret";
  return createHash("sha256").update(configured).digest();
}

export async function setAdminSession(session: Omit<AdminSession, "expiresAt">): Promise<void> {
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
  const payload = new TextEncoder().encode(JSON.stringify({ ...session, expiresAt }));
  const token = await new CompactEncrypt(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(sessionKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { plaintext } = await compactDecrypt(token, sessionKey());
    const session = JSON.parse(new TextDecoder().decode(plaintext)) as AdminSession;
    if (!session.expiresAt || session.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
