'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  facebookSignInUrl,
  getUserSession,
  searchBikes,
  signOutUser,
} from '@/lib/api';
import type { BikeListItemDto, UserSessionDto } from '@/lib/types';
import { markSearchSubmitted } from '@/lib/analytics';
import { trackUserInterest, updateCachedInterestPreference } from '@/lib/user-interest';

const navLinks = [
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const swipeStartX = useRef(0);
  const trimmedSearchTerm = searchTerm.trim();
  const showSearchResults =
    isSearchFocused && trimmedSearchTerm.length >= 2;

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  // Leaving the mobile/tablet range returns every collapsible control to its default.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const reset = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMenuOpen(false);
        setIsSearchOpen(false);
      }
    };
    query.addEventListener('change', reset);
    return () => query.removeEventListener('change', reset);
  }, []);

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
    updateCachedInterestPreference(null);
    window.dispatchEvent(new Event('mc-user-signout'));
  }

  function renderAccountControl(stacked = false) {
    if (loadingSession) {
      return null;
    }
    if (session) {
      return (
        <div
          className={`flex text-sm ${
            stacked ? 'w-full flex-col items-stretch' : 'h-full items-center'
          }`}
        >
          <Link
            href="/settings"
            className={`flex items-center px-3 text-right transition-colors hover:bg-brand-button hover:text-white ${
              stacked ? 'justify-end py-2' : 'h-full'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            {session.displayName ?? session.email ?? 'Signed in'}
          </Link>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className={`flex items-center px-3 text-right transition-colors hover:bg-brand-button hover:text-white ${
              stacked ? 'justify-end py-2' : 'h-full'
            }`}
          >
            Sign out
          </button>
        </div>
      );
    }
    return (
      <div
        className={`flex text-sm ${
          stacked ? 'w-full flex-col items-stretch' : 'h-full items-center'
        }`}
      >
        <Link
          href="/settings"
          className={`flex items-center px-3 text-right transition-colors hover:bg-brand-button hover:text-white ${
            stacked ? 'justify-end py-2' : 'h-full'
          }`}
          onClick={() => setIsMenuOpen(false)}
        >
          Settings
        </Link>
        <a
          href={facebookSignInUrl()}
          className={`flex items-center px-3 text-right transition-colors hover:bg-brand-button hover:text-white ${
            stacked ? 'justify-end py-2' : 'h-full'
          }`}
        >
          Sign in with Facebook
        </a>
      </div>
    );
  }

  return (
    <header className="relative bg-brand-header text-white">
      <div className="flex h-16 w-full items-center gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="-ml-3 mr-auto flex h-full shrink-0 items-center px-3 font-bold tracking-wide transition-colors hover:bg-brand-button hover:text-white"
        >
          MotoCompare
        </Link>

        <form
          action="/bikes"
          method="get"
          role="search"
          autoComplete="off"
          onSubmit={() => {
            if (searchTerm.trim()) {
              markSearchSubmitted();
            }
          }}
          className={`${
            isSearchOpen
              ? 'absolute inset-x-0 top-0 z-40 flex h-full items-center bg-brand-header px-4'
              : 'relative'
          } min-w-0 md:relative md:block md:h-auto md:w-56 md:shrink-0 md:bg-transparent md:p-0`}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={(event) => {
            if (
              !(event.relatedTarget instanceof Node) ||
              !event.currentTarget.contains(event.relatedTarget)
            ) {
              setIsSearchFocused(false);
              setIsSearchOpen(false);
            }
          }}
        >
          <input type="hidden" name="search" value={searchTerm} />
          {!isSearchOpen && (
            <button
              type="button"
              aria-label="Open search"
              onClick={() => {
                setIsSearchOpen(true);
                setIsMenuOpen(false);
              }}
              className="flex h-9 w-9 items-center justify-center text-white/80 transition-colors hover:bg-brand-button hover:text-white md:hidden"
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
          )}
          <div
            className={`${isSearchOpen ? 'flex' : 'hidden'} relative w-full md:flex`}
          >
            <input
              id="header-bike-search"
              ref={searchInputRef}
              type="text"
              aria-label="Search"
              autoComplete="off"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search bikes..."
              className="min-w-0 flex-1 border border-white/20 bg-white/10 px-3 py-1.5 pr-9 text-sm text-white placeholder:text-white/60 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
            <button
              type="submit"
              aria-label="Search bikes"
              className="absolute right-0 top-0 flex h-full items-center px-2 text-white/80 transition-colors hover:bg-brand-button hover:text-white"
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
              className="absolute left-0 top-full z-50 mt-1 max-h-80 w-full max-w-xl overflow-y-auto border border-zinc-200 bg-white text-black shadow-lg"
              aria-live="polite"
            >
              {searchingTerm === trimmedSearchTerm && (
                <p className="p-2 text-sm text-brand-grey">Searching bikes...</p>
              )}
              {searchErrorForTerm === trimmedSearchTerm && (
                <p className="p-2 text-sm text-red-700" role="alert">
                  {searchError}
                </p>
              )}
              {resultsForTerm === trimmedSearchTerm &&
                searchErrorForTerm !== trimmedSearchTerm &&
                searchResults.length === 0 &&
                searchingTerm !== trimmedSearchTerm && (
                  <p className="p-2 text-sm text-brand-grey">No bikes found.</p>
                )}
              {resultsForTerm === trimmedSearchTerm &&
                searchResults.map((bike) => (
                  <Link
                    key={bike.id}
                    href={`/bikes/${bike.slug}${
                      bike.isTestData || bike.modelIsTestData
                        ? '?preview=test'
                        : ''
                    }`}
                    onClick={() => {
                      trackUserInterest({ type: 'bike_search_selection', id: bike.id });
                      setIsSearchFocused(false);
                    }}
                    className="flex items-center gap-2 bg-white p-2 text-sm text-black hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none"
                  >
                    <span className="relative h-8 w-10 shrink-0 overflow-hidden bg-zinc-100">
                      {bike.primaryImageUrl && (
                        <Image
                          src={
                            bike.primaryImageVariants?.small ??
                            bike.primaryImageUrl
                          }
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-black">
                      {bike.variantName}
                    </span>
                  </Link>
                ))}
            </div>
          )}
        </form>

        <nav className="hidden h-full shrink-0 items-center md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex h-full items-center px-3 text-sm transition-colors hover:bg-brand-button hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          {renderAccountControl()}
        </nav>

        <button
          type="button"
          className="-mr-2 flex h-full shrink-0 flex-col items-center justify-center px-2 transition-colors hover:bg-brand-button md:hidden [&:hover>span]:bg-white"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className="block h-0.5 w-6 bg-white mb-1" />
          <span className="block h-0.5 w-6 bg-white mb-1" />
          <span className="block h-0.5 w-6 bg-white" />
        </button>
      </div>

      {/* Mobile drawer */}
      {isMenuOpen && (
        <nav
          id="mobile-navigation"
          className="flex flex-col items-stretch border-t border-white/10 px-4 py-3 text-right md:hidden sm:px-6"
          onTouchStart={(event) => {
            swipeStartX.current = event.touches[0].clientX;
          }}
          onTouchEnd={(event) => {
            const deltaX = event.changedTouches[0].clientX - swipeStartX.current;
            if (Math.abs(deltaX) > 50) {
              setIsMenuOpen(false);
            }
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="w-full px-3 py-2 text-sm transition-colors hover:bg-brand-button hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex w-full justify-end border-t border-white/10 pt-3">
            {renderAccountControl(true)}
          </div>
        </nav>
      )}
    </header>
  );
}
