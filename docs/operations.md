# Operations Reference

Azure resources, production URLs, deployment history and lessons, and local development notes. Step-by-step deployment instructions are in the root [README](../README.md#deploying-to-azure). What still needs doing is tracked in [plan-motorcycle-web-app.md](../plan-motorcycle-web-app.md).

## Local development

- Ports: API `https://localhost:7240` (single `https` launch profile), public web `https://localhost:3000` (custom HTTPS server `apps/web/server.mjs`), admin SPA `https://localhost:3001`. The API owns the admin callback `https://localhost:7240/api/admin/auth/facebook/callback`.
- Local API secrets use `dotnet user-secrets` on `apps/api/Motorcycle.Api` (`UserSecretsId: motorcycle-api-local`).
- Local access to the Azure PostgreSQL server needs your current public IP in its firewall rules, or the API fails with "Failed to connect ... :5432".
- Stop a running API (and Visual Studio) before `dotnet test` or `dotnet build`, or the DLLs are locked.

### First administrator

Bootstrap the first administrator once per database (already done locally; do not rerun there). Run it against production only if the production database has no administrator:

```powershell
dotnet run --project apps/api/Motorcycle.Api --launch-profile https -- admin bootstrap --facebook-user-id <id> --email <email> --display-name <name>
```

## Provisioned Azure resources (as of 2026-09-22)

All resources are in resource group `motorcycle-prod-rg`, region **Southeast Asia**.

| Resource | Name | Notes |
|---|---|---|
| Storage Account | `motorcycleimagesprod` | StorageV2, Standard, LRS, Hot tier, public network access enabled, account-level anonymous blob access enabled |
| Blob container | `images` | Anonymous access level: **Blob** (anonymous read for blobs only) |
| Key Vault | `motorcycle-prod-kv` | Azure RBAC permission model; secrets `StorageConnectionString`, `PostgresConnectionString` |
| PostgreSQL Flexible Server | `motorcycle-prod-pg` | Burstable B1ms, PostgreSQL 16 (reports 18.6), admin login `motoadmin`, public access + "allow Azure services" enabled |
| PostgreSQL database | `motorcycle_db` | Under `motorcycle-prod-pg` |
| App Service Plan | `motorcycle-prod-plan` | Linux, Basic B1 |
| API Web App | `motorcycle-api-prod` | System-assigned managed identity with **Key Vault Secrets User** on `motorcycle-prod-kv`. Needs admin/public Facebook credentials and callback URLs, frontend redirect URLs, and CORS origins (README M1) |
| Public web Web App | `motorcycle-web-prod` | |
| Admin Web App | `motorcycle-admin-prod` | Facebook redirects to the API callback, not this SPA |

Key Vault references on `motorcycle-api-prod`:

```text
Storage__ConnectionString = @Microsoft.KeyVault(SecretUri=https://motorcycle-prod-kv.vault.azure.net/secrets/StorageConnectionString/)
ConnectionStrings__DefaultConnection = @Microsoft.KeyVault(SecretUri=https://motorcycle-prod-kv.vault.azure.net/secrets/PostgresConnectionString/)
```

GitHub's `production` environment variables `NEXT_PUBLIC_API_URL` and `VITE_API_URL` point at the API domain; `NEXT_PUBLIC_SITE_URL` points at the public web domain. They are build-time frontend settings, so changing them needs a frontend redeploy. Both production Facebook callback URLs must also be registered in the Facebook app (see the API README).

The API enables forwarded-header processing only in Production, with a one-hop limit for `X-Forwarded-For` and `X-Forwarded-Proto`; the Production configuration clears ASP.NET Core's static trusted-proxy lists because Azure App Service ingress addresses are platform-managed. Do not enable that setting when exposing the API directly or behind a different topology without configuring its trusted ingress.

The admin build includes `server.mjs` in `dist` and starts it with Node rather than `pm2 serve`, so production responses receive CSP and the other security headers. `ADMIN_API_ORIGIN` optionally overrides the API origin used by the server's `connect-src` CSP; update it whenever the production API host changes. It defaults to the current Azure API hostname.

## Production URLs

| App/check | URL |
|---|---|
| Public web `/bikes` | <https://motorcycle-web-prod-bmhpb4hbbah9e7dy.southeastasia-01.azurewebsites.net/bikes> |
| Admin `/` | <https://motorcycle-admin-prod-a4brh0c3eha0h4ch.southeastasia-01.azurewebsites.net/> |
| API `/health` | <https://motorcycle-api-prod-f8hqerghe2dyhnbx.southeastasia-01.azurewebsites.net/health> |
| API `/health/ready` | <https://motorcycle-api-prod-f8hqerghe2dyhnbx.southeastasia-01.azurewebsites.net/health/ready> |

## Deployment setup (one-time, done 2026-10-19)

Entra app registration with a federated credential, Website Contributor on `motorcycle-prod-rg`, and a GitHub `production` environment with secrets `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` and variables `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `VITE_API_URL`. `scripts/setup-azure-oidc.ps1` creates the identity and credential. Runtimes: API = .NET 10, web = Node 22, admin = Node 22.

The pipeline does not run migrations. The API applies pending migrations on every startup in every environment; the legacy `Database:MigrateOnStartup` setting controls only the Development startup seed.

## Deployment troubleshooting history

First-deployment attempts, all on `master`:

| Run | Result | Cause and fix |
|---|---|---|
| 1 (`bfc999b`) | Failed at `azure/login` | `AZURE_CLIENT_ID`/`AZURE_TENANT_ID` not set. Fix: environment secrets added |
| 2 (`d54d549`) | Deploy jobs skipped | The commit touched only README, plan, and `scripts/`, so change detection selected no app. Fix: `deploy.yml` counts as a change for every app; each deploy job fails fast with a clear message when a required secret/variable is missing; manual runs with `deploy_all` deploy everything |
| 3 (`bdbfc93`) | Failed at `azure/login` (`AADSTS700213`) | GitHub issues immutable subject claims for this repository (`repo:ryanpaulcariaga@3658143/motorcycle@1352834212:environment:production`) but the credential used the legacy name-only subject. Fix: `scripts/setup-azure-oidc.ps1` builds the immutable subject from `-OwnerId`/`-RepositoryId` and replaces a stale named credential |
| Later (#39211828423) | Succeeded | Credential corrected, workflow rerun |

Lessons:

- Compare the "Federated token details" in a failed `azure/login` log with the Entra federated credential; issuer, subject, and audience must match exactly.
- Environment secrets only change when the app registration, tenant, or subscription changes.
- Docs-only pushes do not deploy; use **Run workflow** with `deploy_all` to redeploy everything.
- CI uses pnpm `version: 10`; the lockfile (v9.0) works with `--frozen-lockfile` in CI (confirmed 2026-10-19).
