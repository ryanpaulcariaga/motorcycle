import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function AdminToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      {children}
    </div>
  );
}

export function AdminToolbarButton({
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full border border-black/30 px-4 py-2 text-center text-sm font-semibold disabled:opacity-50 sm:w-auto ${className}`}
      type={type}
    />
  );
}
