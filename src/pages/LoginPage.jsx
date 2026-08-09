import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, AlertCircle, Smartphone, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { loginWithPhone } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showModal, setShowModal] = useState(true);
  const [error, setError] = useState('');

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

  const getFullPhoneNumber = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    return `+91${digits}`;
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
    // Trigger the auth modal with login mode
    setShowModal(true);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent shadow-glow">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-gradient">Speedersmania</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-surface-900">Welcome back</h1>
          <p className="mt-2 text-sm text-surface-500">Sign in with your Indian phone number to continue</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Phone Number (+91)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 font-medium text-lg">+91</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="Enter 10-digit number"
                  className="input-field pl-14"
                  required
                  maxLength={14}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3">
              <ArrowRight className="h-4 w-4 mr-2" />
              Get OTP & Sign In
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-surface-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">Sign up</Link>
        </p>
      </div>
    </div>
  );
}