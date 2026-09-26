'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';

interface SidebarProps {
  children: ReactNode;
}

/** Secondary nav / filter panel. Dark brown on desktop, collapsible drawer below md. */
export default function Sidebar({ children }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="md:hidden mb-3 rounded-md bg-brand-sidebar px-3 py-2 text-sm font-medium text-white"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? 'Hide filters' : 'Show filters'}
      </button>

      <aside
        className={`${isOpen ? 'block' : 'hidden'} md:block w-full md:w-64 shrink-0 -mx-4 sm:-mx-6 md:mx-0 md:-ml-6 overflow-hidden rounded-r-md bg-brand-sidebar text-white`}
      >
        <div className="divide-y divide-white/10">{children}</div>
      </aside>
    </>
  );
}

export function SidebarLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded px-2 py-1.5 text-sm hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

/** Section with a flush header bar so adjoining sections stay visually distinct on the same background. */
export function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="bg-black/25 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80">
        {title}
      </h2>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}
