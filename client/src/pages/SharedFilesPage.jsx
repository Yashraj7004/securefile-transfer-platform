import React, { useState, useEffect } from 'react';
import { shareService } from '../services/shareService';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FileIcon from '../components/files/FileIcon';
import {
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Lock,
  Calendar,
  Download,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const SharedFilesPage = () => {
  const [shares, setShares] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState(null);
  const [shareToDelete, setShareToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  const fetchShares = async () => {
    setIsLoading(true);
    try {
      const res = await shareService.getUserShares();
      setShares(res.data || []);
    } catch (err) {
      toast.error('Failed to load shared files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  const handleCopy = (token) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    toast.success('Share link copied to clipboard!');
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleToggleStatus = async (share) => {
    try {
      const newStatus = !share.isActive;
      await shareService.updateShare(share._id, { isActive: newStatus });
      toast.success(newStatus ? 'Share link activated' : 'Share link disabled');
      setShares((prev) =>
        prev.map((s) => (s._id === share._id ? { ...s, isActive: newStatus } : s))
      );
    } catch (err) {
      toast.error('Failed to update share status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!shareToDelete) return;
    setIsDeleting(true);
    try {
      await shareService.deleteShare(shareToDelete._id);
      toast.success('Share link revoked successfully');
      setShareToDelete(null);
      setShares((prev) => prev.filter((s) => s._id !== shareToDelete._id));
    } catch (err) {
      toast.error('Failed to delete share link');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" text="Loading your share links..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shared Files</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your public transfer links, security passphrases, download limits, and expirations
        </p>
      </div>

      {shares.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 tracking-wider">
              <tr>
                <th scope="col" className="py-3.5 pl-6 pr-3">
                  File
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Share URL
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Security
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Expiration
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Downloads
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Status
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-6 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shares.map((share) => {
                const isExpired = share.expiresAt && new Date() > new Date(share.expiresAt);
                const isLimitReached =
                  share.maxDownloads !== null && share.downloadCount >= share.maxDownloads;

                return (
                  <tr key={share._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* File info */}
                    <td className="py-4 pl-6 pr-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 border border-slate-150 rounded-lg shrink-0">
                          <FileIcon
                            mimeType={share.file?.mimeType}
                            fileName={share.file?.originalName}
                            className="w-5 h-5"
                          />
                        </div>
                        <span
                          className="font-medium text-slate-800 truncate max-w-xs block"
                          title={share.file?.originalName}
                        >
                          {share.file?.originalName || 'Deleted File'}
                        </span>
                      </div>
                    </td>

                    {/* Share URL & Copy button */}
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md max-w-[120px] truncate">
                          /share/{share.token.slice(0, 8)}...
                        </span>
                        <button
                          onClick={() => handleCopy(share.token)}
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                          title="Copy full URL"
                        >
                          {copiedToken === share.token ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={`/share/${share.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          title="Preview public page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>

                    {/* Password protected badge */}
                    <td className="px-3 py-4 whitespace-nowrap">
                      {share.passwordProtected ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-md">
                          <Lock className="w-3 h-3" /> Password
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Public</span>
                      )}
                    </td>

                    {/* Expiration date */}
                    <td className="px-3 py-4 whitespace-nowrap text-xs">
                      {share.expiresAt ? (
                        <span
                          className={isExpired ? 'text-rose-600 font-semibold' : 'text-slate-600'}
                        >
                          {new Date(share.expiresAt).toLocaleDateString()}
                          {isExpired && ' (Expired)'}
                        </span>
                      ) : (
                        <span className="text-slate-400">Never</span>
                      )}
                    </td>

                    {/* Downloads count */}
                    <td className="px-3 py-4 whitespace-nowrap text-xs">
                      <span className={isLimitReached ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                        {share.downloadCount}
                        {share.maxDownloads !== null ? ` / ${share.maxDownloads}` : ' (unlimited)'}
                      </span>
                    </td>

                    {/* Active toggle */}
                    <td className="px-3 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(share)}
                        className="flex items-center gap-1 text-xs font-medium focus:outline-none"
                      >
                        {share.isActive && !isExpired && !isLimitReached ? (
                          <Badge variant="success" size="sm">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            Inactive
                          </Badge>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 pl-3 pr-6 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(share)}
                          title={share.isActive ? 'Disable link' : 'Enable link'}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          {share.isActive ? (
                            <ToggleRight className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        <button
                          onClick={() => setShareToDelete(share)}
                          title="Revoke / Delete share link"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No share links created"
          description="Share any of your files securely by clicking the Share button on the My Files or Dashboard pages."
          actionText="Go to My Files"
          onAction={() => window.location.assign('/files')}
        />
      )}

      {/* Revoke confirmation */}
      <ConfirmDialog
        isOpen={Boolean(shareToDelete)}
        onClose={() => setShareToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Revoke Share Link"
        message={`Are you sure you want to revoke this link for "${shareToDelete?.file?.originalName}"? Recipients will immediately lose download access.`}
        confirmText="Revoke Link"
      />
    </div>
  );
};

export default SharedFilesPage;
