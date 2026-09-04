import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import {
  Users,
  HardDrive,
  Download,
  Share2,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  Server,
  Activity
} from 'lucide-react';

const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getSystemStats();
        setStats(res.data);
      } catch (err) {
        toast.error('Failed to load system statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" text="Loading administrative statistics..." />
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Registered Users',
      value: stats?.totalUsers || 0,
      subtext: `${stats?.activeUsers || 0} active accounts`,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100'
    },
    {
      label: 'System Storage Consumed',
      value: formatBytes(stats?.totalStorageUsed || 0),
      subtext: 'Encrypted with AES-256-CBC',
      icon: HardDrive,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100'
    },
    {
      label: 'Total Files Stored',
      value: stats?.totalFiles || 0,
      subtext: 'Across all user repositories',
      icon: Server,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    {
      label: 'Platform Download Events',
      value: stats?.totalDownloads || 0,
      subtext: `${stats?.activeShares || 0} active public links`,
      icon: Download,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-purple-100 text-purple-700">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              Administration Center
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor platform usage, review registered users, and enforce platform storage policies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/users">
            <Button variant="outline" size="sm" icon={Users}>
              Manage Users
            </Button>
          </Link>
          <Link to="/admin/files">
            <Button variant="primary" size="sm" icon={HardDrive}>
              Manage All Files
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => (
          <div
            key={i}
            className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {c.label}
              </span>
              <div className={`p-2.5 rounded-xl ${c.bg} ${c.color} ${c.border} border`}>
                <c.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">{c.value}</h3>
              <p className="text-[11px] text-slate-400 mt-1">{c.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/admin/users"
          className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-purple-300 hover:shadow-md transition group flex items-start gap-4"
        >
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition flex items-center justify-between">
              User Directory & Permissions
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              View all registered users, toggle active/disabled states, inspect individual storage
              consumption, or elevate users to administrators.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/files"
          className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-purple-300 hover:shadow-md transition group flex items-start gap-4"
        >
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition-transform">
            <HardDrive className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition flex items-center justify-between">
              Global File Explorer
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Audit all files stored in the platform, identify large files, and remove
              inappropriate or policy-violating uploads.
            </p>
          </div>
        </Link>
      </div>

      {/* System Health Status */}
      <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h4 className="text-xs font-bold text-slate-800">System Status: Operational</h4>
            <p className="text-[11px] text-slate-400">
              API routes, cipher streaming services, and MongoDB metadata indexes are active
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-lg">
          Node v24.19 / Express
        </span>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
