"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { facebookSignInUrl, getUserSession, signOutUser } from "@/lib/api";
import type { UserSessionDto } from "@/lib/types";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/bikes", label: "Browse Bikes" },
  { href: "/compare", label: "Compare" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState<UserSessionDto | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getUserSession()
      .then((result) => { if (!cancelled) setSession(result); })
      .catch(() => { if (!cancelled) setSession(null); })
      .finally(() => { if (!cancelled) setLoadingSession(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleSignOut() {
    await signOutUser();
    setSession(null);
  }

  function AccountControl({ className = "" }: { className?: string }) {
    if (loadingSession) return null;
    if (session) {
      return (
        <div className={`flex items-center gap-3 text-sm ${className}`}>
          <span>{session.displayName ?? session.email ?? "Signed in"}</span>
          <button type="button" onClick={() => void handleSignOut()} className="font-semibold hover:text-brand-gold">
            Sign out
          </button>
        </div>
      );
    }
    return (
      <a href={facebookSignInUrl()} className={`text-sm font-semibold hover:text-brand-gold ${className}`}>
        Sign in with Facebook
      </a>
    );
  }

  return (
    <header className="bg-brand-header text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          MotoCompare
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex md:items-center md:gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium hover:text-brand-gold">
              {link.label}
            </Link>
          ))}
          <AccountControl />
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className="block h-0.5 w-6 bg-white mb-1" />
          <span className="block h-0.5 w-6 bg-white mb-1" />
          <span className="block h-0.5 w-6 bg-white" />
        </button>
      </div>

      {/* Mobile drawer */}
      {isMenuOpen && (
        <nav className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium hover:text-brand-gold"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <AccountControl className="pt-2 border-t border-white/10" />
        </nav>
      )}
    </header>
  );
}

