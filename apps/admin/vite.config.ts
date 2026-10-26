import { fileURLToPath, URL } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const trustedKeyPath = path.join(rootDir, "certs", "aspnetcore-dev-cert.key");
const trustedCertPath = path.join(rootDir, "certs", "aspnetcore-dev-cert.pem");
// Reuse the already-trusted ASP.NET Core dev cert (see predev script) instead of
// @vitejs/plugin-basic-ssl's self-signed cert, which browsers always flag as untrusted.
const hasTrustedCert = existsSync(trustedKeyPath) && existsSync(trustedCertPath);
const adminApiOrigin = new URL(
  process.env.VITE_API_URL ?? "https://localhost:7240",
).origin;
const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.blob.core.windows.net https://placeholder.com",
    `connect-src 'self' ${adminApiOrigin} ws://localhost:3001 wss://localhost:3001`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
  "Strict-Transport-Security": "max-age=31536000",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};
const developmentSecurityHeaders = {
  ...securityHeaders,
  "Content-Security-Policy": securityHeaders["Content-Security-Policy"].replace(
    "script-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  ),
};

export default defineConfig({
  plugins: [...(hasTrustedCert ? [] : [basicSsl()]), react()],
  server: {
    headers: developmentSecurityHeaders,
    https: hasTrustedCert
      ? { key: readFileSync(trustedKeyPath), cert: readFileSync(trustedCertPath) }
      : {},
  },
  preview: {
    headers: securityHeaders,
    https: hasTrustedCert
      ? { key: readFileSync(trustedKeyPath), cert: readFileSync(trustedCertPath) }
      : {},
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});