import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertCircle, ArrowRight, Mail, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onAuthSuccess }) {
<<<<<<< Updated upstream
  const { loginWithEmail, registerWithEmail, resetPassword } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot'
=======
  const { loginWithPhone, registerWithPhone, verifyPhoneCode, createUserAccount } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  const handleSubmit = async (e) => {
=======
  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  const formatPhoneInput = (value) => {
    // Format as +91 XXXXX XXXXX (10 digits total)
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) return `+91 ${digits}`;
    if (digits.length <= 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneInput(e.target.value);
    setPhoneNumber(formatted);
    setError('');
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
  };

  const getFullPhoneNumber = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    // Always use +91 for India
    return `+91${digits}`;
  };

  const isValidPhone = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.length === 10;
  };

  const handleSendOtp = async () => {
    if (!isValidPhone()) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Ensure recaptcha container exists
      if (!document.getElementById('auth-recaptcha')) {
        const div = document.createElement('div');
        div.id = 'auth-recaptcha';
        div.style.display = 'none';
        document.body.appendChild(div);
      }

      const appVerifier = new RecaptchaVerifier(auth, 'auth-recaptcha', {
        size: 'invisible',
      });

      const fullPhone = getFullPhoneNumber();
      
      let confirmation;
      if (mode === 'login') {
        confirmation = await loginWithPhone(fullPhone, appVerifier);
      } else {
        confirmation = await registerWithPhone(fullPhone, appVerifier);
      }
      
      setConfirmationResult(confirmation);
      setStep('otp');
      setResendTimer(60);
    } catch (err) {
      console.error('OTP send error:', err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    await handleSendOtp();
  };

  const handleVerifyOtp = async (e) => {
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
                  {/* Full Name */}
                  <div className="mb-4">
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
                </>
              )}

              {/* Phone Number Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">
                    Phone Number (+91)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 font-medium text-lg">+91</span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="Enter 10-digit number"
                      className="input-field pl-14"
                      required
                      autoComplete="tel"
                      maxLength={15} // +91 + space + 5 + space + 5 = 14 chars
                    />
                  </div>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
              </>
            )}
          </p>
=======
              </p>
            </>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-sm text-surface-600">Enter the 6-digit code sent to</p>
                <p className="font-medium text-surface-900">{getFullPhoneNumber()}</p>
              </div>
              <div>
                <label className="sr-only">OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="000000"
                  className="input-field text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <div className="text-center text-sm text-surface-500">
                Didn't receive the code?{' '}
                <button
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  className="text-primary-600 hover:underline disabled:text-surface-400 disabled:cursor-not-allowed font-medium"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-sm text-primary-600 hover:text-primary-700 transition-colors mt-2"
              >
                Change phone number
              </button>
            </form>
          )}
>>>>>>> Stashed changes
        </div>
      </div>
    </div>,
    document.body
  );
}

function getErrorMessage(code) {
  switch (code) {
<<<<<<< Updated upstream
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
=======
    case 'auth/invalid-phone-number':
      return 'Invalid phone number format. Please enter a 10-digit Indian number.';
    case 'auth/missing-phone-number':
      return 'Please enter a phone number.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded. Please try again later.';
    case 'auth/captcha-check-failed':
      return 'Security check failed. Please try again.';
    case 'auth/code-expired':
      return 'The verification code has expired. Please request a new one.';
    case 'auth/invalid-verification-code':
      return 'Invalid verification code. Please try again.';
>>>>>>> Stashed changes
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