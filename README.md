# Motorcycle App

A monorepo for the Motorcycle Specs & Comparison application.

## Structure

```
motorcycle-app/
├── apps/
│   ├── web/              # Public Next.js frontend
│   ├── admin/            # Private Vite React administration SPA
│   └── api/              # Shared ASP.NET Core backend
├── docs/                 # Shared architecture, API, and database documentation
├── plan-motorcycle-web-app.md  # Living project plan/status
├── .specify/             # SpecKit tooling (retained, currently unused)
├── .github/workflows/    # CI/CD pipelines
├── .npmrc                # pnpm install config (see Windows Environment Setup)
├── pnpm-workspace.yaml   # pnpm workspaces config + allowBuilds
└── package.json          # workspace root manifest
```

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend**: ASP.NET Core 10 (Clean Architecture)
- **Database**: PostgreSQL (EF Core + Npgsql)
- **Hosting**: Azure (App Service with three Web Apps: API, public web, admin; Database, Blob Storage, Key Vault)
- **Package Manager**: pnpm (workspaces)

## Getting Started

### Prerequisites
- **Node.js** 18+ and **pnpm** (frontend dependency manager)
- **.NET 10 SDK** (backend)
- **PostgreSQL** 14+ (database)

### Initial Setup

1. **Install Node dependencies:**
   ```bash
   pnpm install
   ```
   This installs dependencies for `apps/web/` and `apps/admin/` (managed by pnpm workspaces). Restore the API separately with `dotnet restore`.

2. **Configure the API database and storage secrets**. Local development can use the provisioned Azure PostgreSQL and Blob Storage through `dotnet user-secrets` on `apps/api/Motorcycle.Api` (`UserSecretsId: motorcycle-api-local`), or a local PostgreSQL instance.

### Windows Environment Setup

A fresh Windows + PowerShell machine needs three one-time fixes before `pnpm`/`npm` work normally. All three are already applied in this repo/workspace as of 2026-09-27; repeat them only on a new machine or user profile:

1. **PowerShell execution policy** blocks the `npm.ps1`/`pnpm.ps1` shims by default (`... cannot be loaded because running scripts is disabled on this system`). Fix for the current user only (no admin rights needed):
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
   ```
2. **`pnpm` isn't preinstalled.** Install it as a real global npm package (approving its install scripts) rather than relying on `corepack` (not bundled in newer Node.js releases) or repeatedly re-fetching it via `npx`:
   ```powershell
   npm install -g --allow-scripts=pnpm pnpm
   ```
3. **npm's global bin folder isn't on PATH by default** on some Windows setups, so a just-installed global package like `pnpm` still won't resolve. Add it once, persistently, for the current user:
   ```powershell
   $npmGlobal = "$env:AppData\npm"
   [Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";" + $npmGlobal, "User")
   ```
   **Restart VS Code (or open a brand-new terminal window outside the editor) after this step** — an already-running VS Code window keeps using the environment it started with and won't see the updated PATH until it's relaunched.

Two repo-level settings also work around Windows-specific pnpm limitations and are already committed:
- [`.npmrc`](.npmrc): `package-import-method=copy` — pnpm's default install links packages into `node_modules` via filesystem symlinks, which fails with `ERR_PNPM_PACKAGE_MANAGER_SYMLINK_FAILED` unless Developer Mode or admin elevation is enabled. Copying files instead avoids that privilege requirement entirely.
- [`pnpm-workspace.yaml`](pnpm-workspace.yaml): `allowBuilds` pre-approves the `esbuild`/`unrs-resolver` native postinstall scripts pnpm would otherwise block with `ERR_PNPM_IGNORED_BUILDS` on a fresh install.

### Running Locally

#### Option A: Run Both Apps in Separate Terminals (Recommended for Development)

**Terminal 1 — Backend API** (Visual Studio HTTPS profile runs on `https://localhost:7240`):
```bash
cd apps/api
dotnet restore
dotnet ef database update  # Apply migrations to local PostgreSQL
dotnet run --project Motorcycle.Api --launch-profile https
```

**Terminal 2 — Frontend Web** (runs on `https://localhost:3000`):
```bash
cd apps/web
pnpm dev
```

Open your browser to `https://localhost:3000` and trust the locally generated development certificate when prompted. The frontend sends API requests to `https://localhost:7240` (see `apps/web/lib/api.ts`). Trust the local ASP.NET Core certificate if prompted.

#### Option B: Backend Setup Only (if you need just the API)
```bash
cd apps/api
dotnet restore
dotnet ef database update
dotnet run --project Motorcycle.Api --launch-profile https
```

#### Option C: Frontend Setup Only (if you need just the web app)
```bash
cd apps/web
pnpm dev
```

### Database Migrations

If you modify the schema (`apps/api/Motorcycle.Domain/`, `apps/api/Motorcycle.Application/DTOs/`, or entity configurations), generate and apply a migration:

```bash
cd apps/api
dotnet ef migrations add <DescriptiveMigrationName> --project Motorcycle.Infrastructure
dotnet ef database update
```

For more details on architecture, see [docs/architecture.md](docs/architecture.md).
For app-specific configuration, see [apps/web/README.md](apps/web/README.md).

## Feature Development

[plan-motorcycle-web-app.md](plan-motorcycle-web-app.md) is the living project document: decisions, implementation status, feature log, operational notes, and backlog. Update it whenever work ships. Feature-by-feature `specs/` folders are no longer used; the SpecKit tooling (`.specify/` and `.github/skills/speckit-*`) is kept only for possible future use.

When implementing a feature:
1. Check the plan's release status, gates, and work register
2. Modify the shared backend (`apps/api/`) and every affected frontend (`apps/web/` and/or `apps/admin/`) in the same session
3. Update `docs/api.md`, `docs/architecture.md`, or `docs/database.md` for contract, architecture, or schema changes
4. Record the result in the plan's feature log and update the readiness scorecard/release gates

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for AI-assisted development guidelines used by VS Code Copilot and Copilot CLI.

See [apps/admin/README.md](apps/admin/README.md) for the admin SPA, including local development at `https://localhost:3001`.

## Deploying to Azure

> **Status:** the Azure resources are provisioned (see [plan-motorcycle-web-app.md](plan-motorcycle-web-app.md#provisioned-azure-resources-as-of-2026-09-22)) and the automated pipeline is defined, but it has **not** run yet: the one-time setup below must be completed first, and the first deployment must be validated.

### How the pipeline works

Pushing to `master` runs `.github/workflows/deploy.yml`:

1. **CI** (`ci.yml`, reused): API build and tests, web and admin lint and build. Any failure stops the pipeline.
2. **Change detection:** only the apps whose files changed are deployed (`apps/api/**`, `apps/web/**` plus root package/lock files, `apps/admin/**` plus root package/lock files).
3. **Deploy** (job environment `production`, Azure login by OIDC, no stored secrets):
   - **API** to `motorcycle-api-prod`: `dotnet publish` then `azure/webapps-deploy`.
   - **Web** to `motorcycle-web-prod`: Next.js standalone build (`output: "standalone"`), static assets copied in, started with `HOSTNAME=0.0.0.0 node apps/web/server.js`.
   - **Admin** to `motorcycle-admin-prod`: Vite build served with `pm2 serve ... --spa`.

Pull requests run CI only (`ci.yml`). **Run workflow** on the Actions tab (`workflow_dispatch`) redeploys all three apps.

**Database:** the pipeline does not run migrations or SQL scripts. The API still applies EF Core migrations when it starts, so a deployed API with new migrations updates the database on first start. Manage any manual SQL deployment yourself and deploy it before pushing code that depends on it.

### One-time setup

1. **Azure app registration for GitHub OIDC** (replace placeholders):

```powershell
az login
$sub = az account show --query id -o tsv
$app = az ad app create --display-name "motorcycle-github-deploy" --query appId -o tsv
az ad sp create --id $app
az role assignment create --assignee $app --role "Website Contributor" `
  --scope "/subscriptions/$sub/resourceGroups/motorcycle-prod-rg"
az ad app federated-credential create --id $app --parameters '{
  "name": "github-production",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:ryanpaulcariaga/motorcycle:environment:production",
  "audiences": ["api://AzureADTokenExchange"]
}'
az account show --query tenantId -o tsv   # tenant id
$app                                      # client id
```

2. **GitHub environment:** Settings > Environments > New environment named `production`. Do not add required reviewers if you want fully automatic deployment.
3. **GitHub secrets** (Settings > Secrets and variables > Actions > Secrets): `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`.
4. **GitHub variables** (Variables tab): `NEXT_PUBLIC_API_URL` (API URL), `NEXT_PUBLIC_SITE_URL` (public web URL), `VITE_API_URL` (API URL). Optional overrides: `AZURE_API_APP_NAME`, `AZURE_WEB_APP_NAME`, `AZURE_ADMIN_APP_NAME` (default to the `motorcycle-*-prod` names).
5. **App Service runtime stacks:** API = .NET 10, web = Node 22 LTS, admin = Node 22 LTS (needed for `pm2 serve`). Set them on each Web App.
6. **API configuration:** complete the API application settings (Facebook, CORS, redirect URIs) in M1 below. Key Vault references for the connection strings are already set.
7. Ensure the GitHub repository's default branch is `master` (the workflows trigger on `master`).

### Verify a deployment

- Actions tab: CI and each deploy job green.
- `https://<api-host>/health` and `/health/ready` return `200`.
- `https://<web-host>/bikes` lists bikes with images; `/sitemap.xml` and `/robots.txt` use the production host.
- Administrator sign-in at `https://<admin-host>` works (check CORS and the Facebook redirect URI if it fails).
- Create the first administrator with the bootstrap command in the plan's Feature Log if the production database has none.

### Manual deployment (fallback)

Use these steps if the pipeline is unavailable. Prerequisites: Azure CLI (`az login`), .NET 10 SDK, Node 22 with pnpm, and access to the resource group. Deploy the API first.

Resource group `motorcycle-prod-rg` (Southeast Asia) hosts one Linux App Service plan with three Web Apps:

| App | Web App | Source | Runtime |
|---|---|---|---|
| API | `motorcycle-api-prod` | `apps/api/Motorcycle.Api` | .NET 10 |
| Public web | `motorcycle-web-prod` | `apps/web` | Node.js |
| Admin | `motorcycle-admin-prod` | `apps/admin` | Static files (Vite build) |

### M1. Configure the API (once)

- Key Vault references (already set): `ConnectionStrings__DefaultConnection` and `Storage__ConnectionString` resolve from `motorcycle-prod-kv` through the app's managed identity (**Key Vault Secrets User**).
- Add these application settings (use the real URLs; the Facebook redirect must be registered in the Facebook app):

```powershell
az webapp config appsettings set -g motorcycle-prod-rg -n motorcycle-api-prod --settings `
  "AdminAuth__FacebookClientId=<id>" "AdminAuth__FacebookClientSecret=@Microsoft.KeyVault(SecretUri=<secret-uri>)" `
  "AdminAuth__FacebookRedirectUri=https://<api-host>/api/admin/auth/facebook/callback" `
  "AdminAuth__AdminAppUrl=https://<admin-host>" `
  "UserAuth__WebAppUrl=https://<web-host>" "UserAuth__Facebook__ClientId=<id>" `
  "UserAuth__Facebook__ClientSecret=@Microsoft.KeyVault(SecretUri=<secret-uri>)" `
  "UserAuth__Facebook__RedirectUri=https://<api-host>/api/auth/facebook/callback" `
  "Cors__AllowedOrigins__0=https://<web-host>" "Cors__AllowedOrigins__1=https://<admin-host>"
```

- Keep secrets in Key Vault, never in source or plain settings. Swagger is on only when `ASPNETCORE_ENVIRONMENT=Development`, so leave production as `Production`.
- The PostgreSQL firewall must allow Azure services (already enabled). The API applies EF Core migrations on startup.

### M2. Deploy the API

```powershell
dotnet publish apps\api\Motorcycle.Api\Motorcycle.Api.csproj -c Release -o publish
Compress-Archive -Path publish\* -DestinationPath api.zip -Force
az webapp deploy -g motorcycle-prod-rg -n motorcycle-api-prod --src-path api.zip --type zip
```

Verify: `https://<api-host>/health` returns `200` and `https://<api-host>/health/ready` returns `200` (database reachable). Create the first administrator with the bootstrap command in the plan's Feature Log if the production database has none.

### M3. Deploy the public web app

Set the API URL at build time (it is baked into the client bundle) and the public site URL used by the sitemap and robots files:

```powershell
$env:NEXT_PUBLIC_API_URL = "https://<api-host>"
$env:NEXT_PUBLIC_SITE_URL = "https://<web-host>"
pnpm install --frozen-lockfile
pnpm --filter web build
Copy-Item apps\web\.next\static apps\web\.next\standalone\apps\web\.next\static -Recurse
Copy-Item apps\web\public apps\web\.next\standalone\apps\web\public -Recurse
Compress-Archive -Path apps\web\.next\standalone\* -DestinationPath web.zip -Force
az webapp deploy -g motorcycle-prod-rg -n motorcycle-web-prod --src-path web.zip --type zip
az webapp config set -g motorcycle-prod-rg -n motorcycle-web-prod --startup-file "HOSTNAME=0.0.0.0 node apps/web/server.js"
```

`apps/web` builds as a Next.js standalone bundle. Copy the static assets into it, zip it, deploy, and set the startup command. The local `pnpm --filter web start` script is Windows-specific (it uses `set` and a local dev certificate) and must not be used on App Service, which terminates TLS itself. Add your Blob Storage hostname to `remotePatterns` in `apps/web/next.config.ts` if it differs from `*.blob.core.windows.net`.

### M4. Deploy the admin SPA

```powershell
$env:VITE_API_URL = "https://<api-host>"
pnpm --filter admin build
Compress-Archive -Path apps\admin\dist\* -DestinationPath admin.zip -Force
az webapp deploy -g motorcycle-prod-rg -n motorcycle-admin-prod --src-path admin.zip --type zip
az webapp config set -g motorcycle-prod-rg -n motorcycle-admin-prod --startup-file "pm2 serve /home/site/wwwroot --no-daemon --spa"
```

The `--spa` flag serves `index.html` for client-side routes. The API (not the SPA) owns the Facebook callback.

### Manual verification extras

- `https://<web-host>/bikes` lists bikes and images load.
- `https://<web-host>/sitemap.xml` and `/robots.txt` use the production host.
- Signing in at `https://<admin-host>` succeeds for an active administrator (check CORS and the redirect URI if it fails).
- Browser requests carry the `mc_admin_session` / `mc_user_session` cookies across hosts; if sign-in loops, review cookie `SameSite`/domain settings for your final domains.

