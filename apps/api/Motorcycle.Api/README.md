# Motorcycle API Administration Bootstrap

After the AdminRole migration has been applied and the API implementation is complete, create the first administrator from an operator terminal:

```powershell
dotnet run --project apps/api/Motorcycle.Api -- admin bootstrap --facebook-user-id <id> --email <email> --display-name <name>
```

The command is operator-only and idempotent for an existing active `Administrator` record. It must not be exposed as an HTTP endpoint or run before the migration exists.
