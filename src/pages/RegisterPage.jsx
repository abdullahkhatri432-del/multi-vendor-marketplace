import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
<<<<<<< Updated upstream
import { Store, AlertCircle, Mail } from 'lucide-react';
import AuthModal from '../components/AuthModal';
=======
import { Store, AlertCircle, ArrowRight, Shield, Sparkles, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
>>>>>>> Stashed changes

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

<<<<<<< Updated upstream
=======
  const formatPhoneInput = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) return `+91 ${digits}`;
    if (digits.length <= 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneInput(e.target.value);
    setPhoneNumber(formatted);
  };

  const isValidPhone = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.length === 10;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidPhone()) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }
    setShowModal(true);
  };

>>>>>>> Stashed changes
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-accent shadow-glow transition-all duration-300 group-hover:shadow-glow-lg group-hover:scale-105">
              <Store className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-gradient">Speedersmania</span>
          </Link>
<<<<<<< Updated upstream
          <h1 className="text-2xl font-display font-bold text-surface-900">Create your account</h1>
          <p className="mt-2 text-sm text-surface-500">Join Speedersmania with your email</p>
=======
          <h1 className="text-3xl font-display font-bold text-surface-900">Create your account</h1>
          <p className="mt-2 text-surface-500">Join Speedersmania with your Indian phone number</p>
>>>>>>> Stashed changes
        </div>

        {/* Card */}
        <div className="card p-8">
          {error && (
            <div className="mb-5 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-center gap-2 animate-shake">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

<<<<<<< Updated upstream
          <div className="space-y-4">
            <p className="text-sm text-surface-500 text-center">
              Choose between Customer or Vendor and create your account
            </p>

            <button
              onClick={() => { setError(''); setShowModal(true); }}
              className="btn-primary w-full py-3"
            >
              <Mail className="h-4 w-4 mr-2" />
              Create Account
            </button>
=======
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Phone Number (+91)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 font-semibold text-lg">+91</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="Enter 10-digit number"
                  className="input-field pl-14 py-3.5 text-lg"
                  required
                  maxLength={14}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3.5 text-base">
              <ArrowRight className="h-5 w-5" />
              Get OTP & Create Account
            </button>
          </form>

          {/* Benefits */}
          <div className="mt-6 pt-6 border-t border-surface-100">
            <p className="text-xs font-medium text-surface-500 mb-3 text-center">What you get:</p>
            <div className="space-y-2">
              {['Browse thousands of products', 'Track your orders in real-time', 'Save items to your wishlist'].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-xs text-surface-600">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-100">
                    <Check className="h-2.5 w-2.5 text-primary-600" />
                  </div>
                  {benefit}
                </div>
              ))}
            </div>
>>>>>>> Stashed changes
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-surface-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">Sign in</Link>
        </p>
      </div>

      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialMode="register"
        onAuthSuccess={() => navigate('/')}
      />
    </div>
  );
}
