// Custom HTTPS dev/start server so `web` matches admin's https://localhost:3001 local setup.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:https";
import { fileURLToPath } from "node:url";
import path from "node:path";
import selfsigned from "selfsigned";
import next from "next";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const certDir = path.join(rootDir, "certs");
const keyPath = path.join(certDir, "localhost-key.pem");
const certPath = path.join(certDir, "localhost.pem");

async function loadOrCreateCertificate() {
  if (existsSync(keyPath) && existsSync(certPath)) {
    return { key: readFileSync(keyPath), cert: readFileSync(certPath) };
  }

  const pems = await selfsigned.generate([{ name: "commonName", value: "localhost" }], {
    keySize: 2048,
    algorithm: "sha256",
    notAfterDate: new Date(Date.now() + 825 * 24 * 60 * 60 * 1000),
  });

  mkdirSync(certDir, { recursive: true });
  writeFileSync(keyPath, pems.private);
  writeFileSync(certPath, pems.cert);
  return { key: pems.private, cert: pems.cert };
}

const port = Number(process.env.PORT) || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const [{ key, cert }] = await Promise.all([loadOrCreateCertificate(), app.prepare()]);

createServer({ key, cert }, (req, res) => handle(req, res)).listen(port, () => {
  console.log(`> Ready on https://localhost:${port}`);
});
