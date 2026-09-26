import type { Metadata } from 'next';
import Header from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'MotoCompare - Motorcycle Specs & Comparison',
    template: '%s | MotoCompare',
  },
  description:
    'Browse, search, filter, and compare motorcycle specs side-by-side.',
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
