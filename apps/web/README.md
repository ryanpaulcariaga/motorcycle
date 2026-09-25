Public Next.js frontend for the motorcycle catalog (browse, search, filter, compare).

## Local Development

The dev server runs on `https://localhost:3000` using a locally generated development certificate (`apps/web/server.mjs`, cached under `apps/web/certs/`). The API remains on `https://localhost:7240`; a `predev`/`prestart` script exports the trusted ASP.NET Core dev certificate to `apps/web/certs/aspnetcore-dev-cert.pem` and points `NODE_EXTRA_CA_CERTS` at it so server-side fetches trust the API without disabling TLS verification.

```powershell
pnpm --filter web dev
```

Open `https://localhost:3000` and trust the local development certificate when prompted.

Set `NEXT_PUBLIC_API_URL` only when the API URL differs from its local default (`https://localhost:7240`); see `apps/web/lib/api.ts`.

## Other Commands

```powershell
pnpm --filter web build
pnpm --filter web start
pnpm --filter web lint
```

`build`/`start` also serve over HTTPS via `apps/web/server.mjs`.
