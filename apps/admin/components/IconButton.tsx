import type { ReactNode } from 'react';

export type IconName =
  | 'edit'
  | 'delete'
  | 'variants'
  | 'publish'
  | 'unpublish'
  | 'activate'
  | 'deactivate'
  | 'up'
  | 'down';

const paths: Record<IconName, ReactNode> = {
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
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
  up: <path d="m18 15-6-6-6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
};

type Variant = 'default' | 'danger';

type Props = {
  icon: IconName;
  label: string;
  variant?: Variant;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

export function IconButton({
  icon,
  label,
  variant = 'default',
  href,
  onClick,
  disabled,
}: Props) {
  const className = `inline-flex h-8 w-8 items-center justify-center rounded hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30 ${
    variant === 'danger' ? 'text-red-700' : 'text-brand-button'
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
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs font-normal text-white opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        role="tooltip"
      >
        {label}
      </span>
    </span>
  );
}
