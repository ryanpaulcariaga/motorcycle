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
        className="md:hidden mb-3 bg-brand-sidebar px-3 py-2 text-sm font-semibold text-white"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? 'Hide filters' : 'Show filters'}
      </button>

      <aside
        className={`${isOpen ? 'block' : 'hidden'} md:block w-full md:w-56 shrink-0 text-white`}
      >
        <div className="space-y-4">{children}</div>
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
      className="mt-2 block px-3 py-2 font-semibold first:mt-0 hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

/** Separate brown card per section, spaced like the admin sidebar groups. */
export function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-brand-sidebar p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-gold">
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}
