import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Menu,
  Upload,
  User as UserIcon,
  LogOut,
  ChevronDown,
  ShieldAlert,
  Settings
} from 'lucide-react';
import Button from './Button';
import Badge from './Badge';

const Navbar = ({ onMenuClick }) => {
  const { user, logout, isAdmin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-6 lg:px-8">
      {/* Left side: Hamburger & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-slate-900 text-base tracking-tight">
              SecureFile
            </span>
            <span className="text-primary-600 text-xs font-semibold ml-1.5 px-1.5 py-0.5 rounded bg-primary-50 border border-primary-200/60">
              AES-256
            </span>
          </div>
        </Link>
      </div>

      {/* Right side: Quick Upload & User Profile */}
      <div className="flex items-center gap-3">
        <Link to="/upload" className="hidden sm:inline-flex">
          <Button variant="primary" size="sm" icon={Upload}>
            Upload File
          </Button>
        </Link>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm border border-primary-200">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block text-left mr-1">
              <p className="text-xs font-semibold text-slate-800 leading-none">
                {user?.name || 'User'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-[120px] truncate">
                {user?.email}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-400">Signed in as</p>
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user?.name}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant={isAdmin ? 'purple' : 'primary'} size="sm">
                    {isAdmin ? 'Administrator' : 'Standard User'}
                  </Badge>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  My Profile & Quota
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-primary-700 hover:bg-primary-50 transition"
                  >
                    <ShieldAlert className="w-4 h-4 text-primary-600" />
                    Admin Control Center
                  </Link>
                )}
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition text-left"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
