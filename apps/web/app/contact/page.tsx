import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Send MotoCompare a message, suggestion, or inquiry.',
};

export default function ContactPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Contact us</h1>
        <p className="mt-3 text-brand-grey">
          Have a suggestion, a question about a bike, an issue, or a partnership inquiry?
          Send us a message.
        </p>
        <ContactForm />
      </div>
    </PageShell>
  );
}
