# Quickstart: Admin Bike Catalog Filters

## Prerequisites

- Workspace dependencies are installed.
- The admin application can access the shared API and has bike models across more than one brand and category.

## Build validation

From the repository root, run:

```powershell
pnpm --filter admin build
```

Expected result: TypeScript compilation and the Vite production build complete successfully.

## Manual validation

1. Open the admin application and navigate to the Bikes tab.
2. Confirm both filters default to an unfiltered selection and all models are shown.
3. Select a brand; verify every displayed model belongs to that brand.
4. Clear the brand filter, select a category; verify every displayed model belongs to that category.
5. Select both a brand and category; verify each displayed model matches both.
6. Confirm brand and category filters are grouped together and Clear filters is disabled unless a filter is active.
7. Click Brand, Category, and Model line headers; verify each sorts the visible rows ascending and displays an active sort arrow.
8. Click the active sort header again; verify the visible rows reverse and the arrow changes direction.
9. Change or clear filters; verify matching models remain in the selected ordering.
10. Choose a combination with no matching models; verify a distinct no-match message appears while the filter controls remain usable.
11. Clear both filters; verify all loaded models reappear.
12. Confirm create, edit, variant navigation, delete, and refresh remain accessible.
13. Select a brand and category and a non-default sort; note the Bikes URL query parameters.
14. Open Variants for a model and use the Bikes return link; verify the same selections and ordering are restored.
15. Repeat the Variants navigation using only a brand filter, then only a category filter; verify each is restored independently.
16. Refresh the filtered Bikes URL or open it in a new tab; verify the selected filters, sort field, and direction are restored.
