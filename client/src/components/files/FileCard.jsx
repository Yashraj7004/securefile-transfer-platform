import React from 'react';
import { Download, Share2, Trash2, Info, Lock } from 'lucide-react';
import FileIcon from './FileIcon';

const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FileCard = ({ file, onDownload, onShare, onDelete, onDetails }) => {
  const formattedDate = new Date(file.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200 flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl group-hover:scale-105 transition-transform">
            <FileIcon mimeType={file.mimeType} fileName={file.originalName} className="w-6 h-6" />
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
            <Lock className="w-3 h-3" />
            AES-256
          </span>
        </div>

        <h4
          className="mt-4 text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-primary-600 transition"
          title={file.originalName}
        >
          {file.originalName}
        </h4>

        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
          <span>{formatBytes(file.size)}</span>
          <span>•</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Footer stats & actions */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500">
          {file.downloadCount || 0} {file.downloadCount === 1 ? 'download' : 'downloads'}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onDetails(file)}
            title="File details & encryption"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            onClick={() => onShare(file)}
            title="Create share link"
            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDownload(file)}
            title="Download decrypted file"
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(file)}
            title="Delete file"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileCard;
