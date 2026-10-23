'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  facebookSignInUrl,
  getUserSession,
  searchBikes,
  signOutUser,
} from '@/lib/api';
import type { BikeListItemDto, UserSessionDto } from '@/lib/types';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/bikes', label: 'Browse Bikes' },
  { href: '/compare', label: 'Compare' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState<UserSessionDto | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BikeListItemDto[]>([]);
  const [resultsForTerm, setResultsForTerm] = useState('');
  const [searchingTerm, setSearchingTerm] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searchErrorForTerm, setSearchErrorForTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const trimmedSearchTerm = searchTerm.trim();
  const showSearchResults =
    isSearchFocused && trimmedSearchTerm.length >= 2;

  useEffect(() => {
    if (trimmedSearchTerm.length < 2) {
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setSearchingTerm(trimmedSearchTerm);
      setSearchError('');
      setSearchErrorForTerm('');
      searchBikes(trimmedSearchTerm, 6)
        .then((result) => {
          if (!cancelled) {
            setSearchResults(result.items);
            setResultsForTerm(trimmedSearchTerm);
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            console.error('Bike header search failed.', error);
            setSearchError('Bike search is temporarily unavailable.');
            setSearchErrorForTerm(trimmedSearchTerm);
            setSearchResults([]);
            setResultsForTerm(trimmedSearchTerm);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setSearchingTerm('');
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [trimmedSearchTerm]);

  useEffect(() => {
    let cancelled = false;
    getUserSession()
      .then((result) => {
        if (!cancelled) {
          setSession(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSession(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSession(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    await signOutUser();
    setSession(null);
  }

  function renderAccountControl(className = '') {
    if (loadingSession) {
      return null;
    }
    if (session) {
      return (
        <div className={`flex items-center gap-3 text-sm ${className}`}>
          <span>{session.displayName ?? session.email ?? 'Signed in'}</span>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="underline"
          >
            Sign out
          </button>
        </div>
      );
    }
    return (
      <a
        href={facebookSignInUrl()}
        className={`text-sm underline ${className}`}
      >
        Sign in with Facebook
      </a>
    );
  }

  return (
    <header className="bg-brand-header text-white">
      <div className="flex min-h-16 w-full flex-nowrap items-center justify-between gap-3 px-3 py-4 sm:px-6 md:gap-6">
        <div className="flex min-w-0 flex-nowrap items-center gap-3 md:gap-6">
          <Link href="/" className="shrink-0 font-bold tracking-wide">
            MotoCompare
          </Link>

          <form
            action="/bikes"
            method="get"
            role="search"
            autoComplete="off"
            className="relative w-20 shrink-0 sm:w-32 md:w-56"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={(event) => {
              if (
                !(event.relatedTarget instanceof Node) ||
                !event.currentTarget.contains(event.relatedTarget)
              ) {
                setIsSearchFocused(false);
              }
            }}
          >
          <div className="relative flex">
            <input
              id="header-bike-search"
              name="search"
              type="text"
              aria-label="Search"
              autoComplete="new-password"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder=""
              className="min-w-0 flex-1 border border-white/20 bg-white/10 py-2 pl-3 pr-10 text-sm text-white placeholder:text-white/60 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
            <button
              type="submit"
              aria-label="Search bikes"
              className="absolute right-0 top-0 flex h-full items-center px-3 text-white/80 hover:text-brand-gold"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="h-5 w-5"
              >
                <circle
                  cx="8.5"
                  cy="8.5"
                  r="5.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="m12.5 12.5 4 4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          {showSearchResults && (
            <div
              id="header-bike-search-results"
              className="absolute left-0 z-50 mt-1 max-h-80 w-full max-w-xl overflow-y-auto border border-zinc-200 bg-white text-brand-black shadow-lg"
              aria-live="polite"
            >
              {searchingTerm === trimmedSearchTerm && (
                <p className="p-3 text-sm text-brand-grey">Searching bikes...</p>
              )}
              {searchErrorForTerm === trimmedSearchTerm && (
                <p className="p-3 text-sm text-red-700" role="alert">
                  {searchError}
                </p>
              )}
              {resultsForTerm === trimmedSearchTerm &&
                searchErrorForTerm !== trimmedSearchTerm &&
                searchResults.length === 0 &&
                searchingTerm !== trimmedSearchTerm && (
                  <p className="p-3 text-sm text-brand-grey">No bikes found.</p>
                )}
              {resultsForTerm === trimmedSearchTerm &&
                searchResults.map((bike) => (
                  <Link
                    key={bike.id}
                    href={`/bikes/${bike.slug}`}
                    onClick={() => setIsSearchFocused(false)}
                    className="flex items-center gap-3 p-3 text-sm hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none"
                  >
                    <span className="relative h-10 w-12 shrink-0 overflow-hidden bg-zinc-100">
                      {bike.primaryImageUrl && (
                        <Image
                          src={
                            bike.primaryImageVariants?.small ??
                            bike.primaryImageUrl
                          }
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {bike.brandName} - {bike.modelName}
                      </span>
                      <span className="block truncate text-xs text-brand-grey">
                        {bike.variantName} · {bike.year}
                      </span>
                    </span>
                  </Link>
                ))}
            </div>
          )}
          </form>
        </div>

        {/* Desktop nav */}
        <nav className="ml-auto hidden shrink-0 items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm hover:text-brand-gold"
            >
              {link.label}
            </Link>
          ))}
          {renderAccountControl()}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="ml-auto shrink-0 md:hidden"
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
        <nav className="border-t border-white/10 px-6 py-3 flex flex-col items-end gap-3 text-right md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm hover:text-brand-gold"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {renderAccountControl('self-end pt-2 border-t border-white/10 text-right')}
        </nav>
      )}
    </header>
  );
}
