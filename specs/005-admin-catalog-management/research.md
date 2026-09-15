# Research: Admin Catalog Management

## Decision: Use Facebook Authorization Code + PKCE with an application-managed session

**Rationale:** PKCE protects the authorization-code exchange for the separate admin frontend without introducing local passwords. The admin app owns provider callbacks and stores only an application session in an HttpOnly, secure cookie. Server-side API calls use a short-lived first-party credential containing the Facebook user ID; the API never accepts Facebook access tokens.

**Alternatives considered:** Sending Facebook access tokens directly to the API violates the approved trust boundary. A local password flow adds credential storage and recovery. Microsoft Entra ID may be evaluated later for organizational deployment but does not satisfy the requested Stage 1 provider.

## Decision: Mint a short-lived RS256 first-party JWT in the admin server

**Rationale:** The admin server can exchange its already-authenticated application session for a 5-10 minute JWT without exposing Facebook credentials to the API or browser. The API validates the asymmetric signature with a public key and checks `iss`, `aud`, `sub`, `exp`, and `jti` before loading the active role record by Facebook user ID. The private signing key remains an admin-application secret; the API needs only the public key and expected claim configuration.

**Alternatives considered:** Sending Facebook access tokens to the API is explicitly disallowed. A shared symmetric signing secret would require duplicating a high-value secret in both applications. A public token-exchange endpoint would add another externally reachable authentication surface without improving the server-side flow.

## Decision: Authorize through a durable AdminRole table

**Rationale:** A database role record provides explicit provisioning, activation/deactivation, audit timestamps, and stable authorization independent of provider profile changes. The unique Facebook user ID is the identity key; email and display name remain editable snapshots.

**Alternatives considered:** A configuration allowlist cannot support the required role-management UI or lifecycle timestamps. Public self-registration would allow unauthorized access and is out of scope.

## Decision: Bootstrap the first administrator separately, then expose role management before BikeModel CRUD

**Rationale:** Role management must be usable before other catalog mutations, but an empty role table cannot authorize its own first record. An operator-only, idempotent bootstrap command establishes the initial active administrator after migrations are applied; all subsequent provisioning and status changes use the protected role-management surface.

**Alternatives considered:** Seeding a hard-coded production identity would couple deployment to a specific user. Allowing any Facebook user to self-bootstrap would undermine the private boundary. Running the command before the migration or before its implementation exists is invalid and must be avoided.

## Decision: Keep one shared API with explicit public and admin boundaries

**Rationale:** The existing API owns catalog logic and persistence. Protected `/api/admin` endpoints prevent duplicate business rules and keep PostgreSQL and Blob Storage credentials out of both frontends. Public catalog routes remain anonymous and read-only.

**Alternatives considered:** A separate admin backend would duplicate services and create contract drift. Direct browser access to PostgreSQL or Blob Storage would bypass authorization and validation.

## Decision: Enforce BikeModel delete protection in the application before persistence

**Rationale:** The current EF mapping cascades from BikeModel to Bike. A service-level dependent-bike check is required to avoid silently deleting catalog variants and images. The API returns a stable `409 Conflict` error with code `bike_model_referenced`.

**Alternatives considered:** Relying on database cascade behavior violates the product requirement. Changing the foreign key to restrict deletes alone would produce an infrastructure-shaped error and would not provide the required actionable contract.

## Decision: Defer bikes, images, and specification metadata

**Rationale:** Stage 1 validates authentication, authorization, role lifecycle, shared API contracts, and the smallest catalog aggregate. Bike records, Blob Storage operations, and flexible specification validation remain separate stages with their own contracts and tests.

**Alternatives considered:** Adding deferred endpoints now would widen the security and data-model surface without delivering the requested Stage 1 workflow.

## Implementation Note: Local development identity and HTTPS

The local Stage 1 flow uses Next.js experimental HTTPS on `https://localhost:3001`, Meta Facebook Login with the `public_profile` permission, and an operator-bootstrapped app-scoped Facebook user ID. The API runs on `https://localhost:7240` from both Visual Studio's `https` profile and `dotnet run --launch-profile https`. The admin server proxies protected requests so Facebook tokens remain server-side.
