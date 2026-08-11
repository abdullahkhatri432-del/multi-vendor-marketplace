import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertCircle, ArrowRight, Mail, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onAuthSuccess }) {
  const { loginWithEmail, registerWithEmail, resetPassword } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('customer');
  const [resetSent, setResetSent] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setLoading(false);
      setEmail('');
      setPassword('');
      setDisplayName('');
      setRole('customer');
      setResetSent(false);
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'forgot') {
      await handleForgotSubmit(e);
      return;
    }

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
        user = await registerWithEmail(email.trim(), password, displayName.trim(), role);
      }
      onAuthSuccess?.(user);
      onClose();
    } catch (err) {
      console.error('Auth error:', err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleForgotSubmit = async (e) => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(email.trim());
      setResetSent(true);
    } catch (err) {
      console.error('Reset error:', err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const goToForgot = () => {
    setMode('forgot');
    setError('');
    setResetSent(false);
  };

  const goToLogin = () => {
    setMode('login');
    setError('');
    setResetSent(false);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md">
        {/* Modal Content Box */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-scale-in max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-surface-400 hover:text-surface-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-accent mx-auto mb-4 shadow-lg">
              <Mail className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl font-display font-bold text-surface-900">
              {mode === 'login' ? 'Welcome back' : mode === 'forgot' ? 'Forgot password' : 'Create your account'}
            </h2>
            <p className="mt-1 text-sm text-surface-500">
              {mode === 'login'
                ? 'Sign in to continue to Speedersmania'
                : mode === 'forgot'
                  ? 'Enter your email and we will send you a reset link'
                  : 'Join Speedersmania and start your journey'}
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 animate-shake">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {mode === 'register' && (
            <>
              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { value: 'customer', label: 'Customer', desc: 'I want to shop', icon: '🛍️' },
                  { value: 'vendor', label: 'Vendor', desc: 'I want to sell', icon: '🏪' },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                      role === r.value
                        ? 'border-primary-500 bg-primary-50 text-primary-900 shadow-md'
                        : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{r.icon}</span>
                      <p className="text-sm font-semibold">{r.label}</p>
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5">{r.desc}</p>
                    {role === r.value && (
                      <div className="absolute inset-0 border-2 border-primary-500 rounded-xl pointer-events-none" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {mode === 'forgot' && !resetSent && (
            <div className="space-y-4">
              <p className="text-sm text-surface-500">
                No worries — enter your account email and we will send you a link to reset your password.
              </p>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                    className="input-field pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Send Reset Link
              </button>
            </div>
          )}

          {mode === 'forgot' && resetSent && (
            <div className="text-center space-y-4 py-6 animate-scale-in">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-display font-bold text-surface-900">Check your email</h3>
              <p className="text-sm text-surface-500">
                We sent a password reset link to{' '}
                <span className="font-semibold text-surface-700">{email}</span>. Please check your
                inbox (and spam folder).
              </p>
            </div>
          )}

          {mode !== 'forgot' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                  className="input-field"
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="At least 6 characters"
                  className="input-field pl-10"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={6}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          )}

          {mode === 'login' && (
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={goToForgot}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-surface-500">
            {mode === 'forgot' ? (
              <>
                Remembered your password?{' '}
                <button
                  onClick={goToLogin}
                  className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={switchMode}
                  className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </>
            )}
          </p>
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
    case 'auth/invalid-action-code':
      return 'This reset link is invalid or has expired. Please request a new one.';
    case 'auth/missing-email':
      return 'Please enter your email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Please contact support.';
    default:
      return 'Authentication failed. Please try again.';
  }
}