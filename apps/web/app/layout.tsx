import type { Metadata } from 'next';
import Header from '@/components/Header';
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

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
      </body>
    </html>
  );
}
