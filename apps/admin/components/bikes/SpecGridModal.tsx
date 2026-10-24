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
};

function toText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function toGridRow(bike: BikeSpecGridRow): GridRow {
  const { specs, ...rest } = bike;
  const cells = Object.fromEntries(
    Object.entries(specs).map(([code, value]) => [code, toText(value)])
  );
  return { ...rest, cells, saved: cells };
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

function CellEditor({
  row,
  column,
  onRowChange,
  onClose,
  definition,
}: RenderEditCellProps<GridRow> & { definition: SpecDefinition }) {
  const value = row.cells[column.key] ?? '';
  const label = `${definition.label} for ${row.brandName} ${row.variantName} ${row.year}`;
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
          Object.keys({ ...row.cells, ...row.saved }).filter((code) =>
            isDirty(row, code)
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
          `${row.brandName} ${row.modelName} ${row.variantName} ${row.year}`
            .toLowerCase()
            .includes(term)
        )
      : rows;
  }, [rows, search]);

  const columns = useMemo<readonly ColumnOrColumnGroup<GridRow>[]>(() => {
    const fixed: Column<GridRow>[] = [
      {
        key: 'bike',
        name: 'Motorcycle',
        frozen: true,
        resizable: true,
        width: 260,
        cellClass: 'spec-grid-readonly-cell',
        renderCell: ({ row }) => row.variantName,
      },
      {
        key: 'year',
        name: 'Year',
        width: 70,
        cellClass: 'spec-grid-readonly-cell',
        renderCell: ({ row }) => row.year,
      },
      {
        key: 'category',
        name: 'Category',
        width: 120,
        cellClass: 'spec-grid-readonly-cell',
        renderCell: ({ row }) => row.categoryName,
      },
      {
        key: 'msrp',
        name: 'MSRP',
        width: 100,
        cellClass: 'spec-grid-readonly-cell',
        renderCell: ({ row }) => row.msrpPrice?.toLocaleString() ?? '—',
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
            editable: true,
            cellClass: (row) => {
              if (isInvalid(row.cells[def.code] ?? '', def)) {
                return 'bg-red-100';
              }
              return isDirty(row, def.code) ? 'bg-yellow-100' : '';
            },
            renderCell: ({ row }) => {
              const text = row.cells[def.code] ?? '';
              if (def.dataType === 'boolean') {
                return text === 'true' ? 'Yes' : text === 'false' ? 'No' : '';
              }
              return text;
            },
            renderEditCell: (props) => (
              <CellEditor {...props} definition={def} />
            ),
          })
        ),
      }))
      .filter((group) => group.children.length > 0);
    return [...fixed, ...groups];
  }, [specGroups, hiddenGroups]);

  const onRowsChange = useCallback((changed: GridRow[]) => {
    const byId = new Map(changed.map((row) => [row.id, row]));
    setRows((current) => current.map((row) => byId.get(row.id) ?? row));
    setNotice(null);
    setError(null);
  }, []);

  function onCellCopy(
    { row, column }: CellCopyArgs<GridRow>,
    event: React.ClipboardEvent<HTMLDivElement>
  ) {
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
      current.map((row) => ({ ...row, cells: { ...row.saved } }))
    );
    setNotice(null);
    setError(null);
  }

  async function save() {
    const changes: { bikeId: number; specCode: string; value: unknown }[] = [];
    for (const row of rows) {
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
            `"${text}" is not valid for ${def.label} on ${row.brandName} ${row.variantName} ${row.year}.`
          );
          return;
        }
        changes.push({
          bikeId: row.id,
          specCode: code,
          value: toValue(text, def),
        });
      }
    }
    if (changes.length === 0) {
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const { updatedCount } = await updateAdminBikeSpecGrid({ changes });
      setRows((current) =>
        current.map((row) => ({ ...row, saved: { ...row.cells } }))
      );
      setNotice(
        `Saved ${changes.length} change${changes.length === 1 ? '' : 's'} across ${updatedCount} motorcycle${updatedCount === 1 ? '' : 's'}.`
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
        Double-click or press Enter to edit, paste with Ctrl+V, and drag the
        fill handle to copy a value down. Changes are saved together.
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
          className="w-64 border border-black/20 px-3 py-2 text-sm"
          placeholder="Search motorcycles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-sm text-brand-grey">
          {visibleRows.length} of {rows.length} motorcycles
        </span>
      </div>
      <DataGrid
        aria-label="Motorcycle specifications"
        className="rdg-light spec-grid mt-4 h-[55vh] text-sm"
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
