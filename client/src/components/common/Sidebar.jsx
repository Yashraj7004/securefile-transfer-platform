import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Files,
  UploadCloud,
  Share2,
  Activity,
  User,
  Shield,
  Users,
  HardDrive,
  X
} from 'lucide-react';
import StorageIndicator from './StorageIndicator';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();

  const userNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Files', path: '/files', icon: Files },
    { name: 'Upload File', path: '/upload', icon: UploadCloud },
    { name: 'Shared Files', path: '/shares', icon: Share2 },
    { name: 'Download Activity', path: '/activity', icon: Activity },
    { name: 'Profile & Security', path: '/profile', icon: User }
  ];

  const adminNavItems = [
    { name: 'Admin Dashboard', path: '/admin', icon: Shield, end: true },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'All Stored Files', path: '/admin/files', icon: HardDrive }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col justify-between border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto pt-5 pb-4">
          {/* Header on mobile */}
          <div className="flex items-center justify-between px-6 mb-6 lg:hidden">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <div className="p-1.5 rounded-lg bg-primary-600 text-white">
                <Shield className="w-4 h-4" />
              </div>
              SecureFile
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav groups */}
          <div className="px-4 space-y-6">
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Storage & Sharing
              </p>
              <nav className="space-y-1">
                {userNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose && onClose()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>

            {isAdmin && (
              <div>
                <p className="px-3 text-[11px] font-bold text-purple-600 uppercase tracking-wider mb-2">
                  Administration
                </p>
                <nav className="space-y-1">
                  {adminNavItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      onClick={() => onClose && onClose()}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-purple-50 text-purple-700 shadow-xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.name}
                    </NavLink>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Bottom storage quota block */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <StorageIndicator
            used={user?.storageUsed || 0}
            limit={user?.storageLimit || 5368709120}
            compact={false}
          />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
