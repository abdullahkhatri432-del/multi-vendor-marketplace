import { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { subscribeToNewsletter } from '../config/firestore';
import LoadingSpinner from './ui/LoadingSpinner';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message }
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault(); // prevent page reload

    const trimmed = email.trim();

    // --- Client-side validation ---
    if (!trimmed) {
      setStatus({ type: 'error', message: 'Please enter your email address.' });
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    // --- Loading state (disable double-submit) ---
    setLoading(true);
    setStatus(null);

    try {
      const result = await subscribeToNewsletter(trimmed);

      if (result.alreadySubscribed) {
        setStatus({ type: 'success', message: 'You’re already subscribed — thanks for staying! 🎉' });
      } else {
        setStatus({ type: 'success', message: 'Thanks! You’re subscribed. 🎉' });
      }
      setEmail('');
    } catch (err) {
      // Network errors, Firestore rules blocks, or other failures land here.
      console.error('Newsletter subscribe failed:', err);
      setStatus({ type: 'error', message: 'Something went wrong. Please try again in a moment.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="newsletter-title" className="bg-surface-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <h2 id="newsletter-title" className="text-xl font-display font-bold text-white">
                Stay in the loop
              </h2>
            </div>
            <p className="text-sm text-surface-400 leading-relaxed">
              Get product drops, vendor deals, and insider tips. No spam — unsubscribe anytime.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-3">
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                type="email"
                id="newsletter-email"
                name="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  // Clear error as soon as the user starts typing again.
                  if (status?.type === 'error') setStatus(null);
                }}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
                aria-invalid={status?.type === 'error' || undefined}
                aria-describedby="newsletter-status"
                className={`input-field ${status?.type === 'error' ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}`}
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary whitespace-nowrap disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="border-white/40 border-t-white" />
                    <span>Subscribing…</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Subscribe</span>
                  </>
                )}
              </button>
            </div>

            {/* Single status region; announced by screen readers via aria-live */}
            <div
              id="newsletter-status"
              role="status"
              aria-live="polite"
              className="flex min-h-[1.5rem] items-center text-sm"
            >
              {status && (
                <span
                  className={`inline-flex items-center gap-1.5 ${
                    status.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {status.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {status.message}
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}