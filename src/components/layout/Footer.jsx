import { Link } from 'react-router-dom';
import { Store, Twitter, Mail, Instagram, Youtube, Github, ShieldCheck, Truck, RotateCcw, Headphones } from 'lucide-react';
import Newsletter from '../Newsletter';

const payments = [
  { name: 'Visa', short: 'VISA' },
  { name: 'Mastercard', short: 'MC' },
  { name: 'UPI', short: 'UPI' },
  { name: 'Paytm', short: 'Paytm' },
  { name: 'GPay', short: 'GPay' },
  { name: 'PhonePe', short: 'PhonePe' },
];

export default function Footer() {
  return (
    <footer className="border-t border-surface-100 bg-white">
      <Newsletter />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent shadow-glow transition-transform duration-300 group-hover:scale-105">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-gradient tracking-tight">Speedersmania</span>
            </Link>
            <p className="text-sm text-surface-500 leading-relaxed max-w-xs">
              The premium multi-vendor marketplace. Discover exceptional products from verified sellers worldwide.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3">
              {[
                { icon: ShieldCheck, text: 'Verified vendors & buyer protection' },
                { icon: Truck, text: 'Free shipping on orders ₹999+' },
                { icon: RotateCcw, text: '30-day hassle-free returns' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-surface-500 font-medium">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-primary-100 text-primary-600">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-surface-700 uppercase tracking-wider mb-6">Marketplace</h4>
            <ul className="space-y-3">
              {[
                { label: 'All Products', href: '/products' },
                { label: 'Vendors', href: '/vendors' },
                { label: 'Electronics', href: '/products?category=electronics' },
                { label: 'Fashion', href: '/products?category=fashion' },
                { label: 'Home & Living', href: '/products?category=home' },
                { label: 'Sports', href: '/products?category=sports' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="text-sm text-surface-500 hover:text-primary-600 hover:pl-1 transition-all"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-surface-700 uppercase tracking-wider mb-6">Account</h4>
            <ul className="space-y-3">
              {[
                { label: 'Become a Vendor', href: '/register' },
                { label: 'Order Tracking', href: '/orders' },
                { label: 'Cart', href: '/cart' },
                { label: 'Wishlist', href: '/wishlist' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="text-sm text-surface-500 hover:text-primary-600 hover:pl-1 transition-all"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-surface-700 uppercase tracking-wider mb-6">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/terms" className="text-sm text-surface-500 hover:text-primary-600 hover:pl-1 transition-all">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-surface-500 hover:text-primary-600 hover:pl-1 transition-all">
                  Privacy Policy
                </Link>
              </li>
              <li className="flex items-center gap-2 text-sm text-surface-500 hover:text-primary-600 transition-all">
                <Headphones className="h-3.5 w-3.5 text-primary-500" />
                <span>24/7 help center</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-surface-700 uppercase tracking-wider mb-6">Connect</h4>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="Twitter" className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 text-surface-500 hover:bg-primary-600 hover:text-white hover:shadow-glow hover:-translate-y-0.5 transition-all">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 text-surface-500 hover:bg-primary-600 hover:text-white hover:shadow-glow hover:-translate-y-0.5 transition-all">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="YouTube" className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 text-surface-500 hover:bg-primary-600 hover:text-white hover:shadow-glow hover:-translate-y-0.5 transition-all">
                <Youtube className="h-4 w-4" />
              </a>
              <a href="#" aria-label="GitHub" className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 text-surface-500 hover:bg-primary-600 hover:text-white hover:shadow-glow hover:-translate-y-0.5 transition-all">
                <Github className="h-4 w-4" />
              </a>
              <a href="mailto:support@speedersmania.com" aria-label="Email" className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 text-surface-500 hover:bg-primary-600 hover:text-white hover:shadow-glow hover:-translate-y-0.5 transition-all">
                <Mail className="h-4 w-4" />
              </a>
            </div>

            <h4 className="text-xs font-bold text-surface-700 uppercase tracking-wider mt-10 mb-4">We Accept</h4>
            <div className="flex flex-wrap gap-3">
              {payments.map((p) => (
                <span key={p.short} className="inline-flex items-center justify-center rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-[10px] font-bold tracking-wide text-surface-600 shadow-sm hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-all">
                  {p.short}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-surface-100 pt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-400">
            &copy; {new Date().getFullYear()} Speedersmania. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-surface-400">
            <span>Built with React + Firebase</span>
            <span className="h-3.5 w-0.5 bg-surface-200"></span>
            <a href="#" className="hover:text-primary-600 transition-colors">
              Terms of Service
            </a>
            <span className="h-3.5 w-0.5 bg-surface-200"></span>
            <a href="#" className="hover:text-primary-600 transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
