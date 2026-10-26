import { useEffect, useRef, useState } from 'react';
import { GridSidebarSlot } from '@/components/GridSidebar';
import BikeModelManagement from '@/components/bike-models/BikeModelManagement';
import CategoryManagement from '@/components/categories/CategoryManagement';
import BrandManagement from '@/components/brands/BrandManagement';
import BikeManagement from '@/components/bikes/BikeManagement';
import BulkSpecEditor from '@/components/bikes/BulkSpecEditor';
import RoleManagement from '@/components/roles/RoleManagement';
import AuditLogManagement from '@/components/audit/AuditLogManagement';
import SpecGroupManagement from '@/components/specs/SpecGroupManagement';
import {
  API_BASE_URL,
  AdminApiError,
  getAdminSession,
  signOutAdmin,
} from '@/lib/api';
import type { AdminSession } from '@/lib/types';

function SignIn({ error }: { error: string | null }) {
  return (
    <main className="min-h-screen bg-brand-page p-6 text-brand-black">
      <section className="mx-auto max-w-5xl bg-brand-content p-8 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-button">
          MotoCompare Admin
        </p>
        <h1 className="mt-2 text-2xl font-bold">Catalog administration</h1>
        <p className="mt-4 max-w-xl text-brand-grey">
          Sign in with an authorized Facebook administrator account to continue.
        </p>
        {error && (
          <p
            className="mt-4 border-l-4 border-red-700 bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        )}
        <a
          className="mt-6 inline-flex bg-brand-button px-5 py-3 font-semibold text-white hover:bg-brand-button-active"
          href={`${API_BASE_URL}/api/admin/auth/facebook`}
        >
          Sign in with Facebook
        </a>
      </section>
    </main>
  );
}

function AdminShell({ session }: { session: AdminSession }) {
  const pathname = window.location.pathname;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const swipeStartX = useRef(0);
  const [sidebarSlot, setSidebarSlot] = useState<HTMLElement | null>(null);

  // Widening past the mobile/tablet range returns the menu to its default state.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const reset = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMenuOpen(false);
      }
    };
    query.addEventListener('change', reset);
    return () => query.removeEventListener('change', reset);
  }, []);
  const match = pathname.match(/^\/admin\/bike-models\/(\d+)\/bikes$/);
  const isAdministratorsActive =
    pathname === '/admin' || pathname === '/admin/roles' || pathname === '/admin/audit';
  const isAuditActive = pathname === '/admin/audit';
  const isBikesActive = pathname === '/admin/bike-models' || match !== null;
  const isVariantsActive =
    pathname === '/admin/bike-variants' || pathname === '/admin/bulk-spec';
  const isSpecificationsActive = pathname === '/admin/specs';
  const isBrandsActive = pathname === '/admin/brands';
  const isCategoriesActive = pathname === '/admin/categories';
  const content = match ? (
    <BikeManagement modelId={Number(match[1])} />
  ) : pathname === '/admin/bulk-spec' ? (
    <BulkSpecEditor />
  ) : pathname === '/admin/brands' ? (
    <BrandManagement />
  ) : pathname === '/admin/categories' ? (
    <CategoryManagement />
  ) : pathname === '/admin/bike-variants' ? (
    <BikeManagement />
  ) : pathname === '/admin/bike-models' ? (
    <BikeModelManagement />
  ) : pathname === '/admin/specs' ? (
    <SpecGroupManagement />
  ) : isAuditActive ? (
    <AuditLogManagement />
  ) : (
    <RoleManagement />
  );

  async function signOut() {
    await signOutAdmin();
    window.location.assign('/');
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-brand-page">
      <header className="relative bg-brand-header text-white">
        <div className="flex min-h-16 w-full items-center gap-4 px-4 py-3 md:px-6 md:py-4">
          <a className="mr-auto min-w-0 truncate font-bold tracking-wide" href="/admin">
            MotoCompare Admin
          </a>
          <div className="hidden shrink-0 items-center gap-4 text-sm md:flex">
            <span className="max-w-40 truncate">
              {session.displayName ?? session.facebookUserId}
            </span>
            <button className="underline" type="button" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
          <button
            aria-controls="admin-account-menu"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="shrink-0 md:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            type="button"
          >
            <span className="mb-1 block h-0.5 w-6 bg-white" />
            <span className="mb-1 block h-0.5 w-6 bg-white" />
            <span className="block h-0.5 w-6 bg-white" />
          </button>
        </div>
        {isMenuOpen && (
          <div
            className="flex flex-col items-end gap-3 border-t border-white/10 px-4 py-3 text-right text-sm sm:px-6 md:hidden"
            id="admin-account-menu"
            onTouchEnd={(event) => {
              const deltaX = event.changedTouches[0].clientX - swipeStartX.current;
              if (Math.abs(deltaX) > 50) {
                setIsMenuOpen(false);
              }
            }}
            onTouchStart={(event) => {
              swipeStartX.current = event.touches[0].clientX;
            }}
          >
            <span className="max-w-full truncate">
              {session.displayName ?? session.facebookUserId}
            </span>
            <button className="underline" type="button" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        )}
      </header>
      <div className="mx-auto grid min-w-0 max-w-7xl gap-4 p-3 sm:p-4 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-6 md:p-8">
        <aside
          className="min-w-0 space-y-4 self-start md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto"
          id="admin-navigation"
        >
          <nav className="bg-brand-sidebar p-4 text-white/80">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-gold">
              Catalog
            </p>
            <a
              aria-current={isVariantsActive ? 'page' : undefined}
              className={`-mx-4 block px-4 py-1.5 text-sm font-normal text-white/80 ${isVariantsActive ? 'bg-white/15' : 'hover:bg-white/10'}`}
              href="/admin/bike-variants"
            >
              Bikes
            </a>
            <a
              aria-current={isBikesActive ? 'page' : undefined}
              className={`-mx-4 block px-4 py-1.5 text-sm font-normal text-white/80 ${isBikesActive ? 'bg-white/15' : 'hover:bg-white/10'}`}
              href="/admin/bike-models"
            >
              Bikes Model
            </a>
            <a
              aria-current={isSpecificationsActive ? 'page' : undefined}
              className={`-mx-4 block px-4 py-1.5 text-sm font-normal text-white/80 ${isSpecificationsActive ? 'bg-white/15' : 'hover:bg-white/10'}`}
              href="/admin/specs"
            >
              Specifications
            </a>
            <a
              aria-current={isBrandsActive ? 'page' : undefined}
              className={`-mx-4 block px-4 py-1.5 text-sm font-normal text-white/80 ${isBrandsActive ? 'bg-white/15' : 'hover:bg-white/10'}`}
              href="/admin/brands"
            >
              Brands
            </a>
            <a
              aria-current={isCategoriesActive ? 'page' : undefined}
              className={`-mx-4 block px-4 py-1.5 text-sm font-normal text-white/80 ${isCategoriesActive ? 'bg-white/15' : 'hover:bg-white/10'}`}
              href="/admin/categories"
            >
              Categories
            </a>
            <a
              aria-current={isAdministratorsActive ? 'page' : undefined}
              className={`-mx-4 block px-4 py-1.5 text-sm font-normal text-white/80 ${isAdministratorsActive ? 'bg-white/15' : 'hover:bg-white/10'}`}
              href="/admin/roles"
            >
              Administrators
            </a>
            <a
              aria-current={isAuditActive ? 'page' : undefined}
              className={`-mx-4 block px-4 py-1.5 text-sm font-normal text-white/80 ${isAuditActive ? 'bg-white/15' : 'hover:bg-white/10'}`}
              href="/admin/audit"
            >
              Audit log
            </a>
          </nav>
          <div className="space-y-4" ref={setSidebarSlot} />
        </aside>
        <main className="min-w-0">
          <GridSidebarSlot.Provider value={sidebarSlot}>
            {content}
          </GridSidebarSlot.Provider>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const error = new URLSearchParams(window.location.search).get('error');

  useEffect(() => {
    void getAdminSession()
      .then((value) => {
        const returnTo = sessionStorage.getItem('mc_return_to');
        if (returnTo) {
          sessionStorage.removeItem('mc_return_to');
          if (returnTo !== window.location.pathname + window.location.search) {
            window.location.replace(returnTo);
            return;
          }
        }
        setSession(value);
      })
      .catch((cause: unknown) => {
        if (!(cause instanceof AdminApiError) || cause.status !== 401) {
          console.error(cause);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-page p-6 text-brand-black">
        Loading administration...
      </main>
    );
  }
  return session ? <AdminShell session={session} /> : <SignIn error={error} />;
}
