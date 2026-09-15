export default function AdminHomePage() {
  return (
    <main className="min-h-screen bg-brand-page p-6 text-brand-black">
      <section className="mx-auto max-w-5xl bg-brand-content p-8 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-button">MotoCompare Admin</p>
        <h1 className="mt-2 text-3xl font-bold">Catalog administration</h1>
        <p className="mt-4 max-w-xl text-brand-grey">Sign in with an authorized Facebook administrator account to continue.</p>
        <a className="mt-6 inline-flex bg-brand-button px-5 py-3 font-semibold text-white hover:bg-brand-button-active" href="/api/auth/signin/facebook">
          Sign in with Facebook
        </a>
      </section>
    </main>
  );
}
