import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center animate-fade-in">
      <div className="relative mb-6">
        <div className="text-8xl sm:text-9xl font-display font-bold text-gradient">404</div>
        <div className="absolute -top-4 -right-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500 to-accent shadow-glow animate-float">
          <Search className="h-8 w-8 text-white" />
        </div>
      </div>
      <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-900">Page Not Found</h1>
      <p className="mt-3 text-surface-500 max-w-md">
        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link to="/" className="btn-primary">
          <Home className="h-4 w-4" /> Go Home
        </Link>
        <button onClick={() => window.history.back()} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </div>
    </div>
  );
}
