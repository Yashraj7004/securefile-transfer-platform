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

const FileTable = ({ files, onDownload, onShare, onDelete, onDetails }) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
        <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 tracking-wider">
          <tr>
            <th scope="col" className="py-3.5 pl-6 pr-3">
              File Name
            </th>
            <th scope="col" className="px-3 py-3.5">
              Size
            </th>
            <th scope="col" className="px-3 py-3.5">
              Security
            </th>
            <th scope="col" className="px-3 py-3.5">
              Uploaded
            </th>
            <th scope="col" className="px-3 py-3.5">
              Downloads
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-6 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {files.map((file) => {
            const dateStr = new Date(file.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <tr key={file._id} className="hover:bg-slate-50/70 transition-colors group">
                <td className="py-4 pl-6 pr-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 border border-slate-150 rounded-lg shrink-0">
                      <FileIcon
                        mimeType={file.mimeType}
                        fileName={file.originalName}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="max-w-xs sm:max-w-sm md:max-w-md truncate">
                      <span
                        className="font-medium text-slate-800 hover:text-primary-600 transition cursor-pointer"
                        onClick={() => onDetails(file)}
                        title={file.originalName}
                      >
                        {file.originalName}
                      </span>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {file.mimeType || 'unknown format'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                  {formatBytes(file.size)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    <Lock className="w-3 h-3" />
                    AES-256
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-xs text-slate-500">{dateStr}</td>
                <td className="px-3 py-4 whitespace-nowrap text-xs text-slate-700 font-semibold">
                  {file.downloadCount || 0}
                </td>
                <td className="py-4 pl-3 pr-6 whitespace-nowrap text-right text-xs">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onDetails(file)}
                      title="File details"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
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
                      title="Download decrypted"
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FileTable;
