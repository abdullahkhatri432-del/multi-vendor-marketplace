import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { User, Mail, Shield, Edit2, Smartphone, Check, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUser, updateUser } from '../config/firestore';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (user?.uid) {
          const data = await getUser(user.uid);
          setProfile(data);
        }
        setDisplayName(user?.displayName || '');
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleSave = async () => {
    try {
      await updateUser(user.uid, { displayName });
      setEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  if (authLoading) return <LoadingSpinner size="lg" className="py-32" />;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-primary-600" />
          <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Account</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-surface-900">Profile</h1>
      </div>

      <div className="card p-8">
        {/* Profile Header */}
        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-surface-100">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-accent text-white text-3xl font-bold shadow-glow">
              {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-success border-3 border-white flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-surface-900">{user?.displayName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge-primary capitalize">{profile?.role || 'customer'}</span>
              <span className="text-xs text-surface-400">Member since {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Recently'}</span>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="space-y-4">
          {/* Phone */}
          <div className="flex items-center gap-4 rounded-2xl bg-surface-50 border border-surface-100 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-surface-500 uppercase tracking-wide">Phone Number</p>
              <p className="text-sm font-medium text-surface-900 mt-0.5">{user?.phoneNumber || 'Not set'}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-4 rounded-2xl bg-surface-50 border border-surface-100 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Mail className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-surface-500 uppercase tracking-wide">Email</p>
              <p className="text-sm font-medium text-surface-900 mt-0.5">{user?.email || 'Not set'}</p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center gap-4 rounded-2xl bg-surface-50 border border-surface-100 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-surface-500 uppercase tracking-wide">Role</p>
              <p className="text-sm font-medium text-surface-900 mt-0.5 capitalize">{profile?.role || 'customer'}</p>
            </div>
          </div>

          {/* Display Name */}
          <div className="rounded-2xl bg-surface-50 border border-surface-100 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-surface-500 uppercase tracking-wide">Display Name</p>
                {editing ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="input-field py-2 text-sm flex-1"
                    />
                    <button onClick={handleSave} className="btn-primary py-2 px-3">
                      <Save className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditing(false)} className="btn-ghost py-2 px-3">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-sm font-medium text-surface-900">{user?.displayName}</p>
                    <button onClick={() => setEditing(true)} className="btn-ghost p-1.5 text-surface-400 hover:text-primary-600">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
