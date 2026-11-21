import { createContext, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { SortRule } from '@/lib/multiSort';
import { moveItem, SortableItem, SortableList } from '@motorcycle/reorder';

export const GridSidebarSlot = createContext<HTMLElement | null>(null);

// Renders sidebar groups into the admin shell sidebar.
export function GridSidebar({ children }: { children: ReactNode }) {
  const slot = useContext(GridSidebarSlot);
  return slot ? createPortal(children, slot) : null;
}

export function SidebarGroup({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(
    () => window.matchMedia('(min-width: 768px)').matches
  );
  return (
    <section className="bg-brand-sidebar p-4 text-white">
      <div className="flex items-center justify-between gap-2">
        <button
          aria-expanded={open}
          className="flex flex-1 items-center justify-between gap-2 text-left text-sm font-semibold uppercase tracking-wide text-brand-gold"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {title}
          <span aria-hidden="true" className="text-lg leading-none">{open ? '−' : '+'}</span>
        </button>
        {action}
      </div>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </section>
  );
}

export function SidebarSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <select
        className="mt-1 block w-full px-2 py-2 text-sm font-normal text-brand-black"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

export function ClearFiltersButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="text-xs font-semibold underline disabled:opacity-40 disabled:no-underline"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      Clear
    </button>
  );
}

const iconButton =
  'px-1 py-1 text-sm hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent';

export function SortGroup<K extends string>({
  fields,
  rules,
  onChange,
  inline = false,
}: {
  fields: { key: K; label: string }[];
  rules: SortRule<K>[];
  onChange: (rules: SortRule<K>[]) => void;
  inline?: boolean;
}) {
  const labelOf = (key: K) =>
    fields.find((field) => field.key === key)?.label ?? key;
  const unused = fields.filter(
    (field) => !rules.some((rule) => rule.field === field.key)
  );

  function move(from: number, to: number) {
    onChange(moveItem(rules, from, to));
  }

  if (inline) {
    const summary = rules.slice(0, 2).map((rule) =>
      `${labelOf(rule.field)} ${rule.direction === 'asc' ? 'ascending' : 'descending'}`
    ).join(', then ');
    return (
      <details className="mb-4 border border-zinc-200 bg-zinc-50 p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-brand-button hover:underline">
          Sort: {summary || 'Default order'}{rules.length > 2 ? `, then ${rules.length - 2} more` : ''}
        </summary>
        <div className="mt-3">
          <SortableList ids={rules.map((rule) => rule.field)} onMove={move}>
            <div className="flex flex-col gap-2">
              {rules.map((rule, index) => (
                <SortableItem
                  as="div"
                  id={rule.field}
                  label={`${labelOf(rule.field)} sort`}
                  key={rule.field}
                  className="flex flex-wrap items-center gap-2"
                >
                  {(handle) => <>
                    {handle}
                    <label className="sr-only" htmlFor={`inline-sort-${index}`}>
                      Sort field {index + 1}
                    </label>
                    <select
                      className="min-w-0 border border-zinc-300 bg-white px-2 py-2"
                      id={`inline-sort-${index}`}
                      value={rule.field}
                      onChange={(event) =>
                        onChange(rules.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, field: event.target.value as K } : item
                        ))
                      }
                    >
                      {fields.map((field) => (
                        <option
                          key={field.key}
                          value={field.key}
                          disabled={rule.field !== field.key && rules.some((item) => item.field === field.key)}
                        >
                          {field.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      aria-label={`${labelOf(rule.field)} ${rule.direction === 'asc' ? 'ascending' : 'descending'}, click to reverse`}
                      title={rule.direction === 'asc' ? 'Ascending' : 'Descending'}
                      className="border border-zinc-300 bg-white px-2 py-2 font-semibold hover:bg-zinc-100"
                      onClick={() =>
                        onChange(rules.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, direction: item.direction === 'asc' ? 'desc' : 'asc' }
                            : item
                        ))
                      }
                    >
                      {rule.direction === 'asc' ? 'A→Z' : 'Z→A'}
                    </button>
                    <button
                      type="button"
                      className="px-1 font-semibold text-brand-button hover:underline"
                      onClick={() => onChange(rules.filter((_, itemIndex) => itemIndex !== index))}
                      aria-label={`Remove sort ${index + 1}`}
                    >
                      Remove
                    </button>
                  </>}
                </SortableItem>
              ))}
            </div>
          </SortableList>
          {unused.length > 0 && (
            <button
              type="button"
              className="mt-3 font-semibold text-brand-button hover:underline"
              onClick={() =>
                onChange([...rules, { field: unused[0].key, direction: 'asc' }])
              }
            >
              + Add sort level
            </button>
          )}
        </div>
      </details>
    );
  }

  return (
    <SidebarGroup title="Sort">
      {rules.length === 0 && (
        <p className="text-sm text-white/70">Default order</p>
      )}
      <SortableList ids={rules.map((rule) => rule.field)} onMove={move}>
      <ol className="space-y-2">
        {rules.map((rule, index) => (
          <SortableItem as="li" id={rule.field} label={`${labelOf(rule.field)} sort`} className="bg-white/10 p-2 text-sm" key={rule.field}>
            {(handle) => <>
            <div className="flex items-center gap-1">
            {handle}
            <span
              className="block font-semibold"
              title={`${labelOf(rule.field)} (${rule.direction === 'asc' ? 'ascending' : 'descending'})`}
            >
              {labelOf(rule.field)}
            </span>
            </div>
            <div className="mt-1 flex items-center justify-end gap-1">            <button
              aria-label={`${labelOf(rule.field)} ${rule.direction === 'asc' ? 'ascending' : 'descending'}, click to reverse`}
              className={iconButton}
              onClick={() =>
                onChange(
                  rules.map((item, itemIndex) =>
                    itemIndex === index
                      ? {
                          ...item,
                          direction: item.direction === 'asc' ? 'desc' : 'asc',
                        }
                      : item
                  )
                )
              }
              title={rule.direction === 'asc' ? 'Ascending' : 'Descending'}
              type="button"
            >
              {rule.direction === 'asc' ? 'A\u2192Z' : 'Z\u2192A'}
            </button>
            <button
              aria-label={`Remove ${labelOf(rule.field)} sort`}
              className={iconButton}
              onClick={() =>
                onChange(rules.filter((item) => item.field !== rule.field))
              }
              title="Remove"
              type="button"
            >
              {'\u2715'}
            </button>
            </div>
            </>}
          </SortableItem>
        ))}
      </ol>
      </SortableList>
      {unused.length > 0 && (
        <SidebarSelect
          label="Add sort"
          value=""
          onChange={(key) =>
            key && onChange([...rules, { field: key as K, direction: 'asc' }])
          }
        >
          <option value="">Choose field...</option>
          {unused.map((field) => (
            <option key={field.key} value={field.key}>
              {field.label}
            </option>
          ))}
        </SidebarSelect>
      )}
    </SidebarGroup>
  );
}
