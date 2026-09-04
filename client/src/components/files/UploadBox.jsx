import React, { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import Button from '../common/Button';
import { fileService } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const UploadBox = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const fileInputRef = useRef(null);
  const { refreshUser } = useAuth();
  const toast = useToast();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(Array.from(e.target.files));
    }
  };

  const processSelectedFiles = (newFiles) => {
    const queueItems = newFiles.map((f) => ({
      file: f,
      id: `${f.name}_${Date.now()}_${Math.random()}`,
      status: 'pending', // pending, uploading, success, error
      progress: 0,
      errorMsg: null
    }));

    setUploadQueue((prev) => [...prev, ...queueItems]);

    // Start processing files
    queueItems.forEach((item) => {
      uploadSingleItem(item);
    });
  };

  const uploadSingleItem = async (item) => {
    setUploadQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading' } : q))
    );

    try {
      const res = await fileService.uploadFile(item.file, (percent) => {
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, progress: percent } : q))
        );
      });

      setUploadQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'success', progress: 100 } : q))
      );

      toast.success(`"${item.file.name}" encrypted & uploaded successfully!`);
      await refreshUser();

      if (onUploadSuccess) {
        onUploadSuccess(res.data);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || 'File upload failed. Please try again.';

      setUploadQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'error', errorMsg } : q))
      );

      toast.error(errorMsg);
    }
  };

  const removeItemFromQueue = (id) => {
    setUploadQueue((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="w-full space-y-6">
      {/* Drag & drop dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-primary-500 bg-primary-50/60 scale-[1.01]'
            : 'border-slate-250 bg-white hover:border-primary-400 hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="p-4 bg-primary-50 text-primary-600 rounded-2xl mb-4 shadow-sm group-hover:scale-110 transition-transform">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base font-bold text-slate-800 text-center">
          Drag & drop your files here
        </h3>
        <p className="mt-1 text-xs text-slate-500 text-center">
          or <span className="text-primary-600 font-semibold hover:underline">browse files</span> from your device
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
          <span className="bg-slate-100 px-2 py-0.5 rounded-md">PDF</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-md">DOCX</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-md">XLSX</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-md">Images</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-md">ZIP</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-md">MP4</span>
          <span>Max 500 MB per file</span>
        </div>
      </div>

      {/* Upload Queue List */}
      {uploadQueue.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Upload Progress ({uploadQueue.length})
            </h4>
            <button
              onClick={() => setUploadQueue([])}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-3">
            {uploadQueue.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 truncate">
                    <File className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-800 truncate" title={item.file.name}>
                      {item.file.name}
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      ({formatBytes(item.file.size)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'uploading' && (
                      <span className="text-xs font-semibold text-primary-600 flex items-center gap-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {item.progress}%
                      </span>
                    )}
                    {item.status === 'success' && (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Encrypted
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Failed
                      </span>
                    )}
                    <button
                      onClick={() => removeItemFromQueue(item.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {item.status === 'uploading' && (
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 transition-all duration-300 rounded-full"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {item.errorMsg && (
                  <p className="text-[11px] text-rose-600">{item.errorMsg}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadBox;
