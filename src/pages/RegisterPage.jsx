import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, AlertCircle, Smartphone, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

export default function RegisterPage() {
  const { registerWithPhone } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const handleOpenModal = () => {
    setError('');
    setShowModal(true);
  };

  const handleAuthSuccess = () => {
    setShowModal(false);
    navigate('/');
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
          <h1 className="text-2xl font-display font-bold text-surface-900">Create your account</h1>
          <p className="mt-2 text-sm text-surface-500">Join Speedersmania with your Indian phone number</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-surface-500 text-center">
              Enter your phone number to receive a 6-digit OTP for verification
            </p>

            <button 
              onClick={() => { setError(''); setShowModal(true); }}
              className="btn-primary w-full py-3"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Get OTP & Create Account
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-surface-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">Sign in</Link>
        </p>
      </div>

      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialMode="register"
        onAuthSuccess={() => { setShowModal(false); navigate('/'); }}
      />
    </div>
  );
}