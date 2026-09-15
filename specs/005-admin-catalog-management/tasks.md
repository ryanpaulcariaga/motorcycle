# Tasks: Admin Catalog Management

## API and Security

- [ ] Configure Microsoft Entra ID authentication and an administrator role or group authorization model.
- [ ] Add protected `/api/admin` routing without changing public catalog access.
- [ ] Define DTOs, validation, and application services for motorcycle, image, lookup, and specification metadata mutations.
- [ ] Implement protected motorcycle CRUD and publish-state operations.
- [ ] Implement protected brand, category, spec-group, and spec-definition management.
- [ ] Implement protected image upload, assignment, ordering, primary-image, and removal operations.
- [ ] Add API tests for authorization, validation, image invariants, and shared catalog visibility.

## Admin Frontend

- [ ] Scaffold `apps/admin` with Next.js, TypeScript, Tailwind CSS, and a typed API client.
- [ ] Build the authenticated administration shell and navigation.
- [ ] Build motorcycle list/search and create/edit pages.
- [ ] Build motorcycle specification and image-management interfaces.
- [ ] Build brand/category and spec-group/spec-definition metadata interfaces.
- [ ] Add responsive behavior and user-facing validation and mutation error states.
- [ ] Add focused frontend tests for primary administration workflows.

## Infrastructure and Documentation

- [ ] Add an `admin` App Service configuration and protected environment settings.
- [ ] Add path-scoped CI/CD build, test, and deployment workflow support for `apps/admin`.
- [ ] Update API, architecture, database, and repository documentation with the finalized API and identity-provider details.
