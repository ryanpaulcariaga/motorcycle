'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface SidebarProps {
  children: ReactNode;
}

/** Secondary nav / filter panel: a left column from md up, stacked above the content below it. */
export default function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="w-full shrink-0 text-white md:w-56">
      <div className="space-y-4">{children}</div>
    </aside>
  );
}

export function SidebarLink({
  href,
  children,
  active = false,
}: {
  href: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`-mx-4 block px-4 py-1.5 text-sm font-normal text-white/80 hover:bg-white/10 ${
        active ? 'bg-white/10' : ''
      }`}
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
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-gold">
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}
