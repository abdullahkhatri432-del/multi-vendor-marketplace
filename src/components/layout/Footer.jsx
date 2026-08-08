import { Link } from 'react-router-dom';
import { Store, Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-surface-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent">
                <Store className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-display font-bold text-gradient">NexusMart</span>
            </Link>
            <p className="text-sm text-surface-500 leading-relaxed">
              The premium multi-vendor marketplace. Discover unique products from verified sellers worldwide.
            </p>
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
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-4">Connect</h4>
            <div className="flex items-center gap-3">
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100 text-surface-500 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100 text-surface-500 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100 text-surface-500 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-surface-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-400">&copy; {new Date().getFullYear()} NexusMart. All rights reserved.</p>
          <p className="text-xs text-surface-400">Built with React + Firebase + Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}
