import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import { User, Mail, Lock, UserPlus, Check, X } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conflictError, setConflictError] = useState(false);
  const { register, isAuthenticated, user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Password rules validation
  const rules = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) }
  ];

  const allRulesMet = rules.every((r) => r.met);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConflictError(false);

    if (!name || !email || !password || !confirmPassword) {
      toast.warning('Please fill in all required fields');
      return;
    }

    if (!allRulesMet) {
      toast.warning('Please ensure password meets all security criteria');
      return;
    }

    if (!passwordsMatch) {
      toast.warning('Passwords do not match');
      return;
    }

    // If already logged in, log out existing session before creating new account
    if (isAuthenticated) {
      logout();
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password, confirmPassword);
      toast.success('Account created successfully! Welcome to SecureFile.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictError(true);
      }
      const errorMsg =
        err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillExampleAccount = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setName(`User ${randomNum}`);
    setEmail(`user_${randomNum}@example.com`);
    setPassword('SecurePass@123');
    setConfirmPassword('SecurePass@123');
    setConflictError(false);
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h2>
        <p className="mt-1 text-xs text-slate-500">
          Get started with 5 GB free encrypted cloud storage
        </p>
      </div>

      {isAuthenticated && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between gap-2">
          <span>Signed in as <strong>{user?.email}</strong>.</span>
          <button
            type="button"
            onClick={logout}
            className="text-blue-700 underline font-semibold text-xs"
          >
            Sign out
          </button>
        </div>
      )}

      {conflictError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-2">
          <span>Account <strong>{email}</strong> already exists.</span>
          <button
            type="button"
            onClick={() => navigate('/login', { state: { prefilledEmail: email } })}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition"
          >
            Log In
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alice Smith"
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@example.com"
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
            />
          </div>
        </div>

        {/* Password Strength Checklist */}
        {password && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-[11px]">
            {rules.map((rule, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 ${
                  rule.met ? 'text-emerald-700 font-medium' : 'text-slate-400'
                }`}
              >
                {rule.met ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                <span>{rule.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={isLoading}
          icon={UserPlus}
        >
          Create Free Account
        </Button>

        <button
          type="button"
          onClick={fillExampleAccount}
          className="w-full mt-2 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition flex items-center justify-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5 text-slate-500" />
          Auto-fill New Account Info
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-primary-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
