import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { shareService } from '../../services/shareService';
import { useToast } from '../../context/ToastContext';
import { Copy, Check, Lock, Calendar, Download, KeyRound, ExternalLink } from 'lucide-react';
import { getPublicShareUrl } from '../../utils/urlHelper';

const ShareModal = ({ isOpen, onClose, file }) => {
  const [expiration, setExpiration] = useState('7d');
  const [customExpiresAt, setCustomExpiresAt] = useState('');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [maxDownloads, setMaxDownloads] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleReset = () => {
    setExpiration('7d');
    setCustomExpiresAt('');
    setEnablePassword(false);
    setPassword('');
    setMaxDownloads('');
    setGeneratedLink(null);
    setCopied(false);
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  const handleCreateShare = async (e) => {
    e.preventDefault();
    if (!file) return;

    if (enablePassword && (!password || password.length < 4)) {
      toast.warning('Password must be at least 4 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        fileId: file._id,
        expiration,
        customExpiresAt: expiration === 'custom' ? customExpiresAt : null,
        password: enablePassword ? password : null,
        maxDownloads: maxDownloads ? parseInt(maxDownloads, 10) : null
      };

      const res = await shareService.createShare(payload);
      const shareUrl = getPublicShareUrl(res.data.token);
      setGeneratedLink(shareUrl);
      toast.success('Share link generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create share link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={generatedLink ? 'Share Link Ready' : 'Create Shareable Link'}
      maxWidth="max-w-md"
    >
      {!generatedLink ? (
        <form onSubmit={handleCreateShare} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3">
            <div className="flex-1 truncate">
              <p className="text-xs text-slate-400">Sharing file</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{file?.originalName}</p>
            </div>
          </div>

          {/* Expiration Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Link Expiration
            </label>
            <select
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
              className="w-full text-xs bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="1h">1 Hour</option>
              <option value="1d">24 Hours</option>
              <option value="7d">7 Days (Default)</option>
              <option value="30d">30 Days</option>
              <option value="never">Never Expire</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          {expiration === 'custom' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Select Date</label>
              <input
                type="datetime-local"
                value={customExpiresAt}
                onChange={(e) => setCustomExpiresAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                required
                className="w-full text-xs bg-white border border-slate-250 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          )}

          {/* Download Limit */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Download Limit (Optional)
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              placeholder="e.g. 1 (one-time download) or leave empty for unlimited"
              value={maxDownloads}
              onChange={(e) => setMaxDownloads(e.target.value)}
              className="w-full text-xs bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          {/* Password Protection */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePassword}
                  onChange={(e) => setEnablePassword(e.target.checked)}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Password Protection
                </span>
              </label>
            </div>

            {enablePassword && (
              <div className="mt-3">
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="Enter passphrase for recipient..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={enablePassword}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-slate-250 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
              Generate Link
            </Button>
          </div>
        </form>
      ) : (
        /* Generated Link Display */
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-center">
            <p className="text-xs text-emerald-800 font-semibold">
              Shareable link generated successfully!
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              Anyone with this link can download the file (subject to limits & passwords).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Public URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 select-all focus:outline-none"
              />
              <Button
                variant={copied ? 'secondary' : 'primary'}
                size="sm"
                icon={copied ? Check : Copy}
                onClick={handleCopy}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-100">
            <a
              href={generatedLink}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Share Page
            </a>
            <Button variant="outline" size="sm" onClick={handleModalClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ShareModal;
