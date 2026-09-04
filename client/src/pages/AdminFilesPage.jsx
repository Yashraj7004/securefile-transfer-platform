import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { fileService } from '../services/fileService';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FileIcon from '../components/files/FileIcon';
import ConfirmDialog from '../components/common/ConfirmDialog';
import FileDetailsModal from '../components/files/FileDetailsModal';
import Button from '../components/common/Button';
import { Search, HardDrive, Trash2, Download, Info, Lock } from 'lucide-react';

const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const AdminFilesPage = () => {
  const [files, setFiles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [fileToDelete, setFileToDelete] = useState(null);
  const [selectedFileForDetails, setSelectedFileForDetails] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const fetchFiles = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await adminService.getAllFiles({
        search,
        page,
        limit: pagination.limit
      });
      setFiles(res.data.files);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load global files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFiles(1);
  };

  const handleDownload = async (file) => {
    try {
      await fileService.downloadFile(file._id, file.originalName);
      toast.success(`Downloading ${file.originalName}`);
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await adminService.deleteFile(fileToDelete._id);
      toast.success('File removed by administrator');
      setFileToDelete(null);
      fetchFiles(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">All Stored Files</h1>
        <p className="text-xs text-slate-500 mt-1">
          Global repository explorer: inspect all files, review ownership, and moderate inappropriate uploads
        </p>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search across all files by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-250 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
          />
        </form>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" text="Loading files repository..." />
        </div>
      ) : files.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 tracking-wider">
              <tr>
                <th scope="col" className="py-3.5 pl-6 pr-3">
                  File Name
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Owner
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Size
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Security
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Downloads
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Uploaded
                </th>
                <th scope="col" className="py-3.5 pl-3 pr-6 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.map((file) => (
                <tr key={file._id} className="hover:bg-slate-50/70 transition-colors">
                  {/* File name */}
                  <td className="py-4 pl-6 pr-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 border border-slate-150 rounded-lg shrink-0">
                        <FileIcon
                          mimeType={file.mimeType}
                          fileName={file.originalName}
                          className="w-5 h-5"
                        />
                      </div>
                      <span
                        className="font-medium text-slate-900 max-w-xs truncate block"
                        title={file.originalName}
                      >
                        {file.originalName}
                      </span>
                    </div>
                  </td>

                  {/* Owner */}
                  <td className="px-3 py-4 whitespace-nowrap text-xs">
                    <span className="font-semibold text-slate-800 block">
                      {file.owner?.name || 'Unknown'}
                    </span>
                    <span className="text-[11px] text-slate-400 block">{file.owner?.email}</span>
                  </td>

                  {/* Size */}
                  <td className="px-3 py-4 whitespace-nowrap text-xs font-medium text-slate-700">
                    {formatBytes(file.size)}
                  </td>

                  {/* Security */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      <Lock className="w-3 h-3" />
                      AES-256
                    </span>
                  </td>

                  {/* Downloads */}
                  <td className="px-3 py-4 whitespace-nowrap text-xs text-slate-700 font-semibold">
                    {file.downloadCount || 0}
                  </td>

                  {/* Uploaded */}
                  <td className="px-3 py-4 whitespace-nowrap text-xs text-slate-500">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="py-4 pl-3 pr-6 whitespace-nowrap text-right text-xs">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedFileForDetails(file)}
                        title="File details"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(file)}
                        title="Download decrypted"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setFileToDelete(file)}
                        title="Delete inappropriate file"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
          No files stored matching search criteria.
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(fileToDelete)}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Administrative File Deletion"
        message={`Are you sure you want to permanently delete "${fileToDelete?.originalName}" owned by ${fileToDelete?.owner?.email}? This file will be deleted from storage and owner's quota will be reclaimed.`}
        confirmText="Delete File"
      />

      <FileDetailsModal
        isOpen={Boolean(selectedFileForDetails)}
        onClose={() => setSelectedFileForDetails(null)}
        file={selectedFileForDetails}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default AdminFilesPage;
