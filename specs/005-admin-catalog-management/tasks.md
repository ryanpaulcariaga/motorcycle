# Tasks: Admin Catalog Management

## Stage 1 API and Security

- [ ] Configure Facebook OAuth2 authentication and the Stage 1 admin allowlist.
- [ ] Add protected `/api/admin` routing without changing public catalog access.
- [ ] Define BikeModel DTOs, validation, repository operations, and application services.
- [ ] Implement protected BikeModel list, create, update, and delete operations.
- [ ] Reject deletion when bikes reference the BikeModel and return a stable conflict response.
- [ ] Add API tests for OAuth2 protection, CRUD validation, conflict behavior, and public catalog visibility.

## Stage 1 Admin Frontend

- [ ] Scaffold `apps/admin` with Next.js, TypeScript, Tailwind CSS, and a typed API client.
- [ ] Copy the public web UI theme and build the authenticated administration shell.
- [ ] Build BikeModel list, add, edit, delete confirmation, and conflict-error states.
- [ ] Add responsive behavior and user-facing validation and mutation error states.
- [ ] Add focused frontend tests for BikeModel workflows.

## Deferred Follow-on Stages

- [ ] Add bike CRUD and publication workflows.
- [ ] Add Azure Storage upload and bike image assignment workflows.
- [ ] Add spec-group and spec-definition CRUD.
- [ ] Add deployment, CI/CD, and production OAuth2 configuration after Stage 1 stabilizes.
- [ ] Update API, architecture, database, and repository documentation as each stage is implemented.
