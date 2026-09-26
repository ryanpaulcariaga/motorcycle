Public Next.js frontend for the motorcycle catalog (browse, search, filter, compare).

## Local Development

The dev server runs on `https://localhost:3000` using the trusted ASP.NET Core HTTPS development certificate (`apps/web/server.mjs`, cached under `apps/web/certs/`). A `predev`/`prestart` script exports that certificate (with its private key) via `dotnet dev-certs https --export-path apps/web/certs/aspnetcore-dev-cert.pem --format Pem --no-password`, so the browser trusts `localhost:3000` the same way it already trusts the API at `https://localhost:7240` — no manual "trust this certificate" step needed. `NODE_EXTRA_CA_CERTS` also points at the same file so server-side fetches trust the API. If `dotnet dev-certs` isn't available, the server falls back to generating an untrusted self-signed certificate.

```powershell
pnpm --filter web dev
```

Open `https://localhost:3000`. If you still see a certificate warning, run `dotnet dev-certs https --trust` once to trust the certificate on this machine, then restart the dev server.

Set `NEXT_PUBLIC_API_URL` only when the API URL differs from its local default (`https://localhost:7240`); see `apps/web/lib/api.ts`.

## Other Commands

```powershell
pnpm --filter web build
pnpm --filter web start
pnpm --filter web lint
```

`build`/`start` also serve over HTTPS via `apps/web/server.mjs`.
