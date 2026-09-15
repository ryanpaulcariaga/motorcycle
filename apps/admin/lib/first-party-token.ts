import { importPKCS8, SignJWT } from "jose";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { AdminSession } from "./session";

export async function mintFirstPartyToken(session: AdminSession): Promise<string> {
  const privateKeyFile = process.env.FIRST_PARTY_JWT_PRIVATE_KEY_FILE;
  const privateKeyPem = privateKeyFile
    ? await readFile(resolve(process.cwd(), privateKeyFile), "utf8")
    : process.env.FIRST_PARTY_JWT_PRIVATE_KEY;
  if (!privateKeyPem) throw new Error("FIRST_PARTY_JWT_PRIVATE_KEY is not configured.");

  const issuer = process.env.FIRST_PARTY_JWT_ISSUER ?? "https://localhost:3001";
  const audience = process.env.FIRST_PARTY_JWT_AUDIENCE ?? "motorcycle-api";
  const privateKey = await importPKCS8(privateKeyPem.replace(/\\n/g, "\n"), "RS256");

  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(session.facebookUserId)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(privateKey);
}
