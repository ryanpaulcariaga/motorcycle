/* The fallback must load before hydration and work without the Next.js runtime. */
/* eslint-disable @next/next/no-css-tags, @next/next/no-sync-scripts */
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import Header from '@/components/Header';
import AnalyticsConsent from '@/components/AnalyticsConsent';
import BrowserSupportReady from '@/components/BrowserSupportReady';
import Footer from '@/components/Footer';
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
        <div
          id="browser-support-notice"
          role="alert"
          aria-labelledby="browser-support-title"
        >
          <header>
            <span>MotoCompare</span>
          </header>
          <main>
            <section>
              <p className="browser-support-label">Browser compatibility</p>
              <h1 id="browser-support-title">Let&apos;s get your browser ready</h1>
              <p className="browser-support-lead">
                MotoCompare needs JavaScript and a few modern browser features
                to load the motorcycle catalog safely.
              </p>
              <h2>Try these quick fixes</h2>
              <ol>
                <li>Enable JavaScript in your browser settings.</li>
                <li>Update your browser to the latest version.</li>
                <li>Reload this page, or open it in Chrome, Edge, Firefox, or Safari.</li>
              </ol>
              <Link href="/">Return to MotoCompare home</Link>
            </section>
          </main>
        </div>
        <Header />
        {children}
        <Footer />
        <AnalyticsConsent />
        <BrowserSupportReady />
      </body>
    </html>
  );
}
