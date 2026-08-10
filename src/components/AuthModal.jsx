import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, Loader2, CheckCircle, AlertCircle, ArrowRight, Smartphone } from 'lucide-react';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onAuthSuccess }) {
  const { loginWithPhone, registerWithPhone, verifyPhoneCode, createUserAccount } = useAuth();
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
  const appVerifierRef = useRef(null);

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
    } else {
      appVerifierRef.current = null;
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
    // Format as XXXXX XXXXX (10 digits total); the +91 prefix is shown via the fixed label
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) return digits;
    if (digits.length <= 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
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
      // Reuse the same verifier instance — creating a new one on the same
      // container each time throws "reCAPTCHA has already been rendered".
      // Container must NOT be display:none — invisible reCAPTCHA can't render
      // into a hidden element and signInWithPhoneNumber would hang forever.
      if (!appVerifierRef.current) {
        let container = document.getElementById('auth-recaptcha');
        if (!container) {
          container = document.createElement('div');
          container.id = 'auth-recaptcha';
          container.style.position = 'fixed';
          container.style.bottom = '0';
          container.style.left = '0';
          container.style.width = '60px';
          container.style.height = '60px';
          container.style.opacity = '0';
          container.style.pointerEvents = 'none';
          container.style.zIndex = '-1';
          document.body.appendChild(container);
        }
        appVerifierRef.current = new RecaptchaVerifier(auth, 'auth-recaptcha', {
          size: 'invisible',
        });
      }
      const appVerifier = appVerifierRef.current;

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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md">
        {/* Modal Content Box */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-scale-in max-h-[90vh] overflow-y-auto">
          <div id="auth-recaptcha" style={{ position: 'fixed', bottom: 0, left: 0, width: 60, height: 60, opacity: 0, pointerEvents: 'none', zIndex: -1 }} />
          
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
            </>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-sm text-surface-600">Enter the 6-digit code sent to</p>
                <p className="font-medium text-surface-900">+91 {phoneNumber}</p>
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
    </div>,
    document.body
  );
}

function getErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-phone-number':
      return 'Invalid phone number format.';
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