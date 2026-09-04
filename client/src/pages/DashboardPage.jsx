import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fileService } from '../services/fileService';
import { useToast } from '../context/ToastContext';
import StorageIndicator from '../components/common/StorageIndicator';
import UploadBox from '../components/files/UploadBox';
import FileTable from '../components/files/FileTable';
import ShareModal from '../components/files/ShareModal';
import FileDetailsModal from '../components/files/FileDetailsModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import {
  Files,
  HardDrive,
  Download,
  Share2,
  Activity,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';

const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const DashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentUploads, setRecentUploads] = useState([]);
  const [recentDownloads, setRecentDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [selectedFileForShare, setSelectedFileForShare] = useState(null);
  const [selectedFileForDetails, setSelectedFileForDetails] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        fileService.getDashboardStats(),
        fileService.getDashboardActivity()
      ]);

      setStats(statsRes.data);
      setRecentUploads(activityRes.data.recentUploads || []);
      setRecentDownloads(activityRes.data.recentDownloads || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDownload = async (file) => {
    try {
      await fileService.downloadFile(file._id, file.originalName);
      toast.success(`Downloading ${file.originalName}`);
      fetchDashboardData();
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await fileService.deleteFile(fileToDelete._id);
      toast.success('File deleted successfully');
      setFileToDelete(null);
      await refreshUser();
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard analytics..." />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Files',
      value: stats?.totalFiles || 0,
      icon: Files,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    {
      label: 'Storage Used',
      value: formatBytes(stats?.storageUsed || 0),
      icon: HardDrive,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100'
    },
    {
      label: 'Total Downloads',
      value: stats?.totalDownloads || 0,
      icon: Download,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    {
      label: 'Active Shares',
      value: stats?.activeShares || 0,
      icon: Share2,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Here is what&apos;s happening with your encrypted files and share links today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/upload">
            <Button variant="primary" size="sm">
              Upload New File
            </Button>
          </Link>
          <Link to="/files">
            <Button variant="outline" size="sm">
              Browse All Files
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {card.label}
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{card.value}</h3>
            </div>
            <div className={`p-3 rounded-2xl ${card.bg} ${card.color} ${card.border} border`}>
              <card.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Split: Dropzone & Storage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UploadBox onUploadSuccess={fetchDashboardData} />
        </div>
        <div className="space-y-6">
          <StorageIndicator
            used={stats?.storageUsed || 0}
            limit={stats?.storageLimit || 5368709120}
            compact={false}
          />

          {/* Quick Tips */}
          <div className="p-5 bg-gradient-to-br from-primary-900 to-indigo-950 text-white rounded-2xl shadow-md space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-primary-300 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-primary-400" />
              Security Best Practices
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When sharing sensitive documents with external parties, set an expiration window
              (e.g., 24 hours) or a 1-time download limit to prevent link forwarding.
            </p>
            <Link to="/shares" className="inline-block text-xs font-semibold text-primary-300 hover:text-white transition">
              Manage Active Links →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Uploads Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Uploads</h3>
            <p className="text-xs text-slate-500">Your latest encrypted documents and files</p>
          </div>
          <Link
            to="/files"
            className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1"
          >
            View All Files
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentUploads.length > 0 ? (
          <FileTable
            files={recentUploads}
            onDownload={handleDownload}
            onShare={(file) => setSelectedFileForShare(file)}
            onDetails={(file) => setSelectedFileForDetails(file)}
            onDelete={(file) => setFileToDelete(file)}
          />
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            No files uploaded yet. Drag and drop a file above!
          </div>
        )}
      </div>

      {/* Recent Download Activity */}
      {recentDownloads.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Download Activity</h3>
              <p className="text-xs text-slate-500">Audit logs of downloads on your files</p>
            </div>
            <Link
              to="/activity"
              className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1"
            >
              Full Activity Log
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentDownloads.slice(0, 5).map((log) => (
              <div key={log._id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">
                      {log.file?.originalName || 'Deleted File'}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      IP: {log.ipAddress} • {log.user?.email ? log.user.email : 'Public Recipient'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(log.downloadedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ShareModal
        isOpen={Boolean(selectedFileForShare)}
        onClose={() => setSelectedFileForShare(null)}
        file={selectedFileForShare}
      />

      <FileDetailsModal
        isOpen={Boolean(selectedFileForDetails)}
        onClose={() => setSelectedFileForDetails(null)}
        file={selectedFileForDetails}
        onDownload={handleDownload}
      />

      <ConfirmDialog
        isOpen={Boolean(fileToDelete)}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Encrypted File"
        message={`Are you sure you want to permanently delete "${fileToDelete?.originalName}"? This will reclaim your storage and revoke any active share links.`}
      />
    </div>
  );
};

export default DashboardPage;
