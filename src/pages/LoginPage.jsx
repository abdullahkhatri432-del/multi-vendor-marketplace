import { Link, useNavigate } from 'react-router-dom';
import { Store, ShieldCheck, Truck, RotateCcw, BadgeCheck, ArrowLeft, Quote } from 'lucide-react';
import AuthModal from '../components/AuthModal';

const perks = [
  { icon: ShieldCheck, title: 'Buyer protection', body: 'Every order covered from checkout to doorstep.' },
  { icon: Truck, title: 'Fast, tracked delivery', body: 'Free shipping on orders over ₹999.' },
  { icon: RotateCcw, title: '7-day easy returns', body: 'Changed your mind? Send it back, no fuss.' },
];

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl items-center gap-14 px-5 py-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-12 lg:py-20">
      {/* Editorial panel */}
      <div className="hidden lg:block">
        <span className="eyebrow">
          <BadgeCheck className="h-3.5 w-3.5 text-primary-600" />
          Verified marketplace
        </span>
        <h1 className="mt-5 font-display text-display-sm text-ink">
          Welcome back to the marketplace.
        </h1>
        <p className="mt-5 max-w-md text-lg font-light leading-relaxed text-ink-soft">
          Pick up where you left off — your cart, wishlist and orders are exactly where you left them.
        </p>

        <div className="mt-10 grid gap-5">
          {perks.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-4">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="mt-0.5 text-sm text-ink-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 max-w-md rounded-3xl border border-surface-200/70 bg-white p-6 shadow-soft">
          <Quote className="h-5 w-5 text-accent" />
          <p className="mt-3 font-display text-xl leading-relaxed text-ink">
            The curated selection means I never worry about quality. This is how online shopping should feel.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Sarah M. · Verified buyer
          </p>
        </div>
      </div>

      {/* Auth card */}
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5 lg:justify-start">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-accent shadow-glow">
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold text-ink">Speedersmania</span>
        </Link>

        <div className="rounded-[2rem] border border-surface-200/70 bg-white p-6 shadow-card sm:p-9">
          <AuthModal
            inline
            isOpen
            initialMode="login"
            onAuthSuccess={() => navigate('/')}
          />
        </div>

        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to the store
        </Link>
      </div>
    </div>
  );
}
