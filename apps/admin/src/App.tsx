import { useEffect, useState } from "react";
import BikeModelManagement from "@/components/bike-models/BikeModelManagement";
import BikeManagement from "@/components/bikes/BikeManagement";
import RoleManagement from "@/components/roles/RoleManagement";
import SpecGroupManagement from "@/components/specs/SpecGroupManagement";
import { API_BASE_URL, AdminApiError, getAdminSession, signOutAdmin } from "@/lib/api";
import type { AdminSession } from "@/lib/types";

function SignIn({ error }: { error: string | null }) {
  return (
    <main className="min-h-screen bg-brand-page p-6 text-brand-black">
      <section className="mx-auto max-w-5xl bg-brand-content p-8 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-button">MotoCompare Admin</p>
        <h1 className="mt-2 text-3xl font-bold">Catalog administration</h1>
        <p className="mt-4 max-w-xl text-brand-grey">Sign in with an authorized Facebook administrator account to continue.</p>
        {error && <p className="mt-4 border-l-4 border-red-700 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
        <a className="mt-6 inline-flex bg-brand-button px-5 py-3 font-semibold text-white hover:bg-brand-button-active" href={`${API_BASE_URL}/api/admin/auth/facebook`}>
          Sign in with Facebook
        </a>
      </section>
    </main>
  );
}

function AdminShell({ session }: { session: AdminSession }) {
  const match = window.location.pathname.match(/^\/admin\/bike-models\/(\d+)\/bikes$/);
  const content = match
    ? <BikeManagement modelId={Number(match[1])} />
    : window.location.pathname === "/admin/bike-models" ? <BikeModelManagement />
    : window.location.pathname === "/admin/specs" ? <SpecGroupManagement />
    : <RoleManagement />;

  async function signOut() {
    await signOutAdmin();
    window.location.assign("/");
  }

  return (
    <div className="min-h-screen bg-brand-page">
      <header className="flex min-h-16 items-center justify-between gap-4 bg-brand-header px-6 py-4 text-white">
        <a className="font-bold tracking-wide" href="/admin">MotoCompare Admin</a>
        <div className="flex items-center gap-4"><span className="hidden text-sm sm:inline">{session.displayName ?? session.facebookUserId}</span><button className="text-sm underline" type="button" onClick={() => void signOut()}>Sign out</button></div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 p-4 md:grid-cols-[14rem_minmax(0,1fr)] md:p-8">
        <nav className="bg-brand-sidebar p-4 text-white"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-gold">Catalog</p><a className="block bg-white/10 px-3 py-2 font-semibold" href="/admin/roles">Administrators</a><a className="mt-2 block px-3 py-2 font-semibold hover:bg-white/10" href="/admin/bike-models">BikeModels</a><a className="mt-2 block px-3 py-2 font-semibold hover:bg-white/10" href="/admin/specs">Spec Groups &amp; Definitions</a></nav>
        <main>{content}</main>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const error = new URLSearchParams(window.location.search).get("error");

  useEffect(() => {
    void getAdminSession().then(setSession).catch((cause: unknown) => {
      if (!(cause instanceof AdminApiError) || cause.status !== 401) console.error(cause);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="min-h-screen bg-brand-page p-6 text-brand-black">Loading administration...</main>;
  return session ? <AdminShell session={session} /> : <SignIn error={error} />;
}