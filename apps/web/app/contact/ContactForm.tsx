'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { sendContactInquiry } from '@/lib/api';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !message.trim()) {
      setError('Please enter your email address and a message.');
      return;
    }

    setPending(true);
    setError(null);
    setSent(false);
    try {
      await sendContactInquiry({ name: name.trim() || null, email: email.trim(), message: message.trim() });
      setName('');
      setEmail('');
      setMessage('');
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error && !(cause instanceof TypeError)
        ? cause.message
        : 'Your message could not be sent. Please try again later.');
    } finally {
      setPending(false);
    }
  }

  const fieldClass = 'mt-1 block w-full border border-brand-grey/40 bg-white px-3 py-2 text-brand-black';

  return (
    <form className="mt-6 space-y-5" onSubmit={(event) => void submit(event)}>
      <label className="block font-semibold">
        Name <span className="font-normal text-brand-grey">(optional)</span>
        <input autoComplete="name" className={fieldClass} disabled={pending} maxLength={100} onChange={(event) => setName(event.target.value)} value={name} />
      </label>
      <label className="block font-semibold">
        Email address
        <input autoComplete="email" className={fieldClass} disabled={pending} maxLength={254} onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
      </label>
      <label className="block font-semibold">
        Message
        <textarea className={fieldClass} disabled={pending} maxLength={5000} onChange={(event) => setMessage(event.target.value)} required rows={7} value={message} />
      </label>
      <p className="text-sm text-brand-grey">
        Your details and message will be stored for administrators to review and respond.
        Please avoid including sensitive information. See our <Link className="underline" href="/privacy">privacy policy</Link>.
      </p>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      {sent && <p className="text-sm text-green-700" role="status">Thank you. Your message has been received.</p>}
      <button className="bg-brand-button px-5 py-3 font-semibold text-white hover:bg-brand-button-active disabled:opacity-50" disabled={pending} type="submit">
        {pending ? 'Sending...' : 'Send message'}
      </button>
    </form>
  );
}
