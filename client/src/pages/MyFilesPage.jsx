import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fileService } from '../services/fileService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import FileTable from '../components/files/FileTable';
import FileCard from '../components/files/FileCard';
import ShareModal from '../components/files/ShareModal';
import FileDetailsModal from '../components/files/FileDetailsModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import {
  Search,
  LayoutGrid,
  List,
  Upload,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const MyFilesPage = () => {
  const { refreshUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedFileForShare, setSelectedFileForShare] = useState(null);
  const [selectedFileForDetails, setSelectedFileForDetails] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const fetchFiles = async (page = pagination.page) => {
    setIsLoading(true);
    try {
      const res = await fileService.getFiles({
        search,
        category,
        sortBy,
        sortOrder,
        page,
        limit: pagination.limit
      });
      setFiles(res.data.files);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(1);
  }, [category, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFiles(1);
  };

  const handleDownload = async (file) => {
    try {
      await fileService.downloadFile(file._id, file.originalName);
      toast.success(`Downloading ${file.originalName}`);
      fetchFiles(pagination.page);
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
      fetchFiles(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'documents', label: 'Documents' },
    { id: 'images', label: 'Images' },
    { id: 'video', label: 'Videos' },
    { id: 'audio', label: 'Audio' },
    { id: 'archives', label: 'Archives' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Files</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, search, decrypt, and manage your encrypted storage repository
          </p>
        </div>
        <Link to="/upload">
          <Button variant="primary" size="sm" icon={Upload}>
            Upload File
          </Button>
        </Link>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search files by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
            />
          </form>

          {/* Controls: Sort and View toggles */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Sort selection */}
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('_');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="createdAt_desc">Newest First</option>
                <option value="createdAt_asc">Oldest First</option>
                <option value="size_desc">Largest Size</option>
                <option value="size_asc">Smallest Size</option>
                <option value="originalName_asc">Name (A-Z)</option>
                <option value="originalName_desc">Name (Z-A)</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/70">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-white text-primary-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
                category === cat.id
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Files Display */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" text="Retrieving encrypted files..." />
        </div>
      ) : files.length > 0 ? (
        <div>
          {viewMode === 'table' ? (
            <FileTable
              files={files}
              onDownload={handleDownload}
              onShare={(f) => setSelectedFileForShare(f)}
              onDetails={(f) => setSelectedFileForDetails(f)}
              onDelete={(f) => setFileToDelete(f)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {files.map((file) => (
                <FileCard
                  key={file._id}
                  file={file}
                  onDownload={handleDownload}
                  onShare={(f) => setSelectedFileForShare(f)}
                  onDetails={(f) => setSelectedFileForDetails(f)}
                  onDelete={(f) => setFileToDelete(f)}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl px-5 py-3 shadow-xs">
              <span className="text-xs text-slate-500">
                Showing page <span className="font-semibold">{pagination.page}</span> of{' '}
                <span className="font-semibold">{pagination.pages}</span> ({pagination.total} total files)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchFiles(pagination.page - 1)}
                  icon={ChevronLeft}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchFiles(pagination.page + 1)}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="No files match your filter"
          description={
            search || category !== 'all'
              ? 'Try changing your search query or category filter.'
              : 'You have not uploaded any files yet. Drag and drop your first file to get started!'
          }
          actionText="Upload a File"
          onAction={() => window.location.assign('/upload')}
        />
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

export default MyFilesPage;
