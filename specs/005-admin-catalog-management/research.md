# Research: Admin Catalog Management

## Decision: Use Microsoft Entra ID for administrator authentication

**Rationale:** The application is planned for Azure App Service and Key Vault, so Microsoft Entra ID provides a managed identity provider for a private internal site without storing administrator passwords in the application. The admin Next.js application authenticates users, and the API validates bearer tokens and authorizes a configured administrator role or group claim.

**Alternatives considered:** A local username/password implementation would add credential storage, recovery, and security maintenance. API keys do not identify individual operators and are inappropriate for an interactive administration site.

## Decision: Use one API with explicit public and admin boundaries

**Rationale:** The existing API owns catalog domain logic, EF Core persistence, and Blob Storage integration. Public read endpoints remain anonymous; protected `/api/admin` mutation endpoints avoid duplicating services or allowing the admin browser direct infrastructure access.

**Alternatives considered:** A dedicated admin backend would duplicate catalog logic and create contract drift. Calling PostgreSQL or Blob Storage directly from the admin app would expose credentials and bypass validation.

## Decision: Upload and assign images through the API

**Rationale:** The API can validate file type and size, persist assignment metadata, enforce one primary image per motorcycle, and use Key Vault-backed Blob Storage credentials. The browser submits image data only to an authorized endpoint.

**Alternatives considered:** Browser uploads with shared storage keys expose a secret. Direct browser uploads with short-lived SAS tokens may be evaluated later but require additional issuance, scope, and revocation controls not needed for the first administration release.

## Decision: Validate specification values from metadata

**Rationale:** `spec_definitions` already declares data type and filter behavior, while motorcycles retain flexible JSONB values. Applying validation in the Application layer keeps metadata and stored values coherent before infrastructure persistence.

**Alternatives considered:** Client-only validation can be bypassed. Restricting all specifications to fixed relational columns would reduce the catalog's intended flexibility.
