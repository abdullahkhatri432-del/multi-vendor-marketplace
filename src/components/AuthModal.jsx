import { useState, useRef, useEffect } from 'react';
import { X, Phone, Loader2, CheckCircle, AlertCircle, ArrowRight, Smartphone } from 'lucide-react';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onAuthSuccess }) {
  const { loginWithPhone, registerWithPhone, verifyPhoneCode, createUserAccount, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('customer');
  const recaptchaRef = useRef(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setStep('phone');
      setError('');
      setLoading(false);
      setConfirmationResult(null);
      setPhoneNumber('');
      setOtp('');
      setDisplayName('');
      setRole('customer');
      setResendTimer(0);
    }
  }, [isOpen, initialMode]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  const formatPhoneInput = (value) => {
    // Basic phone number formatting
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
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
    // Assume India format if no country code
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length > 10 && !digits.startsWith('91')) return `+${digits}`;
    return `+${digits}`;
  };

  const isValidPhone = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.length >= 10;
  };

  const handleSendOtp = async () => {
    if (!isValidPhone()) {
      setError('Please enter a valid phone number (10 digits)');
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
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await verifyPhoneCode(confirmationResult, otp);
      
      // For registration, create user account with display name
      if (mode === 'register') {
        await createUserAccount(user, displayName, role);
      }
      
      onAuthSuccess?.(user);
      onClose();
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

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setStep('phone');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md">
        {/* Modal Content Box */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-scale-in">
          <div id="auth-recaptcha" className="hidden" />
          
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
              <Smartphone className="h-7 w-7 text-white" />
            </div>
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
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 animate-shake">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 'phone' && (
            <>
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
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="Enter your phone number"
                      className="input-field pl-10"
                      required
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isValidPhone()}
                  className="btn-primary w-full py-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Get OTP
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-surface-500">
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

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-surface-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-surface-400">or continue with</span>
                  </div>
                </div>

                <button onClick={loginWithGoogle} className="btn-secondary w-full mt-4">
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
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-phone-number':
      return 'Invalid phone number format. Please include country code.';
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
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/user-not-found':
      return 'No account found with this phone number. Please sign up.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this phone number. Please sign in.';
    default:
      return 'Authentication failed. Please try again.';
  }
}