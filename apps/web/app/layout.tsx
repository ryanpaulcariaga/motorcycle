/* The fallback must load before hydration and work without the Next.js runtime. */
/* eslint-disable @next/next/no-css-tags, @next/next/no-sync-scripts */
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Header from '@/components/Header';
import AnalyticsConsent from '@/components/AnalyticsConsent';
import { SITE_URL } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'MotoCompare - Motorcycle Specs & Comparison',
    template: '%s | MotoCompare',
  },
  description:
    'Browse, search, filter, and compare motorcycle specs side-by-side.',
  openGraph: {
    title: 'MotoCompare - Motorcycle Specs & Comparison',
    description:
      'Browse, search, filter, and compare motorcycle specs side-by-side.',
    siteName: 'MotoCompare',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MotoCompare - Motorcycle Specs & Comparison',
    description:
      'Browse, search, filter, and compare motorcycle specs side-by-side.',
    images: ['/opengraph-image'],
  },
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="en" className="h-full antialiased browser-pending" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/browser-support.css" />
        <script src="/browser-support.js" nonce={nonce} />
      </head>
      <body className="min-h-full flex flex-col">
        <div id="browser-support-notice">
          <header>MotoCompare</header>
          <main>
            <h1>Browser not supported</h1>
            <p>Your browser may be outdated, or JavaScript may be disabled or unavailable.</p>
            <p>Enable JavaScript and update your browser, or try a current version of Chrome, Edge, Firefox, or Safari.</p>
          </main>
        </div>
        <Header />
        {children}
        <AnalyticsConsent />
      </body>
    </html>
  );
}
