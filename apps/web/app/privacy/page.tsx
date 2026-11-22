import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import {
  LEGAL_OPERATOR_NAME,
  PRIVACY_CONTACT_EMAIL,
} from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How MotoCompare collects, uses, retains, and deletes data.',
};

export default function PrivacyPage() {
  return (
    <PageShell>
      <article className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-brand-grey">
            Effective 22 November 2026
          </p>
          <p>
            {LEGAL_OPERATOR_NAME} operates MotoCompare. This policy explains
            what information the service handles, why it is used, and the
            controls available to you.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Information we handle</h2>
          <p>MotoCompare may handle:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Account information received from the sign-in provider, including
              a provider user ID, display name, email address, and whether that
              email was verified. Provider access tokens are not stored.
            </li>
            <li>
              An internal account ID and secure, HttpOnly session cookie used to
              keep you signed in for up to 30 days.
            </li>
            <li>
              Ratings, reviews, and discussion comments that you choose to
              publish, together with creation and update times.
            </li>
            <li>
              Contact form messages, the email address and optional name you provide,
              and the time of submission. These messages are not published.
            </li>
            <li>
              Optional account interest preferences and structured daily counts
              for bike views, selections from search results, brand/category
              choices, and comparisons. Raw search text is not collected.
            </li>
            <li>
              Optional anonymous analytics daily counts. These counts do not
              contain an analytics identifier, account ID, session ID, or raw
              search term and cannot be linked back to a person by MotoCompare.
            </li>
            <li>
              Technical request and hosting logs produced by the application and
              infrastructure, which may include IP address, user agent, path,
              timestamps, and security diagnostics.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">How information is used</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Operate catalog browsing, search, comparison, and accounts.</li>
            <li>Authenticate users and display their public reviews and comments.</li>
            <li>Review and respond to contact inquiries.</li>
            <li>Secure the service, prevent abuse, diagnose failures, and keep audit records.</li>
            <li>
              Measure service use only after a visitor accepts anonymous analytics.
            </li>
            <li>
              Build a personal interest profile only after a signed-in user
              separately enables it. Profiles are not sold, shared as
              individual profiles, or used for email marketing.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Consent and controls</h2>
          <p>
            Anonymous analytics and account interest profiles are separate
            opt-in features. Declining one does not enable the other. Preferences
            can be changed on the{' '}
            <Link className="underline" href="/settings">
              Settings page
            </Link>
            . Browser analytics consent is stored locally in your browser;
            account profiling is stored with your MotoCompare account.
          </p>
          <p>
            Turning off an account interest profile deletes its activity in the
            same operation. Signed-in users can also download a JSON export or
            permanently delete their account from Settings.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Retention and deletion</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Anonymous analytics and account interest counts are deleted after
              12 calendar months.
            </li>
            <li>
              Accounts and account-linked content remain until you delete the
              account or request account removal through the available privacy
              channel.
            </li>
            <li>
              Contact inquiries are stored separately from accounts until an administrator
              deletes them. Deleting your account does not automatically delete a contact inquiry.
            </li>
            <li>
              Account deletion removes the internal account, linked sign-ins,
              profile counters, reviews, ratings, and discussion comments
              immediately.
            </li>
            <li>
              Anonymous aggregates are retained independently because they
              contain no account identifier. Hosting and security logs may have
              separate operational retention controlled by the deployed
              infrastructure.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Service providers</h2>
          <p>
            Sign-in is provided through Facebook. Application, database, image,
            and hosting services are operated on Azure. These providers process
            information needed to deliver their respective functions and apply
            their own privacy and security controls. MotoCompare does not sell
            personal information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Your information</h2>
          <p>
            Subject to applicable law, you may request access to, correction of,
            or deletion of your information, or export your account data. Most
            account export and deletion requests can be completed directly in
            Settings.
          </p>
          {PRIVACY_CONTACT_EMAIL ? (
            <p>
              For privacy requests not available there, contact{' '}
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
              A dedicated public privacy email has not yet been configured.
              You can use the <Link className="underline" href="/contact">contact form</Link> for
              privacy requests, or the self-service export and deletion controls in Settings.
            </p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Children and changes</h2>
          <p>
            MotoCompare is not directed to children who are not permitted to
            use an external sign-in provider under applicable law. We may update
            this policy as the service or legal requirements change; the
            effective date above will be updated when that happens.
          </p>
        </section>
      </article>
    </PageShell>
  );
}
