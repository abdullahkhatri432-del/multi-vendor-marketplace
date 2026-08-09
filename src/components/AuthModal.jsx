import { useState, useRef, useEffect } from 'react';
import { X, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onAuthSuccess }) {
  const { login, loginWithGoogle, register, registerWithPhone, verifyPhoneCode, createUserAccount } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState('input'); // 'input' | 'phone-otp'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const recaptchaRef = useRef(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setStep('input');
      setShowPassword(false);
      setError('');
      setLoading(false);
      setConfirmationResult(null);
      setPhoneNumber('');
      setOtp('');
    }
  }, [isOpen, initialMode]);

  // Auto-detect email vs phone on input change
  const [form, setForm] = useState({
    emailOrPhone: '',
    password: '',
    displayName: '',
    role: 'customer',
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        emailOrPhone: '',
        password: '',
        displayName: '',
        role: 'customer',
      });
    }
  }, [isOpen]);

  const isPhoneNumber = (value) => {
    // Basic phone number detection - starts with + or has 10-15 digits
    return value.startsWith('+') || (value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 15);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const value = form.emailOrPhone.trim();
    if (!value) {
      setError('Please enter your email or phone number.');
      return;
    }

    if (mode === 'login') {
      if (isPhoneNumber(value)) {
        // Phone login flow
        await handlePhoneLogin(value);
      } else {
        // Email login
        await handleEmailLogin(value);
      }
    } else {
      if (isPhoneNumber(value)) {
        // Phone registration flow
        await handlePhoneRegistration(value);
      } else {
        // Email registration
        await handleEmailRegistration(value);
      }
    }
  };

  const handleEmailLogin = async (email) => {
    if (!form.password) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, form.password);
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (phone) => {
    setLoading(true);
    try {
      const appVerifier = new RecaptchaVerifier('recaptcha-container', { size: 'invisible' }, auth);
      const confirmation = await registerWithPhone(phone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('phone-otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegistration = async (email) => {
    if (!form.displayName) {
      setError('Please enter your full name.');
      return;
    }
    if (!form.password) {
      setError('Please enter a password.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(email, form.password, form.displayName, form.role);
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneRegistration = async (phone) => {
    if (!form.displayName) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);
    try {
      const appVerifier = new RecaptchaVerifier('recaptcha-container', { size: 'invisible' }, auth);
      const confirmation = await registerWithPhone(phone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('phone-otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const user = await verifyPhoneCode(confirmationResult, otp);
      // Create Firestore document for phone auth users
      await createUserAccount(user, form.displayName, form.role);
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      setError('Google authentication failed. Please try again.');
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md animate-fade-in">
        <div id="recaptcha-container" className="hidden"></div>
        <div className="card m-4 p-8">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-surface-400 hover:text-surface-600"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-display font-bold text-surface-900">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-1 text-sm text-surface-500">
              {mode === 'login'
                ? 'Sign in to continue to Speedersmania'
                : 'Join Speedersmania and start your journey'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {step === 'input' && (
            <>
              {mode === 'register' && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { value: 'customer', label: 'Customer', desc: 'I want to shop' },
                      { value: 'vendor', label: 'Vendor', desc: 'I want to sell' },
                    ].map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setForm({ ...form, role: role.value })}
                        className={`rounded-xl border-2 p-4 text-center text-sm font-semibold transition-all ${
                          form.role === role.value
                            ? 'border-primary-500 bg-primary-50 text-primary-900'
                            : 'border-surface-200 text-surface-700 hover:border-surface-300'
                        }`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                      <input
                        name="displayName"
                        value={form.displayName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="input-field pl-10"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">
                    Email or Phone Number
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                    <input
                      name="emailOrPhone"
                      value={form.emailOrPhone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567 or you@example.com"
                      className="input-field pl-10"
                      required
                    />
                  </div>
                </div>

                {mode === 'login' && (
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        className="input-field pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading
                    ? mode === 'login'
                      ? 'Signing in...'
                      : 'Creating account...'
                    : mode === 'login'
                    ? 'Sign In'
                    : 'Create Account'}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-surface-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-surface-50 px-3 text-surface-400">or continue with</span>
                  </div>
                </div>

                <button onClick={handleGoogle} className="btn-secondary w-full mt-4">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-surface-500">
                {mode === 'login'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <button
                  onClick={switchMode}
                  className="font-semibold text-primary-600 hover:text-primary-700"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </>
          )}

          {step === 'phone-otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Enter OTP sent to {phoneNumber || form.emailOrPhone}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  className="input-field text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                type="button"
                onClick={() => setStep('input')}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(code) {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password is too weak.';
    case 'auth/invalid-phone-number':
      return 'Invalid phone number format.';
    case 'auth/missing-phone-number':
      return 'Please enter a phone number.';
    case 'auth/code-expired':
      return 'The verification code has expired. Please request a new one.';
    case 'auth/invalid-verification-code':
      return 'Invalid verification code.';
    default:
      return 'Authentication failed. Please try again.';
  }
}
