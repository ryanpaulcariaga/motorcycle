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

> **Status:** the Azure resources are provisioned (see [plan-motorcycle-web-app.md](plan-motorcycle-web-app.md#provisioned-azure-resources-as-of-2026-09-22)) and the pipeline is defined. CI passes on `master`, but no deployment has succeeded yet: the first attempt failed at Azure login (secrets not configured) and the second skipped all deploy jobs (no app files changed). Complete the one-time setup below, then run the workflow manually with **Run workflow** to deploy all three apps. Deploy jobs fail fast with a clear message if a required secret or variable is missing.

### How the pipeline works

Pushing to `master` runs `.github/workflows/deploy.yml`:

1. **CI** (`ci.yml`, reused): API build and tests, web and admin lint and build. Any failure stops the pipeline.
2. **Change detection:** only the apps whose files changed are deployed (`apps/api/**`, `apps/web/**` plus root package/lock files, `apps/admin/**` plus root package/lock files; `deploy.yml` itself counts for every app).
3. **Deploy** (job environment `production`, Azure login by OIDC, no stored secrets):
   - **API** to `motorcycle-api-prod`: `dotnet publish` then `azure/webapps-deploy`.
   - **Web** to `motorcycle-web-prod`: Next.js standalone build (`output: "standalone"`), static assets copied in, started with `HOSTNAME=0.0.0.0 node apps/web/server.js`.
   - **Admin** to `motorcycle-admin-prod`: Vite build served with `pm2 serve ... --spa`.

Pull requests run CI only (`ci.yml`). **Run workflow** on the Actions tab (`workflow_dispatch`) redeploys all three apps.

**Database:** the pipeline does not run migrations or SQL scripts, and the API does not apply them at startup in deployed environments (`Database:MigrateOnStartup` is `false` outside Development). Apply migrations yourself before deploying code that depends on them; see [Database migrations](#database-migrations-production).

### One-time setup (production)

This is the setup performed for the **production** environment. Values that are specific to production are shown in **bold**; to build another environment (dev, QA), repeat the same steps and change only those values (see [Adding another environment](#adding-another-environment-dev-qa)).

**1. Azure identity for GitHub OIDC.** Prerequisite: Azure CLI (`winget install Microsoft.AzureCLI`, then open a new PowerShell window) and an account that can create app registrations and assign roles on the resource group. Run from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-azure-oidc.ps1
```

The defaults are the production values: resource group **`motorcycle-prod-rg`**, GitHub environment **`production`**, app registration **`motorcycle-github-deploy`**. [setup-azure-oidc.ps1](scripts/setup-azure-oidc.ps1) is safe to re-run. It:

- creates (or reuses) the app registration and service principal (no client secret; OIDC only),
- assigns **Website Contributor** on the resource group,
- adds the federated credential with subject `repo:ryanpaulcariaga@3658143/motorcycle@1352834212:environment:<environment>` (and replaces the named credential if its issuer, subject, or audience is stale),
- prints the three values needed in step 3.

If an `azure/login` step fails with `AADSTS700213` (no matching federated identity record), see [Troubleshooting deployments](#troubleshooting-deployments).

<details>
<summary>Manual alternative (Azure Portal)</summary>

1. **Microsoft Entra ID > App registrations > New registration**, named `motorcycle-github-deploy`. Copy the **Application (client) ID** and **Directory (tenant) ID**.
2. In the registration: **Certificates & secrets > Federated credentials > Add credential**. Scenario **GitHub Actions deploying Azure resources**, organization `ryanpaulcariaga`, repository `motorcycle`, entity type **Environment**, environment name **`production`**, credential name `github-production`.
3. **Resource groups > motorcycle-prod-rg > Access control (IAM) > Add role assignment**: role **Website Contributor**, member `motorcycle-github-deploy`.
4. Copy the **Subscription ID** from **Subscriptions**.

</details>

**2. GitHub environment.** Settings > Environments > New environment named **`production`** (it must match the federated credential subject exactly). Do not add required reviewers if you want fully automatic deployment.

**3. GitHub secrets** (environment secrets in `production`): the script prints these values.

| Secret | Value |
|---|---|
| `AZURE_CLIENT_ID` | Application (client) ID of `motorcycle-github-deploy` |
| `AZURE_TENANT_ID` | Directory (tenant) ID (Microsoft Entra ID > Overview) |
| `AZURE_SUBSCRIPTION_ID` | Subscription containing `motorcycle-prod-rg` |

**4. GitHub variables** (environment variables in `production`): `NEXT_PUBLIC_API_URL` (**production** API URL), `NEXT_PUBLIC_SITE_URL` (**production** public web URL), `VITE_API_URL` (**production** API URL). Optional overrides: `AZURE_API_APP_NAME`, `AZURE_WEB_APP_NAME`, `AZURE_ADMIN_APP_NAME` (default to the **`motorcycle-*-prod`** names).

**5. App Service runtime stacks** (on each Web App): API = .NET 10, web = Node 22 LTS, admin = Node 22 LTS (needed for `pm2 serve`).

**6. API configuration:** complete the API application settings (Facebook, CORS, redirect URIs) in M1 below. Key Vault references for the connection strings are already set.

**7. Branch:** the repository's default branch is `master` (confirmed), and `deploy.yml` triggers on `master`.

### Adding another environment (dev, QA)

Repeat the production setup with these changes. Everything else stays the same.

| What | Production (done) | Dev/QA: change to |
|---|---|---|
| Azure resources | `motorcycle-prod-rg` with `motorcycle-{api,web,admin}-prod`, `motorcycle-prod-pg`, `motorcycleimagesprod`, `motorcycle-prod-kv` | New resource group and resources with their own names (for example `motorcycle-dev-rg`, `motorcycle-api-dev`) |
| OIDC setup | `setup-azure-oidc.ps1` (defaults) | `.\scripts\setup-azure-oidc.ps1 -ResourceGroup motorcycle-dev-rg -Environment dev` (creates `motorcycle-github-deploy-dev` with its own federated credential) |
| GitHub environment | `production` | `dev` (same name passed to the script) |
| Secrets | `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` | Same names, set in the new environment with that environment's values (subscription and tenant may be identical) |
| Variables | Production URLs | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `VITE_API_URL` for the new environment; set `AZURE_API_APP_NAME`, `AZURE_WEB_APP_NAME`, `AZURE_ADMIN_APP_NAME` to the new Web App names |
| API app settings | Production Facebook app, redirect URIs, CORS (M1) | The new environment's hosts and a separate Facebook app or its dev redirect URIs |
| Workflow | `deploy.yml` hardcodes `environment: production` and the `master` trigger | Not yet parameterized: add a workflow (or an environment input) that targets the new environment and branch before deploying; this is the only code change |

### Troubleshooting deployments

| Symptom | Cause and fix |
|---|---|
| `azure/login` fails with `AADSTS700213` (no matching federated identity record) | The Entra federated credential does not match the token. Open the failed step's **Federated token details** and compare with the credential: issuer `https://token.actions.githubusercontent.com`, audience `api://AzureADTokenExchange`, and subject exactly as logged. This repository uses GitHub's immutable subject, `repo:ryanpaulcariaga@3658143/motorcycle@1352834212:environment:production`, not the legacy `repo:owner/repo:environment:production`. Rerun `setup-azure-oidc.ps1` (it replaces a stale `github-<environment>` credential; pass `-OwnerId` and `-RepositoryId` for another repository). `job_workflow_ref` is informational and is not matched |
| A deploy job fails with "Missing ... in the 'production' environment" | Add the named secret or variable to the GitHub `production` environment (steps 3-4 above) |
| `azure/login` fails because secrets are empty or wrong | `AZURE_CLIENT_ID` must be the app registration that holds the federated credential; the tenant and subscription must match it. Rerunning the setup script does not require re-entering secrets unless the printed values differ |
| After a green deploy, a site shows "Your web app is running and waiting for your content" or loads for minutes | Each deploy restarts the App Service; on the Basic plan the first request can take 2-4 minutes while Node (web, admin) starts. Wait and retry before investigating. If it persists, check **Log stream** and the startup command (`az webapp config show -g motorcycle-prod-rg -n <app> --query "{stack:linuxFxVersion,startup:appCommandLine}"`) |
| API never responds (`/health` times out) | Startup migrations are off by default in deployed environments, so a hang usually means the app is not starting at all. Check **Log stream** / `az webapp log tail -g motorcycle-prod-rg -n motorcycle-api-prod`; confirm the runtime is .NET 10 and that the Key Vault references on `ConnectionStrings__DefaultConnection` and `Storage__ConnectionString` show a green "Key Vault Reference" status (managed identity enabled with **Key Vault Secrets User**). If `Database__MigrateOnStartup=true` is set, an unreachable PostgreSQL blocks startup; remove the setting and check that PostgreSQL allows Azure services. `/health/ready` returns 503 while the database is unreachable |
| All deploy jobs are skipped | A push that changes only docs or `scripts/` selects no app. Use **Run workflow** with `deploy_all` checked |

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
- In Azure Portal, open **App Services → `motorcycle-api-prod` → Settings → Environment variables** (or **Configuration → Application settings**) and add/update the settings below. The Azure setting names use double underscores to represent the `:` hierarchy in API configuration. These are the current default domains:

  | Setting | Value |
  |---|---|
  | `AdminAuth__AdminAppUrl` | `https://motorcycle-admin-prod-a4brh0c3eha0h4ch.southeastasia-01.azurewebsites.net` |
  | `AdminAuth__FacebookRedirectUri` | `https://motorcycle-api-prod-f8hqerghe2dyhnbx.southeastasia-01.azurewebsites.net/api/admin/auth/facebook/callback` |
  | `UserAuth__WebAppUrl` | `https://motorcycle-web-prod-bmhpb4hbbah9e7dy.southeastasia-01.azurewebsites.net` |
  | `UserAuth__Facebook__RedirectUri` | `https://motorcycle-api-prod-f8hqerghe2dyhnbx.southeastasia-01.azurewebsites.net/api/auth/facebook/callback` |
  | `Cors__AllowedOrigins__0` | `https://motorcycle-web-prod-bmhpb4hbbah9e7dy.southeastasia-01.azurewebsites.net` |
  | `Cors__AllowedOrigins__1` | `https://motorcycle-admin-prod-a4brh0c3eha0h4ch.southeastasia-01.azurewebsites.net` |

  Keep the existing `AdminAuth__FacebookClientId`, `AdminAuth__FacebookClientSecret`, `UserAuth__Facebook__ClientId`, and `UserAuth__Facebook__ClientSecret` settings. The Facebook callback URLs must also be registered in the Facebook app as described in [the API Facebook setup guide](apps/api/Motorcycle.Api/README.md#facebook-app-portal-setup-one-app-admin--web). Do not add trailing slashes to app URLs or CORS origins.

  The same settings can be applied with Azure CLI from PowerShell (retain the existing client IDs and Key Vault secret references, substituting the actual secret URI if needed):

```powershell
az webapp config appsettings set -g motorcycle-prod-rg -n motorcycle-api-prod --settings `
  "AdminAuth__FacebookRedirectUri=https://motorcycle-api-prod-f8hqerghe2dyhnbx.southeastasia-01.azurewebsites.net/api/admin/auth/facebook/callback" `
  "AdminAuth__AdminAppUrl=https://motorcycle-admin-prod-a4brh0c3eha0h4ch.southeastasia-01.azurewebsites.net" `
  "UserAuth__WebAppUrl=https://motorcycle-web-prod-bmhpb4hbbah9e7dy.southeastasia-01.azurewebsites.net" `
  "UserAuth__Facebook__RedirectUri=https://motorcycle-api-prod-f8hqerghe2dyhnbx.southeastasia-01.azurewebsites.net/api/auth/facebook/callback" `
  "Cors__AllowedOrigins__0=https://motorcycle-web-prod-bmhpb4hbbah9e7dy.southeastasia-01.azurewebsites.net" `
  "Cors__AllowedOrigins__1=https://motorcycle-admin-prod-a4brh0c3eha0h4ch.southeastasia-01.azurewebsites.net"
```

- Keep secrets in Key Vault, never in source or plain settings. Leave `ASPNETCORE_ENVIRONMENT` as `Production`.
- In the GitHub repository's **Settings → Environments → `production` → Environment variables**, set `NEXT_PUBLIC_API_URL` and `VITE_API_URL` to `https://motorcycle-api-prod-f8hqerghe2dyhnbx.southeastasia-01.azurewebsites.net`, and `NEXT_PUBLIC_SITE_URL` to `https://motorcycle-web-prod-bmhpb4hbbah9e7dy.southeastasia-01.azurewebsites.net`. These frontend values are embedded during build, so redeploy the frontend apps after changing them.
- Optional API behavior settings (both default to off outside Development):
  - `Swagger__Enabled=true` serves Swagger UI at `https://<api-host>/swagger` (the API root redirects there; spec at `/swagger/v1/swagger.json`). It documents all endpoints, including `/api/admin`, which still require the administrator session cookie; remove the setting to hide it. Locally, the `https` launch profile opens `https://localhost:7240/swagger`.
  - `Database__MigrateOnStartup=true` applies pending EF Core migrations when the API starts. Leave it off in production and use the explicit step below.
- The PostgreSQL firewall must allow Azure services (already enabled).

### Database migrations (production)

The API never migrates the production database on its own, so a database problem cannot keep it from starting. Apply pending migrations explicitly, from a machine whose IP is allowed by the PostgreSQL firewall, before deploying code that needs them:

```powershell
$env:ConnectionStrings__DefaultConnection = "<production connection string>"
dotnet ef database update --project apps\api\Motorcycle.Infrastructure --startup-project apps\api\Motorcycle.Api
```

To review first, generate a script with `dotnet ef migrations script --idempotent ... -o migrate.sql` and run it with `psql`. Confirm with `https://<api-host>/health/ready`. For a one-off, you can instead set `Database__MigrateOnStartup=true`, restart the API, then remove the setting.

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
