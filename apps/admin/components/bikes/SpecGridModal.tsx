'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DataGrid,
  type CellCopyArgs,
  type CellPasteArgs,
  type Column,
  type ColumnOrColumnGroup,
  type FillEvent,
  type RenderEditCellProps,
} from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { AdminApiError, updateAdminBikeSpecGrid } from '@/lib/api';
import Modal, { ModalFooter } from '@/components/Modal';
import type { BikeSpecGridRow } from '@/lib/types';

export type SpecGroup = {
  code: string;
  name: string;
  sortOrder: number;
  definitions: {
    id: number;
    code: string;
    label: string;
    dataType: string;
    unit: string | null;
    sortOrder: number;
  }[];
};
type SpecDefinition = SpecGroup['definitions'][number];

// cells holds the editable text of every spec; saved holds the last persisted text.
type GridRow = Omit<BikeSpecGridRow, 'specs'> & {
  cells: Record<string, string>;
  saved: Record<string, string>;
  verifications: Record<string, string>;
  savedVerifications: Record<string, string>;
  resetVerifications: boolean;
  coreCells: { variantName: string; year: string; msrpPrice: string };
  savedCoreCells: { variantName: string; year: string; msrpPrice: string };
};

type CoreField = keyof GridRow['coreCells'];

function coreFieldForColumn(key: string): CoreField | undefined {
  switch (key) {
    case 'core:variantName':
      return 'variantName';
    case 'core:year':
      return 'year';
    case 'core:msrpPrice':
      return 'msrpPrice';
    default:
      return undefined;
  }
}

function toText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function toGridRow(bike: BikeSpecGridRow): GridRow {
  const { specs, ...rest } = bike;
  const cells = Object.fromEntries(
    Object.entries(specs).map(([code, value]) => [code, toText(value)])
  );
  const coreCells = {
    variantName: bike.variantName,
    year: String(bike.year),
    msrpPrice: toText(bike.msrpPrice),
  };
  const verifications = Object.fromEntries(
    Object.entries(bike.specVerifications).map(([code, value]) => [code, value.sourceUrl ?? ''])
  );
  return { ...rest, cells, saved: cells, verifications, savedVerifications: { ...verifications }, resetVerifications: false, coreCells, savedCoreCells: coreCells };
}

function normalize(raw: string, def: SpecDefinition | undefined): string {
  const text = raw.trim();
  if (def?.dataType === 'boolean') {
    const lower = text.toLowerCase();
    if (['true', 'yes', 'y', '1'].includes(lower)) {
      return 'true';
    }
    if (['false', 'no', 'n', '0'].includes(lower)) {
      return 'false';
    }
  }
  return text;
}

function toValue(text: string, def: SpecDefinition): unknown {
  if (text === '') {
    return null;
  }
  if (def.dataType === 'number') {
    return Number(text);
  }
  if (def.dataType === 'boolean') {
    return text === 'true';
  }
  return text;
}

function isInvalid(text: string, def: SpecDefinition): boolean {
  if (text === '') {
    return false;
  }
  if (def.dataType === 'number') {
    return Number.isNaN(Number(text));
  }
  if (def.dataType === 'boolean') {
    return text !== 'true' && text !== 'false';
  }
  return false;
}

function typeLabel(def: SpecDefinition): string {
  if (def.dataType === 'number') {
    return 'Number';
  }
  if (def.dataType === 'boolean') {
    return 'Yes / No';
  }
  return 'Text';
}

function isDirty(row: GridRow, code: string): boolean {
  return (row.cells[code] ?? '') !== (row.saved[code] ?? '');
}

function isCoreDirty(row: GridRow, field: CoreField): boolean {
  return row.coreCells[field] !== row.savedCoreCells[field];
}

function isInvalidCoreValue(field: CoreField, value: string): boolean {
  if (field === 'variantName') {
    return value.trim().length < 1 || value.trim().length > 255;
  }
  if (field === 'year') {
    return value.trim() === '' || !/^\d+$/.test(value.trim());
  }
  return value.trim() !== '' && !Number.isFinite(Number(value));
}

function CellEditor({
  row,
  column,
  onRowChange,
  onClose,
  definition,
}: RenderEditCellProps<GridRow> & { definition: SpecDefinition }) {
  const value = row.cells[column.key] ?? '';
  const label = `${definition.label} for ${row.coreCells.variantName} ${row.coreCells.year}`;
  const commit = (next: string, close: boolean) =>
    onRowChange({ ...row, cells: { ...row.cells, [column.key]: next } }, close);

  if (definition.dataType === 'boolean') {
    return (
      <select
        aria-label={label}
        autoFocus
        className="h-full w-full px-2"
        value={value}
        onChange={(e) => commit(e.target.value, true)}
        onKeyDown={(e) => e.key === 'Escape' && onClose(false)}
      >
        <option value="">—</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  return (
    <input
      aria-label={label}
      autoFocus
      className="h-full w-full px-2"
      inputMode={definition.dataType === 'number' ? 'decimal' : 'text'}
      value={value}
      onChange={(e) => commit(e.target.value, false)}
      onBlur={() => onClose(true, false)}
      onFocus={(e) => e.target.select()}
    />
  );
}

function CoreCellEditor({
  row,
  onRowChange,
  onClose,
  field,
}: RenderEditCellProps<GridRow> & { field: CoreField }) {
  const label = `${field === 'variantName' ? 'Motorcycle' : field === 'year' ? 'Year' : 'MSRP'} for ${row.coreCells.variantName} ${row.coreCells.year}`;
  return (
    <input
      aria-label={label}
      autoFocus
      className="h-full w-full px-2"
      inputMode={field === 'year' ? 'numeric' : field === 'msrpPrice' ? 'decimal' : 'text'}
      value={row.coreCells[field]}
      onChange={(event) =>
        onRowChange(
          {
            ...row,
            coreCells: { ...row.coreCells, [field]: event.target.value },
          },
          false
        )
      }
      onBlur={() => onClose(true, false)}
      onFocus={(event) => event.target.select()}
    />
  );
}

type SpecGridModalProps = {
  title?: string;
  bikes: BikeSpecGridRow[];
  specGroups: SpecGroup[];
  onClose: () => void;
};

/** Reusable spreadsheet-style editor for bike specifications, shown in a modal. */
export default function SpecGridModal({
  title = 'Edit specifications',
  bikes,
  specGroups,
  onClose,
}: SpecGridModalProps) {
  const [rows, setRows] = useState<GridRow[]>(() => bikes.map(toGridRow));
  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const definitions = useMemo(
    () =>
      new Map(
        specGroups.flatMap((g) => g.definitions).map((d) => [d.code, d])
      ),
    [specGroups]
  );

  const dirtyCount = useMemo(
    () =>
      rows.reduce(
        (total, row) =>
          total +
          Number(row.resetVerifications) +
          (Object.keys(row.coreCells) as CoreField[]).filter((field) =>
            isCoreDirty(row, field)
          ).length +
          Object.keys({ ...row.cells, ...row.saved }).filter((code) =>
            isDirty(row, code)
          ).length +
          Object.keys({ ...row.verifications, ...row.savedVerifications }).filter((code) =>
            row.verifications[code] !== row.savedVerifications[code]
          ).length,
        0
      ),
    [rows]
  );

  useEffect(() => {
    if (dirtyCount === 0) {
      return;
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirtyCount]);

  const requestClose = useCallback(() => {
    if (dirtyCount > 0 && !window.confirm('Discard unsaved changes?')) {
      return;
    }
    onClose();
  }, [dirtyCount, onClose]);

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? rows.filter((row) =>
          `${row.modelName} ${row.coreCells.variantName} ${row.coreCells.year}`
            .toLowerCase()
            .includes(term)
        )
      : rows;
  }, [rows, search]);

  const resetConfirmations = useCallback((bikeIds: number[], description: string) => {
    if (!window.confirm(
      `Reset spec verifications and Reviewed for ${description}, including hidden specification groups and stored source information? Save changes to apply.`
    )) {
      return;
    }
    const ids = new Set(bikeIds);
    setRows((current) => current.map((row) =>
      ids.has(row.id) ? { ...row, verifications: {}, resetVerifications: true } : row
    ));
    setNotice('Spec verifications and Reviewed reset in the grid. Save changes to apply, or discard to undo.');
    setError(null);
  }, []);

  const columns = useMemo<readonly ColumnOrColumnGroup<GridRow>[]>(() => {
    const fixed: Column<GridRow>[] = [
      {
        key: 'core:variantName',
        name: 'Motorcycle',
        frozen: true,
        resizable: true,
        width: 260,
        editable: !saving,
        cellClass: (row) => {
          if (isInvalidCoreValue('variantName', row.coreCells.variantName)) {
            return 'bg-red-100';
          }
          return isCoreDirty(row, 'variantName') ? 'bg-yellow-100' : '';
        },
        renderCell: ({ row }) => row.coreCells.variantName,
        renderEditCell: (props) => (
          <CoreCellEditor {...props} field="variantName" />
        ),
      },
      {
        key: 'core:year',
        name: 'Year',
        width: 70,
        editable: !saving,
        cellClass: (row) => {
          if (isInvalidCoreValue('year', row.coreCells.year)) {
            return 'bg-red-100';
          }
          return isCoreDirty(row, 'year') ? 'bg-yellow-100' : '';
        },
        renderCell: ({ row }) => row.coreCells.year,
        renderEditCell: (props) => <CoreCellEditor {...props} field="year" />,
      },
      {
        key: 'meta:category',
        name: 'Category',
        width: 120,
        cellClass: 'spec-grid-readonly-cell',
        renderCell: ({ row }) => row.categoryName,
      },
      {
        key: 'core:msrpPrice',
        name: 'MSRP',
        width: 100,
        editable: !saving,
        cellClass: (row) => {
          if (isInvalidCoreValue('msrpPrice', row.coreCells.msrpPrice)) {
            return 'bg-red-100';
          }
          return isCoreDirty(row, 'msrpPrice') ? 'bg-yellow-100' : '';
        },
        renderCell: ({ row }) =>
          row.coreCells.msrpPrice === ''
            ? '—'
            : Number(row.coreCells.msrpPrice).toLocaleString(),
        renderEditCell: (props) => (
          <CoreCellEditor {...props} field="msrpPrice" />
        ),
      },
      {
        key: 'meta:reset',
        name: 'Review',
        width: 150,
        cellClass: 'spec-grid-readonly-cell',
        renderCell: ({ row }) => (
          <span className="flex items-center gap-2">
            <span title="Verified populated specs">
              {Object.keys(row.verifications).length}/{Object.values(row.cells).filter((value) => value.trim()).length}
            </span>
            <button
              type="button"
              className="text-sm font-semibold text-brand-button underline disabled:opacity-50"
              aria-label={`Reset review for ${row.coreCells.variantName} ${row.coreCells.year}`}
              disabled={saving || (row.resetVerifications && Object.keys(row.verifications).length === 0)}
              onClick={(event) => {
                event.stopPropagation();
                resetConfirmations([row.id], `${row.coreCells.variantName} ${row.coreCells.year}`);
              }}
            >
              Reset
            </button>
          </span>
        ),
      },
    ];
    const groups: ColumnOrColumnGroup<GridRow>[] = specGroups
      .filter((group) => !hiddenGroups.has(group.code))
      .map((group) => ({
        name: group.name,
        children: group.definitions.map(
          (def): Column<GridRow> => ({
            key: def.code,
            name: (
              <div
                className="flex h-full flex-col justify-center leading-tight"
                title={`${def.label}: ${typeLabel(def)}${def.unit ? ` in ${def.unit}` : ''}`}
              >
                <span className="truncate">
                  {def.unit ? `${def.label} (${def.unit})` : def.label}
                </span>
                <span className="text-xs font-normal text-brand-grey">
                  {typeLabel(def)}
                </span>
              </div>
            ),
            width: 150,
            resizable: true,
            editable: !saving,
            cellClass: (row) => {
              if (isInvalid(row.cells[def.code] ?? '', def)) {
                return 'bg-red-100';
              }
              return isDirty(row, def.code) ? 'bg-yellow-100' : '';
            },
            renderCell: ({ row }) => {
              const text = row.cells[def.code] ?? '';
              const verified = Object.hasOwn(row.verifications, def.code);
              const display = def.dataType === 'boolean'
                ? text === 'true' ? 'Yes' : text === 'false' ? 'No' : ''
                : text;
              return (
                <span className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    aria-label={`Verified ${def.label} for ${row.coreCells.variantName} ${row.coreCells.year}`}
                    title="Verified from official brand source"
                    checked={verified}
                    disabled={!text.trim() || saving}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setRows((current) => current.map((item) => {
                        if (item.id !== row.id) {
                          return item;
                        }
                        const verifications = { ...item.verifications };
                        if (checked) {
                          const identityChanged = isCoreDirty(item, 'variantName') || isCoreDirty(item, 'year');
                          verifications[def.code] = !item.resetVerifications && !identityChanged && !isDirty(item, def.code)
                            ? item.savedVerifications[def.code] ?? ''
                            : '';
                        } else {
                          delete verifications[def.code];
                        }
                        return { ...item, verifications };
                      }));
                      setNotice(null);
                    }}
                  />
                  <span className="truncate">{display}</span>
                </span>
              );
            },
            renderEditCell: (props) => (
              <CellEditor {...props} definition={def} />
            ),
          })
        ),
      }))
      .filter((group) => group.children.length > 0);
    return [...fixed, ...groups];
  }, [specGroups, hiddenGroups, saving, resetConfirmations]);

  const onRowsChange = useCallback((changed: GridRow[]) => {
    if (saving) {
      return;
    }
    const byId = new Map(changed.map((row) => [row.id, row]));
    setRows((current) => current.map((row) => {
      const next = byId.get(row.id);
      if (!next) {
        return row;
      }
      const verifications = { ...next.verifications };
      if (row.coreCells.variantName !== next.coreCells.variantName || row.coreCells.year !== next.coreCells.year) {
        return { ...next, verifications: {} };
      }
      for (const code of Object.keys({ ...row.cells, ...next.cells })) {
        if ((row.cells[code] ?? '') !== (next.cells[code] ?? '')) {
          delete verifications[code];
        }
      }
      return { ...next, verifications };
    }));
    setNotice(null);
    setError(null);
  }, [saving]);

  function onCellCopy(
    { row, column }: CellCopyArgs<GridRow>,
    event: React.ClipboardEvent<HTMLDivElement>
  ) {
    const coreField = coreFieldForColumn(column.key);
    if (coreField) {
      event.clipboardData.setData(
        'text/plain',
        row.coreCells[coreField]
      );
      event.preventDefault();
      return;
    }
    if (!definitions.has(column.key)) {
      return;
    }
    event.clipboardData.setData('text/plain', row.cells[column.key] ?? '');
    event.preventDefault();
  }

  function onCellPaste(
    { row, column }: CellPasteArgs<GridRow>,
    event: React.ClipboardEvent<HTMLDivElement>
  ): GridRow {
    const coreField = coreFieldForColumn(column.key);
    if (coreField) {
      const text =
        event.clipboardData.getData('text/plain').split(/\r?\n/)[0] ?? '';
      return {
        ...row,
        coreCells: { ...row.coreCells, [coreField]: text },
      };
    }
    const def = definitions.get(column.key);
    if (!def) {
      return row;
    }
    const text = normalize(
      event.clipboardData.getData('text/plain').split(/\r?\n/)[0] ?? '',
      def
    );
    return { ...row, cells: { ...row.cells, [column.key]: text } };
  }

  function onFill({ columnKey, sourceRow, targetRow }: FillEvent<GridRow>) {
    const coreField = coreFieldForColumn(columnKey);
    if (coreField) {
      return {
        ...targetRow,
        coreCells: {
          ...targetRow.coreCells,
          [coreField]: sourceRow.coreCells[coreField],
        },
      };
    }
    if (!definitions.has(columnKey)) {
      return targetRow;
    }
    return {
      ...targetRow,
      cells: {
        ...targetRow.cells,
        [columnKey]: sourceRow.cells[columnKey] ?? '',
      },
    };
  }

  function discard() {
    setRows((current) =>
      current.map((row) => ({
        ...row,
        cells: { ...row.saved },
        coreCells: { ...row.savedCoreCells },
        verifications: { ...row.savedVerifications },
        resetVerifications: false,
      }))
    );
    setNotice(null);
    setError(null);
  }

  async function save() {
    const changes: { bikeId: number; specCode: string; value: unknown }[] = [];
    const bikeChanges: {
      bikeId: number;
      variantName: string;
      year: number;
      msrpPrice: number | null;
    }[] = [];
    const verificationChanges: { bikeId: number; specCode: string; isVerified: boolean; sourceUrl: string | null }[] = [];
    const resetVerificationBikeIds: number[] = [];
    let coreChangeCount = 0;
    for (const row of rows) {
      if (row.resetVerifications) {
        resetVerificationBikeIds.push(row.id);
      }
      const dirtyCoreFields = (Object.keys(row.coreCells) as CoreField[]).filter(
        (field) => isCoreDirty(row, field)
      );
      for (const field of dirtyCoreFields) {
        if (isInvalidCoreValue(field, row.coreCells[field])) {
          const label =
            field === 'variantName'
              ? 'Motorcycle'
              : field === 'year'
                ? 'Year'
                : 'MSRP';
          setError(
            `${label} "${row.coreCells[field]}" is not valid for ${row.coreCells.variantName} ${row.coreCells.year}.`
          );
          return;
        }
      }
      if (dirtyCoreFields.length > 0) {
        bikeChanges.push({
          bikeId: row.id,
          variantName: row.coreCells.variantName.trim(),
          year: Number(row.coreCells.year),
          msrpPrice:
            row.coreCells.msrpPrice.trim() === ''
              ? null
              : Number(row.coreCells.msrpPrice),
        });
        coreChangeCount += dirtyCoreFields.length;
      }

      for (const code of Object.keys({ ...row.cells, ...row.saved })) {
        if (!isDirty(row, code)) {
          continue;
        }
        const def = definitions.get(code);
        if (!def) {
          continue;
        }
        const text = row.cells[code] ?? '';
        if (isInvalid(text, def)) {
          setError(
            `"${text}" is not valid for ${def.label} on ${row.coreCells.variantName} ${row.coreCells.year}.`
          );
          return;
        }
        changes.push({
          bikeId: row.id,
          specCode: code,
          value: toValue(text, def),
        });
      }
      for (const code of Object.keys({ ...row.verifications, ...row.savedVerifications })) {
        const verified = Object.hasOwn(row.verifications, code);
        const identityChanged = isCoreDirty(row, 'variantName') || isCoreDirty(row, 'year');
        if ((row.resetVerifications && verified) || (!row.resetVerifications && (row.verifications[code] !== row.savedVerifications[code] || (verified && (identityChanged || isDirty(row, code)))))) {
          verificationChanges.push({ bikeId: row.id, specCode: code, isVerified: verified, sourceUrl: row.verifications[code] || null });
        }
      }
    }
    const changeCount = changes.length + coreChangeCount + verificationChanges.length + resetVerificationBikeIds.length;
    if (changeCount === 0) {
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const { updatedCount } = await updateAdminBikeSpecGrid({
        changes,
        bikeChanges,
        verificationChanges,
        resetVerificationBikeIds,
      });
      setRows((current) =>
        current.map((row) => {
          const coreCells = {
            variantName: row.coreCells.variantName.trim(),
            year: String(Number(row.coreCells.year)),
            msrpPrice:
              row.coreCells.msrpPrice.trim() === ''
                ? ''
                : String(Number(row.coreCells.msrpPrice)),
          };
          return {
            ...row,
            variantName: coreCells.variantName,
            year: Number(coreCells.year),
            msrpPrice:
              coreCells.msrpPrice === '' ? null : Number(coreCells.msrpPrice),
            cells: { ...row.cells },
            saved: { ...row.cells },
            savedVerifications: { ...row.verifications },
            resetVerifications: false,
            coreCells,
            savedCoreCells: coreCells,
          };
        })
      );
      setNotice(
        `Saved ${changeCount} change${changeCount === 1 ? '' : 's'} across ${updatedCount} motorcycle${updatedCount === 1 ? '' : 's'}.`
      );
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause.message
          : 'Unable to save changes.'
      );
    } finally {
      setSaving(false);
    }
  }

  function toggleGroup(code: string) {
    setHiddenGroups((current) => {
      const next = new Set(current);
      if (!next.delete(code)) {
        next.add(code);
      }
      return next;
    });
  }

  return (
    <Modal title={title} error={error} fullWidth onClose={requestClose}>
      <p className="mt-4 text-sm text-brand-grey">
        Motorcycle, year, MSRP, and specifications are editable; category is
        read-only. Double-click or press Enter to edit, paste with Ctrl+V, and
        drag the fill handle to copy a value down. Changes are saved together.
        Check a specification to verify it against the official brand source.
        Changing a value or bike identity clears its verification until it is
        checked again. Reviewed is set automatically when all populated specs are verified.
      </p>
      {notice && (
        <p
          className="mt-4 border-l-4 border-green-700 bg-green-50 p-3 text-sm text-green-800"
          role="status"
        >
          {notice}
        </p>
      )}
      <fieldset className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <legend className="mb-1 font-semibold">Specification groups</legend>
        {specGroups.map((group) => (
          <label className="flex items-center gap-1" key={group.code}>
            <input
              checked={!hiddenGroups.has(group.code)}
              type="checkbox"
              onChange={() => toggleGroup(group.code)}
            />
            {group.name}
          </label>
        ))}
      </fieldset>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          aria-label="Search motorcycles"
          className="w-full border border-black/20 px-3 py-2 text-sm sm:w-64"
          placeholder="Search motorcycles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-sm text-brand-grey">
          {visibleRows.length} of {rows.length} motorcycles
        </span>
        <button
          type="button"
          className="border border-black/30 px-3 py-2 text-sm font-semibold disabled:opacity-50"
          disabled={saving || visibleRows.length === 0}
          onClick={() => resetConfirmations(
            visibleRows.map((row) => row.id),
            `${visibleRows.length} displayed motorcycle${visibleRows.length === 1 ? '' : 's'}`
          )}
        >
          Reset displayed reviews
        </button>
      </div>
      <DataGrid
        aria-label="Motorcycle specifications"
        className="rdg-light spec-grid mt-4 h-[55vh] w-full min-w-0 text-sm"
        columns={columns}
        headerRowHeight={48}
        rowKeyGetter={(row) => row.id}
        rows={visibleRows}
        onCellCopy={onCellCopy}
        onCellPaste={onCellPaste}
        onFill={onFill}
        onRowsChange={onRowsChange}
      />
      <ModalFooter>
        <button
          className="flex-1 bg-brand-gold px-5 py-3 font-bold text-brand-black disabled:opacity-50"
          disabled={saving || dirtyCount === 0}
          onClick={() => void save()}
        >
          {saving
            ? 'Saving...'
            : `Save ${dirtyCount} change${dirtyCount === 1 ? '' : 's'}`}
        </button>
        {dirtyCount > 0 && (
          <button
            className="border border-black/30 px-4 py-3 font-semibold"
            disabled={saving}
            onClick={discard}
          >
            Discard
          </button>
        )}
        <button
          className="border border-black/30 px-4 py-3 font-semibold"
          onClick={requestClose}
        >
          Close
        </button>
      </ModalFooter>
    </Modal>
  );
}
