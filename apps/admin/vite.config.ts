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

export default defineConfig({
  plugins: [...(hasTrustedCert ? [] : [basicSsl()]), react()],
  server: {
    https: hasTrustedCert
      ? { key: readFileSync(trustedKeyPath), cert: readFileSync(trustedCertPath) }
      : {},
  },
  preview: {
    https: hasTrustedCert
      ? { key: readFileSync(trustedKeyPath), cert: readFileSync(trustedCertPath) }
      : {},
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});