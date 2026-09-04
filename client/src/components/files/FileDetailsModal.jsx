import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Lock, ShieldCheck, HardDrive, Download, Calendar, Hash } from 'lucide-react';

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FileDetailsModal = ({ isOpen, onClose, file, onDownload }) => {
  if (!file) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="File Details & Security" maxWidth="max-w-lg">
      <div className="space-y-4">
        {/* Name banner */}
        <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">File Name</p>
          <p className="text-sm font-bold text-slate-800 break-all mt-0.5">{file.originalName}</p>
        </div>

        {/* Security Specs Box */}
        <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            Zero-Knowledge At-Rest Encryption
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Algorithm</span>
              <span className="font-semibold text-slate-800">
                {file.encryptionMetadata?.algorithm || 'AES-256-CBC'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Initialization Vector (IV)</span>
              <span className="font-mono text-slate-700 text-[11px] truncate block" title={file.encryptionMetadata?.iv}>
                {file.encryptionMetadata?.iv ? `${file.encryptionMetadata.iv.slice(0, 16)}...` : 'Unique 16-byte'}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white border border-slate-200/70 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <HardDrive className="w-3.5 h-3.5" />
              <span>File Size</span>
            </div>
            <span className="font-bold text-slate-800">{formatBytes(file.size)}</span>
          </div>

          <div className="p-3 bg-white border border-slate-200/70 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Hash className="w-3.5 h-3.5" />
              <span>MIME Type</span>
            </div>
            <span className="font-medium text-slate-700 truncate block">{file.mimeType}</span>
          </div>

          <div className="p-3 bg-white border border-slate-200/70 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Uploaded At</span>
            </div>
            <span className="font-medium text-slate-700">
              {new Date(file.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="p-3 bg-white border border-slate-200/70 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Download className="w-3.5 h-3.5" />
              <span>Download Count</span>
            </div>
            <span className="font-bold text-slate-800">{file.downloadCount || 0} times</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-100">
        <Button
          variant="primary"
          size="sm"
          icon={Download}
          onClick={() => {
            onDownload(file);
            onClose();
          }}
        >
          Download Decrypted
        </Button>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default FileDetailsModal;
