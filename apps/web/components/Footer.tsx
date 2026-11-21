import Link from 'next/link';
import { LEGAL_OPERATOR_NAME } from '@/lib/legal';

export default function Footer() {
  return (
    <footer className="bg-brand-header px-6 py-5 text-sm text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; 2026 {LEGAL_OPERATOR_NAME}</p>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:bg-brand-button"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:bg-brand-button"
          >
            Terms
          </Link>
          <Link
            href="/settings"
            className="underline underline-offset-4 hover:bg-brand-button"
          >
            Settings
          </Link>
        </nav>
      </div>
    </footer>
  );
}
