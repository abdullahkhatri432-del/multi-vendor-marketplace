import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

const COUNTRY_CODES = [
  { code: '+1', country: 'US/Canada', mask: '(###) ###-####' },
  { code: '+91', country: 'India', mask: '##### #####' },
  { code: '+44', country: 'UK', mask: '#### ######' },
  { code: '+61', country: 'Australia', mask: '#### ### ###' },
  { code: '+81', country: 'Japan', mask: '##-####-####' },
  { code: '+49', country: 'Germany', mask: '## #### ####' },
  { code: '+33', country: 'France', mask: '## ## ## ## ##' },
  { code: '+86', country: 'China', mask: '### #### ####' },
];

export default function LazyAuthModal({
  isOpen,
  onClose,
  onSuccess,
  triggerAction,
  triggerParams,
}) {
  const { registerWithPhone, verifyPhoneCode, createUserAccount, loginWithPhone } = useAuth();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'success'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const appVerifierRef = useRef(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setPhoneNumber('');
      setOtp('');
      setError('');
      setLoading(false);
      setConfirmationResult(null);
      setResendTimer(0);
    } else {
      appVerifierRef.current = null;
    }
  }, [isOpen]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  const formatPhoneInput = (value) => {
    const digits = value.replace(/\D/g, '');
    const mask = COUNTRY_CODES.find(c => c.code === countryCode)?.mask || '##########';
    let formatted = '';
    let digitIndex = 0;
    for (const char of mask) {
      if (char === '#' && digitIndex < digits.length) {
        formatted += digits[digitIndex++];
      } else if (char !== '#') {
        formatted += char;
      }
    }
    return formatted;
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
    return `${countryCode}${digits}`;
  };

  const isValidPhone = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.length >= 10;
  };

  const handleSendOtp = async () => {
    if (!isValidPhone()) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Container must NOT be display:none — invisible reCAPTCHA can't render
      // into a hidden element and signInWithPhoneNumber would hang forever.
      // Reuse the verifier instance to avoid "reCAPTCHA has already been rendered".
      if (!appVerifierRef.current) {
        if (!document.getElementById('lazy-auth-recaptcha')) {
          const div = document.createElement('div');
          div.id = 'lazy-auth-recaptcha';
          div.style.position = 'fixed';
          div.style.bottom = '0';
          div.style.left = '0';
          div.style.width = '60px';
          div.style.height = '60px';
          div.style.opacity = '0';
          div.style.pointerEvents = 'none';
          div.style.zIndex = '-1';
          document.body.appendChild(div);
        }
        appVerifierRef.current = new RecaptchaVerifier(auth, 'lazy-auth-recaptcha', {
          size: 'invisible',
        });
      }
      const appVerifier = appVerifierRef.current;

      const confirmation = await registerWithPhone(getFullPhoneNumber(), appVerifier);
      setConfirmationResult(confirmation);
      setStep('otp');
      setResendTimer(60);
    } catch (err) {
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

      setStep('success');

      // Small delay to show success state
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

  const renderPhoneStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 mx-auto mb-4">
          <Phone className="h-7 w-7 text-primary-600" />
        </div>
        <h2 className="text-xl font-display font-bold text-surface-900">Enter Phone Number</h2>
        <p className="mt-2 text-sm text-surface-500">
          We'll send a 6-digit verification code to authenticate your purchase
        </p>
      </div>

      <div className="relative">
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-surface-700 bg-transparent border-none focus:outline-none z-10 appearance-none cursor-pointer"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} {c.country}
            </option>
          ))}
        </select>
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder="Phone number"
          className="input-field pl-20 pr-10"
          disabled={loading}
          maxLength={20}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleSendOtp}
        disabled={loading || !isValidPhone()}
        className="btn-primary w-full disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Sending...
          </>
        ) : (
          'Send Verification Code'
        )}
      </button>

      <p className="text-center text-xs text-surface-400">
        By continuing, you agree to our{' '}
        <a href="/terms" className="underline hover:text-primary-600">Terms</a>{' '}
        and{' '}
        <a href="/privacy" className="underline hover:text-primary-600">Privacy Policy</a>
      </p>
    </div>
  );

  const renderOtpStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 mx-auto mb-4">
          <Loader2 className="h-7 w-7 text-primary-600 animate-spin" />
        </div>
        <h2 className="text-xl font-display font-bold text-surface-900">Verify Your Number</h2>
        <p className="mt-2 text-sm text-surface-500">
          Enter the 6-digit code sent to <span className="font-medium">{getFullPhoneNumber()}</span>
        </p>
      </div>

      <div className="flex justify-center gap-3">
        {[...Array(6)].map((_, i) => (
          <input
            key={i}
            type="text"
            value={otp[i] || ''}
            onChange={(e) => {
              const vals = otp.split('');
              vals[i] = e.target.value;
              setOtp(vals.join(''));
              if (e.target.value && i < 5) {
                e.target.nextElementSibling?.focus();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !e.target.value && i > 0) {
                e.target.previousElementSibling?.focus();
              }
            }}
            maxLength={1}
            className={`w-10 h-12 text-center text-xl font-semibold rounded-xl border-2 transition-all ${
              otp[i]
                ? 'border-primary-500 bg-primary-50 text-primary-900'
                : 'border-surface-200 focus:border-primary-500 focus:bg-white'
            }`}
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleVerifyOtp}
        disabled={loading || otp.length !== 6}
        className="btn-primary w-full disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Verifying...
          </>
        ) : (
          'Verify & Continue'
        )}
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
        onClick={() => setStep('phone')}
        className="w-full text-sm text-surface-500 hover:text-surface-700"
      >
        Change phone number
      </button>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto">
        <CheckCircle className="h-8 w-8 text-emerald-600" />
      </div>
      <h2 className="text-xl font-display font-bold text-surface-900">Verified Successfully!</h2>
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

          {step === 'phone' && renderPhoneStep()}
          {step === 'otp' && renderOtpStep()}
          {step === 'success' && renderSuccessStep()}
        </div>
      </div>
    </div>,
    document.body
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
    default:
      return 'Verification failed. Please try again.';
  }
}