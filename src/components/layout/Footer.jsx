import { Link } from 'react-router-dom';
import { Store, Twitter, Mail, Instagram, Youtube, Github, ShieldCheck, Truck, RotateCcw, Headphones, ArrowRight } from 'lucide-react';
import Newsletter from '../Newsletter';

const payments = [
  { name: 'UPI', short: 'UPI' },
  { name: 'Cash on Delivery', short: 'COD' },
  { name: 'Bank / UPI transfer', short: 'BANK' },
];

export default function Footer() {
  return (
    <footer className="border-t border-surface-200/40 bg-surface-100/30">
      <Newsletter />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-24 lg:py-32 overflow-hidden">
        {/* Decorative mesh gradient */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary-500/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-accent-dark/10 blur-[120px]" />
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-5 stagger">
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-5 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-accent shadow-glow transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold tracking-tightest text-gradient">
                Speedersmania
              </span>
            </Link>
            <p className="text-sm text-ink-muted leading-relaxed max-w-xs mb-6">
              A multi-vendor marketplace with verified stores, live stock and server-verified UPI payments.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { icon: ShieldCheck, text: 'Admin-verified stores' },
                { icon: Truck, text: 'Free shipping on orders over ₹999' },
                { icon: RotateCcw, text: 'Returns per seller policy' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-sm text-ink-soft font-medium">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary-50 text-primary-600 shadow-sm">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-6">Marketplace</h4>
            <ul className="space-y-4">
              {[
                { label: 'All Products', href: '/products' },
                { label: 'Vendors', href: '/vendors' },
                { label: 'Electronics', href: '/products?category=electronics' },
                { label: 'Fashion', href: '/products?category=fashion' },
                { label: 'Home & Living', href: '/products?category=home' },
                { label: 'Sports', href: '/products?category=sports' },
                { label: 'Books', href: '/products?category=books' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="link-underline text-sm text-ink-soft hover:text-primary-700 hover:pl-2 transition-all"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-6">Account</h4>
            <ul className="space-y-4">
              {[
                { label: 'Become a Vendor', href: '/register' },
                { label: 'Order Tracking', href: '/orders' },
                { label: 'Cart', href: '/cart' },
                { label: 'Wishlist', href: '/wishlist' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="link-underline text-sm text-ink-soft hover:text-primary-700 hover:pl-2 transition-all"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-6">Support</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/terms" className="link-underline text-sm text-ink-soft hover:text-primary-700 hover:pl-2 transition-all">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="link-underline text-sm text-ink-soft hover:text-primary-700 hover:pl-2 transition-all">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="mailto:support@speedersmania.com" className="flex items-center gap-2.5 text-sm text-ink-soft hover:text-primary-700 transition-all">
                  <Headphones className="h-3.5 w-3.5 text-primary-500" />
                  <span>Email support</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-6">Connect</h4>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="Twitter" className="h-11 w-11 rounded-2xl bg-white border border-surface-200 flex items-center justify-center text-ink-muted shadow-soft transition-all hover:bg-primary-600 hover:text-white hover:-translate-y-1 hover:shadow-glow">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Instagram" className="h-11 w-11 rounded-2xl bg-white border border-surface-200 flex items-center justify-center text-ink-muted shadow-soft transition-all hover:bg-primary-600 hover:text-white hover:-translate-y-1 hover:shadow-glow">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="YouTube" className="h-11 w-11 rounded-2xl bg-white border border-surface-200 flex items-center justify-center text-ink-muted shadow-soft transition-all hover:bg-primary-600 hover:text-white hover:-translate-y-1 hover:shadow-glow">
                <Youtube className="h-4 w-4" />
              </a>
              <a href="#" aria-label="GitHub" className="h-11 w-11 rounded-2xl bg-white border border-surface-200 flex items-center justify-center text-ink-muted shadow-soft transition-all hover:bg-primary-600 hover:text-white hover:-translate-y-1 hover:shadow-glow">
                <Github className="h-4 w-4" />
              </a>
              <a href="mailto:support@speedersmania.com" aria-label="Email" className="h-11 w-11 rounded-2xl bg-white border border-surface-200 flex items-center justify-center text-ink-muted shadow-soft transition-all hover:bg-primary-600 hover:text-white hover:-translate-y-1 hover:shadow-glow">
                <Mail className="h-4 w-4" />
              </a>
            </div>

            <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-4">We Accept</h4>
            <div className="flex flex-wrap gap-2.5">
              {payments.map((p) => (
                <span key={p.short} className="inline-flex items-center justify-center rounded-xl border border-surface-200 bg-white px-3 py-1.5 text-[10px] font-bold tracking-wide text-ink-soft shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700">
                  {p.short}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-surface-200/50 pt-12 sm:flex-row reveal">
          <p className="text-[10px] text-ink-muted">&copy; {new Date().getFullYear()} Speedersmania. All rights reserved.</p>
          <div className="flex items-center gap-6 text-[10px] text-ink-muted">
            <span>Built with React + Firebase</span>
            <span className="h-3 w-0.5 bg-surface-300/50"></span>
            <a href="#" className="hover:text-primary-700 transition-colors">Terms of Service</a>
            <span className="h-3 w-0.5 bg-surface-300/50"></span>
            <a href="#" className="hover:text-primary-700 transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
