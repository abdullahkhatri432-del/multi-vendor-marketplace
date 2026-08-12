<<<<<<< Updated upstream
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, CheckCircle, AlertCircle, Mail, Lock, User as UserIcon, ArrowLeft } from 'lucide-react';
=======
import { useState, useRef, useEffect } from 'react';
import { X, Phone, Loader2, CheckCircle, AlertCircle, ArrowRight, Smartphone } from 'lucide-react';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../config/firebase';
>>>>>>> Stashed changes
import { useAuth } from '../context/AuthContext';

export default function LazyAuthModal({
  isOpen,
  onClose,
  onSuccess,
  triggerAction,
}) {
<<<<<<< Updated upstream
  const { loginWithEmail, registerWithEmail, resetPassword } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
=======
  const { registerWithPhone, verifyPhoneCode, createUserAccount, loginWithPhone } = useAuth();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'success'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
>>>>>>> Stashed changes
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setEmail('');
      setPassword('');
      setDisplayName('');
      setError('');
      setLoading(false);
      setMode('login');
      setResetSent(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'forgot') {
      await handleForgotSubmit(e);
      return;
    }

<<<<<<< Updated upstream
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
=======
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
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
      const appVerifier = new RecaptchaVerifier(auth, 'lazy-auth-recaptcha', {
        size: 'invisible',
      });

      const confirmation = await registerWithPhone(getFullPhoneNumber(), appVerifier);
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
    setResendTimer(60);
    await handleSendOtp();
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await verifyPhoneCode(confirmationResult, otp);

      // Create user account in Firestore
      await createUserAccount(user, `User ${user.phoneNumber?.slice(-4) || ''}`, 'customer');

>>>>>>> Stashed changes
      setStep('success');

      setTimeout(() => {
        onSuccess?.(user);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('OTP verify error:', err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'success') return;
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

  const renderFormStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 mx-auto mb-4">
          <Mail className="h-7 w-7 text-primary-600" />
        </div>
        <h2 className="text-xl font-display font-bold text-surface-900">
          {mode === 'login' ? 'Sign In' : mode === 'forgot' ? 'Forgot Password' : 'Create Account'}
        </h2>
        <p className="mt-2 text-sm text-surface-500">
          {mode === 'login'
            ? 'Sign in to complete your purchase'
            : mode === 'forgot'
              ? 'Enter your email and we will send you a reset link'
              : 'Create an account to continue'}
        </p>
      </div>

<<<<<<< Updated upstream
      {mode === 'forgot' && !resetSent && (
        <form onSubmit={handleSubmit} className="space-y-4">
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
=======
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 font-medium text-lg">+91</span>
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder="Enter 10-digit number"
          className="input-field pl-14"
          disabled={loading}
          maxLength={14}
        />
      </div>
>>>>>>> Stashed changes

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
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      )}

      {mode === 'forgot' && resetSent && (
        <div className="text-center space-y-4 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-display font-bold text-surface-900">Check your email</h3>
          <p className="text-sm text-surface-500">
            We sent a password reset link to{' '}
            <span className="font-semibold text-surface-700">{email}</span>. Please check your inbox
            (and spam folder).
          </p>
        </div>
      )}

      {mode !== 'forgot' && (
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

      <p className="text-center text-sm text-surface-500">
        {mode === 'forgot' ? (
          <button
            onClick={goToLogin}
            className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </button>
        ) : (
          <>
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
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
    default:
      return 'Authentication failed. Please try again.';
  }
}