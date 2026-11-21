import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import {
  LEGAL_JURISDICTION,
  LEGAL_OPERATOR_NAME,
  PRIVACY_CONTACT_EMAIL,
} from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms governing use of MotoCompare.',
};

export default function TermsPage() {
  return (
    <PageShell>
      <article className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Terms of Use</h1>
          <p className="text-sm text-brand-grey">
            Effective 22 November 2026
          </p>
          <p>
            These terms apply when you access or use MotoCompare, operated by{' '}
            {LEGAL_OPERATOR_NAME}.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Using the service</h2>
          <p>
            You may browse and use MotoCompare for lawful, personal, and
            non-commercial comparison and reference purposes. Do not interfere
            with the service, bypass security or rate limits, scrape it in a way
            that harms availability, misrepresent your identity, or use it to
            publish unlawful, abusive, deceptive, or infringing material.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Catalog information</h2>
          <p>
            Specifications, prices, availability, comparisons, analytics, and
            other catalog information are provided for general reference.
            They may be incomplete, changed by a manufacturer or seller, or
            contain errors. MotoCompare does not guarantee that listed
            information is current or suitable for a purchase, riding, or
            safety decision. Verify important details with the manufacturer or
            an authorized seller.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Accounts</h2>
          <p>
            Sign-in is handled through a supported external provider. Keep
            control of that provider account and sign out on shared devices.
            We may suspend an account to protect users or the service. You may
            delete your account from the{' '}
            <Link className="underline" href="/settings">
              Settings page
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Ratings, reviews, and comments</h2>
          <p>
            You retain ownership of content you submit. By submitting it, you
            grant {LEGAL_OPERATOR_NAME} a non-exclusive license to store,
            format, display, reproduce, and make that content available as part
            of MotoCompare. That license ends when you remove the content or
            delete your account, except for routine backups and records that
            applicable law requires to be retained.
          </p>
          <p>
            Content may be edited for presentation or removed when it is
            unlawful, abusive, spam, irrelevant, misleading, or harmful to the
            service or its users. Submit only content you have the right to
            provide and do not post private information about another person.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Intellectual property</h2>
          <p>
            The MotoCompare interface, software, and original service content
            are protected by applicable intellectual-property law. Motorcycle
            brands, model names, specifications, and images remain the property
            of their respective owners and do not imply affiliation,
            sponsorship, or endorsement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Availability and liability</h2>
          <p>
            The service is provided on an &quot;as is&quot; and &quot;as
            available&quot; basis. To the extent permitted by law, MotoCompare
            is not responsible for indirect, incidental, special, or
            consequential losses, or for decisions made from catalog
            information. Nothing in these terms excludes liability that cannot
            lawfully be excluded.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Privacy and governing law</h2>
          <p>
            Our data practices are described in the{' '}
            <Link className="underline" href="/privacy">
              Privacy Policy
            </Link>
            . These terms are governed by the laws of {LEGAL_JURISDICTION},
            subject to any mandatory consumer protections that apply to you.
          </p>
          {PRIVACY_CONTACT_EMAIL ? (
            <p>
              Questions about these terms can be sent to{' '}
              <a
                className="underline"
                href={`mailto:${encodeURIComponent(PRIVACY_CONTACT_EMAIL)}`}
              >
                {PRIVACY_CONTACT_EMAIL}
              </a>
              .
            </p>
          ) : (
            <p>
              A public legal contact email has not yet been configured. Account
              privacy actions remain available in Settings for signed-in users.
            </p>
          )}
        </section>
      </article>
    </PageShell>
  );
}
