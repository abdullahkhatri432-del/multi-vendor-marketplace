import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center animate-fade-in">
      <div className="text-8xl font-display font-bold text-gradient mb-4">404</div>
      <h1 className="text-2xl font-display font-bold text-surface-900">Page Not Found</h1>
      <p className="mt-2 text-surface-500 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-8 flex gap-4">
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
