# Research: Admin Catalog Management

## Decision: Use Facebook OAuth2 for Stage 1 administrator authentication

**Rationale:** Facebook OAuth2 provides the requested MVP sign-in flow without introducing local password storage. The admin Next.js application authenticates users, and the API accepts only the configured administrator identity or allowlist entry. The provider can be replaced before production if organizational identity requirements change.

**Alternatives considered:** Microsoft Entra ID remains a possible production provider for Azure-hosted administration. A local username/password implementation would add credential storage, recovery, and security maintenance. API keys do not identify individual operators and are inappropriate for an interactive administration site.

## Decision: Stage the admin catalog by aggregate

**Rationale:** BikeModel CRUD is a small, independently useful vertical slice for validating the admin shell, authentication, shared API boundary, and referential-integrity errors. Bike variants, images, and spec metadata have wider validation and storage concerns and are deferred to separate stages.

## Decision: Use one API with explicit public and admin boundaries

**Rationale:** The existing API owns catalog domain logic, EF Core persistence, and Blob Storage integration. Public read endpoints remain anonymous; protected `/api/admin` mutation endpoints avoid duplicating services or allowing the admin browser direct infrastructure access.

**Alternatives considered:** A dedicated admin backend would duplicate catalog logic and create contract drift. Calling PostgreSQL or Blob Storage directly from the admin app would expose credentials and bypass validation.

## Deferred Decision: Upload and assign images through the API

**Rationale:** The later image stage will have the API validate file type and size, persist assignment metadata, enforce one primary image per bike, and use Key Vault-backed Blob Storage credentials. The browser will submit image data only to an authorized endpoint.

**Alternatives considered:** Browser uploads with shared storage keys expose a secret. Direct browser uploads with short-lived SAS tokens may be evaluated later but require additional issuance, scope, and revocation controls not needed for the first administration release.

## Decision: Validate specification values from metadata

**Rationale:** `spec_definitions` already declares data type and filter behavior, while motorcycles retain flexible JSONB values. Applying validation in the Application layer keeps metadata and stored values coherent before infrastructure persistence.

**Alternatives considered:** Client-only validation can be bypassed. Restricting all specifications to fixed relational columns would reduce the catalog's intended flexibility.
