import type { ReactNode } from 'react';

export type IconName =
  | 'edit'
  | 'delete'
  | 'clone'
  | 'variants'
  | 'publish'
  | 'unpublish'
  | 'activate'
  | 'deactivate'
  | 'up'
  | 'down'
  | 'images'
  | 'primary'
  | 'add'
  | 'refresh'
  | 'list';

const paths: Record<IconName, ReactNode> = {
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  clone: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  delete: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  variants: (
    <>
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="m2 12 10 5 10-5" />
      <path d="m2 17 10 5 10-5" />
    </>
  ),
  publish: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  unpublish: (
    <>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="m1 1 22 22" />
    </>
  ),
  activate: (
    <>
      <path d="M12 2v10" />
      <path d="M18.4 6.6a9 9 0 1 1-12.8 0" />
    </>
  ),
  deactivate: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </>
  ),
  images: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  primary: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
  add: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M20 7v5h-5" />
      <path d="M4.9 19a9 9 0 0 0 14.2-2M4 17v-5h5" />
      <path d="M19.1 5A9 9 0 0 0 4.9 7" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </>
  ),
  up: <path d="m18 15-6-6-6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
};

type Variant = 'default' | 'danger' | 'gold' | 'primary' | 'success';

type Props = {
  icon: IconName;
  label: string;
  variant?: Variant;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: number;
};

export function IconButton({
  icon,
  label,
  variant = 'default',
  href,
  onClick,
  disabled,
  badge,
}: Props) {
  const className = `inline-flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-brand-gold hover:text-brand-black disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current ${
    variant === 'danger'
      ? 'text-red-700'
      : variant === 'primary'
        ? 'bg-brand-gold text-brand-black hover:brightness-95'
      : variant === 'success'
        ? 'text-green-700'
      : variant === 'gold'
        ? 'text-brand-gold'
        : 'text-brand-button'
  }`;
  const svg = (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {paths[icon]}
    </svg>
  );

  return (
    <span className="group relative inline-block align-middle">
      {href ? (
        <a aria-label={label} className={className} href={href}>
          {svg}
        </a>
      ) : (
        <button
          aria-label={label}
          className={className}
          disabled={disabled}
          onClick={onClick}
          type="button"
        >
          {svg}
        </button>
      )}
      {badge ? (
        <span className="pointer-events-none absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-green-700 px-1 text-center text-[10px] font-semibold leading-4 text-white">
          {badge}
        </span>
      ) : null}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs font-normal text-white opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        role="tooltip"
      >
        {label}
      </span>
    </span>
  );
}
