import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { User, Mail, Shield, Edit2, Phone, Smartphone } from 'lucide-react';
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
      <h1 className="text-3xl font-display font-bold text-surface-900 mb-8">Profile</h1>

      <div className="card p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-accent text-white text-2xl font-bold">
            {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-surface-900">{user?.displayName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge-primary capitalize">{profile?.role || 'customer'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-surface-50 p-4">
            <Smartphone className="h-5 w-5 text-surface-400" />
            <div>
              <p className="text-xs text-surface-500">Phone Number</p>
              <p className="text-sm font-medium text-surface-900">{user?.phoneNumber || 'Not set'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-surface-50 p-4">
            <Mail className="h-5 w-5 text-surface-400" />
            <div>
              <p className="text-xs text-surface-500">Email</p>
              <p className="text-sm font-medium text-surface-900">{user?.email || 'Not set'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-surface-50 p-4">
            <Shield className="h-5 w-5 text-surface-400" />
            <div>
              <p className="text-xs text-surface-500">Role</p>
              <p className="text-sm font-medium text-surface-900 capitalize">{profile?.role || 'customer'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-surface-50 p-4">
            <User className="h-5 w-5 text-surface-400" />
            <div className="flex-1">
              <p className="text-xs text-surface-500">Display Name</p>
              {editing ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-field py-1.5 text-sm"
                  />
                  <button onClick={handleSave} className="btn-primary py-1.5 text-xs">Save</button>
                  <button onClick={() => setEditing(false)} className="btn-ghost py-1.5 text-xs">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-surface-900">{user?.displayName}</p>
                  <button onClick={() => setEditing(true)} className="text-surface-400 hover:text-primary-600">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
