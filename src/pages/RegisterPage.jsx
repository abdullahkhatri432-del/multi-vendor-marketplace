import { Link, useNavigate } from 'react-router-dom';
import { Store, ArrowLeft, TrendingUp, ShieldCheck, BadgeCheck, Users, Wallet } from 'lucide-react';
import AuthModal from '../components/AuthModal';

const vendorPerks = [
  { icon: Users, title: 'Reach real buyers', body: 'A curated audience that trusts the marketplace.' },
  { icon: Wallet, title: 'Transparent payouts', body: 'UPI-first checkout with verified transactions.' },
  { icon: TrendingUp, title: 'Tools that sell', body: 'Bulk import, analytics and order management built in.' },
];

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl items-center gap-14 px-5 py-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-12 lg:py-20">
      {/* Editorial panel */}
      <div className="hidden lg:block reveal-left">
        <span className="eyebrow">
          <BadgeCheck className="h-3.5 w-3.5 text-primary-600" />
          Join the marketplace
        </span>
        <h1 className="mt-5 font-display text-display-sm text-ink">
          Set up shop, or shop the best of it.
        </h1>
        <p className="mt-5 max-w-md text-lg font-light leading-relaxed text-ink-soft">
          Create an account as a customer to shop verified sellers, or as a vendor to reach millions of buyers.
        </p>

        <div className="mt-10 grid gap-5 stagger">
          {vendorPerks.map(({ icon: Icon, title, body }) => (
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

        <div className="mt-12 flex items-center gap-4 rounded-3xl border border-surface-200/70 bg-white p-6 shadow-soft reveal delay-200">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent-dark">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <p className="text-sm leading-relaxed text-ink-soft">
            Every vendor is verified before going live, so buyers know exactly who they are buying from.
          </p>
        </div>
      </div>

      {/* Auth card */}
      <div className="mx-auto w-full max-w-md reveal-right">
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
            initialMode="register"
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
