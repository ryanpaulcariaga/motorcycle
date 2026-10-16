import { createContext, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { SortRule } from '@/lib/multiSort';

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
          className="text-xs font-semibold uppercase tracking-wide text-brand-gold"
          onClick={() => setOpen(!open)}
          type="button"
        >
          {open ? '\u25BE' : '\u25B8'} {title}
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
  'px-2 py-1 text-sm hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent';

export function SortGroup<K extends string>({
  fields,
  rules,
  onChange,
}: {
  fields: { key: K; label: string }[];
  rules: SortRule<K>[];
  onChange: (rules: SortRule<K>[]) => void;
}) {
  const labelOf = (key: K) =>
    fields.find((field) => field.key === key)?.label ?? key;
  const unused = fields.filter(
    (field) => !rules.some((rule) => rule.field === field.key)
  );

  function move(index: number, offset: number) {
    const next = [...rules];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  }

  return (
    <SidebarGroup title="Sort">
      {rules.length === 0 && (
        <p className="text-sm text-white/70">Default order</p>
      )}
      <ol className="space-y-2">
        {rules.map((rule, index) => (
          <li className="bg-white/10 p-2 text-sm" key={rule.field}>
            <span
              className="block font-semibold"
              title={`${labelOf(rule.field)} (${rule.direction === 'asc' ? 'ascending' : 'descending'})`}
            >
              {labelOf(rule.field)}
            </span>
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
              aria-label={`Move ${labelOf(rule.field)} up`}
              className={iconButton}
              disabled={index === 0}
              onClick={() => move(index, -1)}
              title="Move up"
              type="button"
            >
              {'\u2191'}
            </button>
            <button
              aria-label={`Move ${labelOf(rule.field)} down`}
              className={iconButton}
              disabled={index === rules.length - 1}
              onClick={() => move(index, 1)}
              title="Move down"
              type="button"
            >
              {'\u2193'}
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
          </li>
        ))}
      </ol>
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
