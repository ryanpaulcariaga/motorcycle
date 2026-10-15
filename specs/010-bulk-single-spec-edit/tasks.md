# Tasks: Bulk Single-Spec Edit

- [X] T001 Add DTOs in `apps/api/Motorcycle.Application/DTOs/BikeAdminDto.cs`
- [X] T002 Add repository methods `GetForSpecEditAsync` / `GetByIdsAsync` (interface, EF implementation, test fake)
- [X] T003 Add `GetSpecValuesAsync` / `UpdateSingleSpecAsync` to `BikeAdminService`
- [X] T004 Add `spec-values` GET/PUT endpoints to `AdminBikesController`
- [X] T005 Add client functions and types in `apps/admin/lib`
- [X] T006 Build `BulkSpecEditor.tsx`, route, and sidebar link
- [X] T007 Document endpoints in `docs/api.md`
- [ ] T008 Run `dotnet build`/`dotnet test` and admin typecheck/lint (earlier run timed out)
- [ ] T009 Add focused tests: all-or-nothing validation, null clears spec, unknown bike returns 404, optional filters
- [ ] T010 Manual check in the browser against the live API
