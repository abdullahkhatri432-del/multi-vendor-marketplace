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
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneInput(e.target.value);
    setPhoneNumber(formatted);
  };

  const getFullPhoneNumber = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length > 10 && !digits.startsWith('91')) return `+${digits}`;
    return `+${digits}`;
  };

  const isValidPhone = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.length >= 10;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidPhone()) {
      setError('Please enter a valid phone number (10 digits)');
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
          <p className="mt-2 text-sm text-surface-500">Sign in with your phone number to continue</p>
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
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="Enter your phone number"
                  className="input-field pl-10"
                  required
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