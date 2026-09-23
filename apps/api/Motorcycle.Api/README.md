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
