import { Link } from 'react-router-dom';
<<<<<<< Updated upstream
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
=======
import { Store, Github, Twitter, Mail, Heart, ArrowUpRight, Sparkles } from 'lucide-react';
>>>>>>> Stashed changes

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
<<<<<<< Updated upstream
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
=======
    <footer className="relative border-t border-surface-100 bg-white overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary-50/50 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-accent/5 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="py-12 border-b border-surface-100">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-2 justify-center lg:justify-start mb-2">
                <Sparkles className="h-5 w-5 text-primary-500" />
                <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Stay Updated</span>
              </div>
              <h3 className="text-2xl font-display font-bold text-surface-900">Get the latest deals & arrivals</h3>
              <p className="text-surface-500 mt-1">Join 50,000+ subscribers for exclusive offers.</p>
            </div>
            <form className="flex w-full max-w-md gap-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 input-field"
                required
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </form>
>>>>>>> Stashed changes
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-accent shadow-glow">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-gradient">Speedersmania</span>
            </Link>
            <p className="text-sm text-surface-500 leading-relaxed max-w-sm mb-6">
              The premium multi-vendor marketplace. Discover unique products from verified sellers worldwide.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Github, href: '#', label: 'GitHub' },
                { icon: Mail, href: 'mailto:support@speedersmania.com', label: 'Email' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 text-surface-500 hover:bg-primary-50 hover:text-primary-600 transition-all duration-200 hover:scale-110"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-4">Marketplace</h4>
            <ul className="space-y-3">
              {[
                { to: '/products', label: 'All Products' },
                { to: '/products?category=electronics', label: 'Electronics' },
                { to: '/products?category=fashion', label: 'Fashion' },
                { to: '/products?category=home', label: 'Home & Living' },
                { to: '/vendors', label: 'Vendors' },
              ].map(({ to, label }) => (
                <li key={label}>
                  <Link to={to} className="group flex items-center gap-1 text-sm text-surface-500 hover:text-primary-600 transition-colors">
                    {label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-4">Account</h4>
            <ul className="space-y-3">
              {[
                { to: '/register', label: 'Become a Vendor' },
                { to: '/orders', label: 'Order Tracking' },
                { to: '/cart', label: 'Cart' },
                { to: '/wishlist', label: 'Wishlist' },
                { to: '/profile', label: 'Profile' },
              ].map(({ to, label }) => (
                <li key={label}>
                  <Link to={to} className="group flex items-center gap-1 text-sm text-surface-500 hover:text-primary-600 transition-colors">
                    {label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-4">Legal</h4>
            <ul className="space-y-3">
              {[
                { to: '/terms', label: 'Terms & Conditions' },
                { to: '/privacy', label: 'Privacy Policy' },
              ].map(({ to, label }) => (
                <li key={label}>
                  <Link to={to} className="group flex items-center gap-1 text-sm text-surface-500 hover:text-primary-600 transition-colors">
                    {label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-400">
            &copy; {currentYear} Speedersmania. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-surface-400">
            Built with <Heart className="h-3 w-3 text-danger fill-danger" /> using React + Firebase
          </p>
        </div>
      </div>
    </footer>
  );
}
