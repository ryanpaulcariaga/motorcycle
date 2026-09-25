# Motorcycle API Administration Bootstrap

After the AdminRole migration has been applied and the API implementation is complete, create the first administrator from an operator terminal:

```powershell
dotnet run --project apps/api/Motorcycle.Api -- admin bootstrap --facebook-user-id <id> --email <email> --display-name <name>
```

Inspect the active Azure-backed administrator records without changing data:

```powershell
dotnet run --project apps/api/Motorcycle.Api -- admin list
```

The command is operator-only and idempotent for an existing active `Administrator` record. It must not be exposed as an HTTP endpoint or run before the migration exists.

## Admin Authentication Configuration

The API owns the Facebook Authorization Code + PKCE callback and the administrator session. For local development, set the Facebook credentials through the API user-secret store; do not add them to `appsettings*.json` or the React admin SPA:

```powershell
dotnet user-secrets set "AdminAuth:FacebookClientId" "<facebook-app-id>" --project apps/api/Motorcycle.Api/Motorcycle.Api.csproj
dotnet user-secrets set "AdminAuth:FacebookClientSecret" "<facebook-app-secret>" --project apps/api/Motorcycle.Api/Motorcycle.Api.csproj
```

The local redirect URI is `https://localhost:7240/api/admin/auth/facebook/callback`, and the API redirects successful sign-ins to `https://localhost:3001`. Use [appsettings.Admin.example.json](appsettings.Admin.example.json) as the non-secret configuration reference.

## Public User Authentication Configuration

The API also owns public-user sign-in for `apps/web` under `/api/auth`, using the same Authorization Code + PKCE pattern as admin sign-in but a separate `UserAuth` cookie scheme, session cookie, and `users`/`user_external_logins` tables. Any active Facebook user can sign in; there is no manual allowlist. Set credentials through user secrets:

```powershell
dotnet user-secrets set "UserAuth:Facebook:ClientId" "<facebook-app-id>" --project apps/api/Motorcycle.Api/Motorcycle.Api.csproj
dotnet user-secrets set "UserAuth:Facebook:ClientSecret" "<facebook-app-secret>" --project apps/api/Motorcycle.Api/Motorcycle.Api.csproj
```

The local redirect URI is `https://localhost:7240/api/auth/facebook/callback`, and the API redirects successful sign-ins to `https://localhost:3000`. The same or a different Facebook App can be reused; register both redirect URIs on it. A future provider (e.g. Google) adds its own `UserAuth:Google:*` secrets and an `IExternalAuthProvider` implementation without changing the session or account-linking model.

## Facebook App Portal Setup (one app, admin + web)

One Facebook App is reused for both `AdminAuth` and `UserAuth` — it's just an OAuth client with multiple valid redirect URIs, not a per-frontend registration. In the app's **Use cases** screen (Meta's current developer console layout has no separate "Products" sidebar), open **Authenticate and request data from users with Facebook Login → Customize**:

- **Permissions and features**: add `email` in addition to the default `public_profile` — public sign-in requests `email` and Facebook rejects the auth URL with "Invalid Scopes: email" until it's added here. Both permissions work in Development mode with no App Review needed.
- **Settings → Valid OAuth Redirect URIs**: add all four callbacks (local + prod, admin + public web):
  ```
  https://localhost:7240/api/admin/auth/facebook/callback
  https://localhost:7240/api/auth/facebook/callback
  https://motorcycle-api-prod-f8hqerghe2dyhnbx.southeastasia-01.azurewebsites.net/api/admin/auth/facebook/callback
  https://motorcycle-api-prod-f8hqerghe2dyhnbx.southeastasia-01.azurewebsites.net/api/auth/facebook/callback
  ```
- Confirm **Client OAuth Login** and **Web OAuth Login** are both **Yes**.
- While the app is in Development mode, only Facebook accounts with a role on the app (Administrators/Developers/Testers, under **App roles**) can complete sign-in. Switching to **Live** (after adding a Privacy Policy URL and Terms of Service URL under **App Settings → Basic**) is required before other Facebook users can sign in.

