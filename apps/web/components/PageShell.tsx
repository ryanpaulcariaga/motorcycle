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
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        {bare ? (
          children
        ) : (
          <div className="bg-brand-content p-6 shadow-lg">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
