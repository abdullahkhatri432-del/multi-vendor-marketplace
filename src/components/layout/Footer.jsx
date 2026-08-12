import { Link } from 'react-router-dom';
import { Store, Github, Twitter, Mail, Instagram, Youtube, ShieldCheck, Truck, RotateCcw, Headphones } from 'lucide-react';
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent transition-transform duration-300 group-hover:scale-105">
                <Store className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-display font-bold text-gradient">Speedersmania</span>
            </Link>
            <p className="text-sm text-surface-500 leading-relaxed">
              The premium multi-vendor marketplace. Discover unique products from verified sellers worldwide.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-2">
              {[
                { icon: ShieldCheck, text: 'Verified vendors & buyer protection' },
                { icon: Truck, text: 'Free shipping on orders ₹999+' },
                { icon: RotateCcw, text: '30-day hassle-free returns' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-surface-500">
                  <Icon className="h-3.5 w-3.5 text-primary-500" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-4">Marketplace</h4>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-sm text-surface-500 hover:text-primary-600 transition-colors">All Products</Link></li>
              <li><Link to="/products?category=electronics" className="text-sm text-surface-500 hover:text-primary-600 transition-colors">Electronics</Link></li>
              <li><Link to="/products?category=fashion" className="text-sm text-surface-500 hover:text-primary-600 transition-colors">Fashion</Link></li>
              <li><Link to="/products?category=home" className="text-sm text-surface-500 hover:text-primary-600 transition-colors">Home & Living</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-4">Account</h4>
            <ul className="space-y-2">
              <li><Link to="/register" className="text-sm text-surface-500 hover:text-primary-600 transition-colors">Become a Vendor</Link></li>
              <li><Link to="/orders" className="text-sm text-surface-500 hover:text-primary-600 transition-colors">Order Tracking</Link></li>
              <li><Link to="/cart" className="text-sm text-surface-500 hover:text-primary-600 transition-colors">Cart</Link></li>
              <li><Link to="/wishlist" className="text-sm text-surface-500 hover:text-primary-600 transition-colors">Wishlist</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-sm text-surface-500 hover:text-primary-600 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-sm text-surface-500 hover:text-primary-600 transition-colors">Privacy Policy</Link></li>
              <li><a href="mailto:support@speedersmania.com" className="text-sm text-surface-500 hover:text-primary-600 transition-colors">Contact Support</a></li>
              <li><span className="flex items-center gap-2 text-sm text-surface-500"><Headphones className="h-3.5 w-3.5 text-primary-500" /> 24/7 help center</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-4">Connect</h4>
            <div className="flex items-center gap-2.5">
              <a href="#" aria-label="Twitter" className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100 text-surface-500 hover:bg-primary-600 hover:text-white hover:shadow-glow hover:-translate-y-0.5 transition-all">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100 text-surface-500 hover:bg-primary-600 hover:text-white hover:shadow-glow hover:-translate-y-0.5 transition-all">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="YouTube" className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100 text-surface-500 hover:bg-primary-600 hover:text-white hover:shadow-glow hover:-translate-y-0.5 transition-all">
                <Youtube className="h-4 w-4" />
              </a>
              <a href="#" aria-label="GitHub" className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100 text-surface-500 hover:bg-primary-600 hover:text-white hover:shadow-glow hover:-translate-y-0.5 transition-all">
                <Github className="h-4 w-4" />
              </a>
              <a href="mailto:support@speedersmania.com" aria-label="Email" className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100 text-surface-500 hover:bg-primary-600 hover:text-white hover:shadow-glow hover:-translate-y-0.5 transition-all">
                <Mail className="h-4 w-4" />
              </a>
            </div>

            <h4 className="text-sm font-semibold text-surface-900 mt-6 mb-3">We Accept</h4>
            <div className="flex flex-wrap gap-2">
              {payments.map((p) => (
                <span key={p.short} className="inline-flex items-center justify-center rounded-lg border border-surface-200 bg-surface-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-surface-600">
                  {p.short}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-surface-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-400">&copy; {new Date().getFullYear()} Speedersmania. All rights reserved.</p>
          <p className="text-xs text-surface-400">Built with React + Firebase + Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}
