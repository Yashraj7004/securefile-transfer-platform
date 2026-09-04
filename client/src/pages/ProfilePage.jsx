import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import StorageIndicator from '../components/common/StorageIndicator';
import Badge from '../components/common/Badge';
import { User, Mail, Lock, Shield, Calendar, KeyRound } from 'lucide-react';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmNewPassword) {
      toast.warning('New passwords do not match');
      return;
    }

    if (newPassword && newPassword.length < 8) {
      toast.warning('New password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await authService.updateProfile({
        name: name.trim(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });

      toast.success('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Security</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal details, credentials, and storage quota
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card & Quota */}
        <div className="space-y-6">
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-primary-500/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>

            <div className="mt-3">
              <Badge variant={user?.role === 'admin' ? 'purple' : 'primary'} size="sm">
                {user?.role === 'admin' ? 'System Administrator' : 'Standard User'}
              </Badge>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
            </div>
          </div>

          <StorageIndicator
            used={user?.storageUsed || 0}
            limit={user?.storageLimit || 5368709120}
            compact={false}
          />
        </div>

        {/* Right Column: Edit Profile & Password Form */}
        <div className="md:col-span-2">
          <div className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Personal Details</h3>
            <p className="text-xs text-slate-500 mb-6">
              Update your account display name or security passphrase
            </p>

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Email address cannot be changed directly
                </p>
              </div>

              <div className="pt-4 border-t border-slate-150">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-primary-600" />
                  Change Password
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Leave blank to keep existing password"
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
