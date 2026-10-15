import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  /** Skip the white card so a page can lay out its own sidebar and content cards. */
  bare?: boolean;
}

/** Gold/orange page background wrapping a white central content area. */
export default function PageShell({ children, bare = false }: PageShellProps) {
  return (
    <div className="flex-1 bg-brand-page">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        {bare ? (
          children
        ) : (
          <div className="rounded-md bg-brand-content p-4 sm:p-6 shadow-sm">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
