import React from 'react';
import { useNavigate } from 'react-router-dom';
import UploadBox from '../components/files/UploadBox';
import { Lock, ShieldCheck, Cpu, HardDrive } from 'lucide-react';
import Button from '../components/common/Button';

const UploadPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Upload Files</h1>
        <p className="text-xs text-slate-500 mt-1">
          Select or drop files to be encrypted with AES-256 before being stored
        </p>
      </div>

      {/* Main Upload Box */}
      <UploadBox onUploadSuccess={() => {}} />

      {/* Security Architecture Callout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Stream Encrypted</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Files are passed through AES-256 ciphers in chunks directly into storage.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-primary-50 text-primary-600 rounded-xl shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Unique IV Per File</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              A cryptographically random 16-byte initialization vector prevents pattern analysis.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Zero Raw Disk Files</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              No plain text files ever touch physical disk storage.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/files')}>
          View Uploaded Files →
        </Button>
      </div>
    </div>
  );
};

export default UploadPage;
