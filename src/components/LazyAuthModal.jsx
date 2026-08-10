import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, CheckCircle, AlertCircle, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LazyAuthModal({
  isOpen,
  onClose,
  onSuccess,
  triggerAction,
}) {
  const { loginWithEmail, registerWithEmail } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setEmail('');
      setPassword('');
      setDisplayName('');
      setError('');
      setLoading(false);
      setMode('login');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let user;
      if (mode === 'login') {
        user = await loginWithEmail(email.trim(), password);
      } else {
        if (!displayName.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        user = await registerWithEmail(email.trim(), password, displayName.trim(), 'customer');
      }

      setStep('success');

      setTimeout(() => {
        onSuccess?.(user);
        onClose();
      }, 1000);
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'success') return;
    onClose();
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
  };

  const renderFormStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 mx-auto mb-4">
          <Mail className="h-7 w-7 text-primary-600" />
        </div>
        <h2 className="text-xl font-display font-bold text-surface-900">
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </h2>
        <p className="mt-2 text-sm text-surface-500">
          {mode === 'login'
            ? 'Sign in to complete your purchase'
            : 'Create an account to continue'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Full Name"
              className="input-field pl-10"
              required
              autoComplete="name"
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="Email Address"
            className="input-field pl-10"
            required
            autoComplete="email"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="Password"
            className="input-field pl-10"
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={6}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : mode === 'login' ? (
            'Sign In'
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-surface-500">
        {mode === 'login'
          ? "Don't have an account? "
          : 'Already have an account? '}
        <button
          onClick={switchMode}
          className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          {mode === 'login' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto">
        <CheckCircle className="h-8 w-8 text-emerald-600" />
      </div>
      <h2 className="text-xl font-display font-bold text-surface-900">Success!</h2>
      <p className="text-sm text-surface-500">Redirecting you to complete your purchase...</p>
    </div>
  );

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="card bg-white p-8">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-surface-400 hover:text-surface-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {step === 'form' && renderFormStep()}
          {step === 'success' && renderSuccessStep()}
        </div>
      </div>
    </div>,
    document.body
  );
}

function getErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/missing-password':
      return 'Please enter your password.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-mismatch':
      return 'Incorrect email or password.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Please sign in.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'Authentication failed. Please try again.';
  }
}