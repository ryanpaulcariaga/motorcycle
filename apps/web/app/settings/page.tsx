import type { Metadata } from 'next';
import AnalyticsConsent from '@/components/AnalyticsConsent';
import CatalogPageShell from '@/components/CatalogPageShell';
import UserInterestPreference from '@/components/UserInterestPreference';

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <CatalogPageShell>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <div className="space-y-6">
        <AnalyticsConsent mode="settings" />
        <UserInterestPreference />
      </div>
    </CatalogPageShell>
  );
}
