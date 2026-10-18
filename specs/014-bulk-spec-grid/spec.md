# Feature Specification: Bulk Spec Grid

**Feature Branch**: `014-bulk-spec-grid`
**Created**: 2026-10-19
**Status**: Implemented locally (manual browser verification pending)

## Summary

Replaces the one-spec-at-a-time Bikes Bulk Edit screen with an Excel-style grid: rows are bikes, columns are specifications (grouped by spec group, in `sortOrder`). Built with `react-data-grid` (MIT, free for commercial use).

## Acceptance Scenarios

1. **Given** optional brand/category/price filters, **When** I load, **Then** every matching bike (published or not) appears as a row with all spec columns.
2. **Given** the grid, **When** I edit, paste (Ctrl+V), or fill-drag cells, **Then** changed cells are highlighted and counted.
3. **Given** invalid number/boolean text, **Then** the cell is flagged and save is blocked client-side.
4. **Given** changes, **When** I save, **Then** all changes are applied in one transaction; any server-side invalid cell rejects the whole batch (`400`), unknown bikes return `404`.
5. **Given** unsaved edits, **When** I reload filters or leave the page, **Then** I am warned.
6. **Given** spec group checkboxes, **Then** I can hide groups to reduce columns.

## Out of scope

Per-row concurrency checks (last write wins, as in the single-spec edit); enum option lists (enum specs are edited as text).
