'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useId, useState, type ReactNode } from 'react';

interface SidebarProps {
  children: ReactNode;
}

/** Secondary nav / filter panel: a left column from md up, stacked above the content below it. */
export default function Sidebar({ children }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const route = `${pathname}?${searchParams.toString()}`;
  useEffect(() => {
    if (!window.matchMedia('(max-width: 767px)').matches || window.location.hash) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      document.getElementById('catalog-content')?.scrollIntoView();
    });
    return () => cancelAnimationFrame(frame);
  }, [route]);

  return (
    <aside className="w-full shrink-0 text-white md:w-56">
      <div key={route} className="space-y-4">
        {children}
      </div>
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
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <section className="bg-brand-sidebar p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-2 text-left md:hidden"
        >
          {title}
          <span aria-hidden="true" className="text-lg leading-none">{open ? '−' : '+'}</span>
        </button>
        <span className="hidden md:block">{title}</span>
      </h2>
      <div id={contentId} className={`${open ? 'block' : 'hidden'} mt-3 md:block`}>
        {children}
      </div>
    </section>
  );
}
