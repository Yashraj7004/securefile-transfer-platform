import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shareService } from '../services/shareService';
import { useToast } from '../context/ToastContext';
import FileIcon from '../components/files/FileIcon';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Shield,
  Download,
  Lock,
  Calendar,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';

const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const PublicSharePage = () => {
  const { token } = useParams();
  const [shareInfo, setShareInfo] = useState(null);
  const [password, setPassword] = useState('');
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchShareInfo = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await shareService.getPublicShareInfo(token);
        setShareInfo(res.data);
        if (!res.data.passwordProtected) {
          setIsPasswordVerified(true);
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'This share link is invalid or has expired.');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchShareInfo();
    }
  }, [token]);

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.warning('Please enter the access password');
      return;
    }

    try {
      await shareService.verifyPassword(token, password);
      setIsPasswordVerified(true);
      toast.success('Password verified! You can now download the file.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect password');
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await shareService.downloadSharedFile(token, password, shareInfo.fileName);
      toast.success('File download started!');
      // Update local download count
      setShareInfo((prev) => (prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : prev));
    } catch (err) {
      const msg = err.response?.data?.message || 'Download failed';
      toast.error(msg);
      setErrorMsg(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <LoadingSpinner size="lg" text="Locating secure file transfer..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-primary-500 selection:text-white">
      {/* Top Brand Bar */}
      <header className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              SecureFile
            </span>
          </Link>
          <Link to="/register" className="text-xs font-semibold text-primary-600 hover:underline">
            Create your account
          </Link>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/60 p-6 sm:p-10">
          {errorMsg ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Link Unavailable</h3>
              <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                {errorMsg}
              </p>
              <div className="mt-8">
                <Link to="/">
                  <Button variant="outline" size="md">
                    Return to SecureFile Home
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              {/* File Header */}
              <div className="text-center mb-8">
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl w-fit mx-auto mb-4 shadow-2xs">
                  <FileIcon
                    mimeType={shareInfo.mimeType}
                    fileName={shareInfo.fileName}
                    className="w-10 h-10"
                  />
                </div>
                <h2
                  className="text-lg sm:text-xl font-bold text-slate-900 break-all"
                  title={shareInfo.fileName}
                >
                  {shareInfo.fileName}
                </h2>
                <div className="mt-1.5 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <span>{formatBytes(shareInfo.fileSize)}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200/60">
                    <Lock className="w-3 h-3" />
                    AES-256 Encrypted
                  </span>
                </div>
              </div>

              {/* Password prompt if protected and not yet verified */}
              {shareInfo.passwordProtected && !isPasswordVerified ? (
                <form onSubmit={handleVerifyPassword} className="space-y-4">
                  <div className="p-4 bg-amber-50/70 border border-amber-200/70 rounded-2xl">
                    <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-700" />
                      Password Protected Transfer
                    </p>
                    <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                      The sender has encrypted this download with a security passphrase.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Passphrase
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter file passphrase..."
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
                    />
                  </div>

                  <Button type="submit" variant="primary" size="md" className="w-full">
                    Unlock Download
                  </Button>
                </form>
              ) : (
                /* Verified / Unprotected: Download Button */
                <div className="space-y-6">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    icon={Download}
                    isLoading={isDownloading}
                    onClick={handleDownload}
                  >
                    Download Decrypted File
                  </Button>

                  {/* Transfer Details Breakdown */}
                  <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-3 text-xs">
                    {shareInfo.expiresAt && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                        <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Expiration
                        </span>
                        <span className="font-semibold text-slate-700 mt-0.5 block">
                          {new Date(shareInfo.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {shareInfo.maxDownloads && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                        <span className="text-slate-400 block text-[11px]">Download Limit</span>
                        <span className="font-semibold text-slate-700 mt-0.5 block">
                          {shareInfo.downloadCount} of {shareInfo.maxDownloads} used
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white">
        Secure file transfer powered by{' '}
        <Link to="/" className="font-semibold text-slate-600 hover:text-primary-600">
          SecureFile Transfer Platform
        </Link>
      </footer>
    </div>
  );
};

export default PublicSharePage;
