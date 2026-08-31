import type { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
}

/** Gold/orange page background wrapping a white central content area. */
export default function PageShell({ children }: PageShellProps) {
  return (
    <div className="flex-1 bg-brand-page">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-md bg-brand-content p-4 sm:p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
