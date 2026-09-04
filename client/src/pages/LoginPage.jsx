import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import { Mail, Lock, LogIn, Key } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully!');
      navigate(from, { replace: true });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestCredentials = (role) => {
    if (role === 'admin') {
      setEmail('admin@securefile.local');
      setPassword('Admin@12345');
    } else {
      setEmail('user@securefile.local');
      setPassword('User@12345');
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your credentials to access your secure encrypted files
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
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
              placeholder="you@example.com"
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Password
          </label>
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

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={isLoading}
          icon={LogIn}
        >
          Sign In to Account
        </Button>
      </form>

      {/* Quick demo credentials helper */}
      <div className="mt-6 pt-5 border-t border-slate-150">
        <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-2.5">
          Quick Demo Autofill
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillTestCredentials('admin')}
            className="p-2 text-xs font-medium rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition flex items-center justify-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5" />
            Admin Demo
          </button>
          <button
            type="button"
            onClick={() => fillTestCredentials('user')}
            className="p-2 text-xs font-medium rounded-xl border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 transition flex items-center justify-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5" />
            User Demo
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        Don&apos;t have an account yet?{' '}
        <Link to="/register" className="font-semibold text-primary-600 hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
