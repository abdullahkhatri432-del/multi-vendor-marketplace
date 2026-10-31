import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-danger shadow-soft mb-6">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-display font-bold text-surface-900">Something went wrong</h2>
          <p className="mt-2 text-sm text-surface-500 max-w-md">
            An unexpected error occurred in this section. We have been notified and are looking into it.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-6 text-sm inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
