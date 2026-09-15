import Link from "next/link";
import { getAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getAdminSession();
  if (!session) redirect("/");

  return (
    <div className="min-h-screen bg-brand-page">
      <header className="flex min-h-16 items-center justify-between gap-4 bg-brand-header px-6 py-4 text-white">
        <Link className="font-bold tracking-wide" href="/admin">MotoCompare Admin</Link>
        <form action="/api/auth/signout" method="post"><button className="text-sm underline" type="submit">Sign out</button></form>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 p-4 md:grid-cols-[14rem_minmax(0,1fr)] md:p-8">
        <nav className="bg-brand-sidebar p-4 text-white"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-gold">Catalog</p><Link className="block bg-white/10 px-3 py-2 font-semibold" href="/admin/roles">Administrators</Link><Link className="mt-2 block px-3 py-2 font-semibold hover:bg-white/10" href="/admin/bike-models">BikeModels</Link></nav>
        <main>{children}</main>
      </div>
    </div>
  );
}
