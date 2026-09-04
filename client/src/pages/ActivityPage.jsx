import React, { useState, useEffect } from 'react';
import { fileService } from '../services/fileService';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import FileIcon from '../components/files/FileIcon';
import { Activity, Download, Globe, Clock, Laptop, RefreshCw } from 'lucide-react';

const ActivityPage = () => {
  const [downloads, setDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const fetchActivity = async () => {
    setIsRefreshing(true);
    try {
      const res = await fileService.getDashboardActivity();
      setDownloads(res.data?.recentDownloads || []);
    } catch (err) {
      toast.error('Failed to load download activity');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" text="Loading download audit logs..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Download Activity</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time audit log tracking every download request, IP origin, and recipient device
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchActivity}
          isLoading={isRefreshing}
        >
          Refresh Logs
        </Button>
      </div>

      {downloads.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 tracking-wider">
              <tr>
                <th scope="col" className="py-3.5 pl-6 pr-3">
                  File Downloaded
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Recipient Identity
                </th>
                <th scope="col" className="px-3 py-3.5">
                  IP Address
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Device / Agent
                </th>
                <th scope="col" className="py-3.5 pl-3 pr-6 text-right">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {downloads.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                  {/* File */}
                  <td className="py-4 pl-6 pr-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 border border-slate-150 rounded-lg shrink-0">
                        <FileIcon
                          mimeType={log.file?.mimeType}
                          fileName={log.file?.originalName}
                          className="w-5 h-5"
                        />
                      </div>
                      <span
                        className="font-medium text-slate-800 max-w-xs truncate block"
                        title={log.file?.originalName}
                      >
                        {log.file?.originalName || 'Deleted File'}
                      </span>
                    </div>
                  </td>

                  {/* Recipient */}
                  <td className="px-3 py-4 whitespace-nowrap text-xs">
                    {log.user ? (
                      <div>
                        <span className="font-semibold text-slate-800">{log.user.name}</span>
                        <p className="text-[11px] text-slate-400">{log.user.email}</p>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-medium">
                        Public Share Link
                      </span>
                    )}
                  </td>

                  {/* IP Address */}
                  <td className="px-3 py-4 whitespace-nowrap text-xs font-mono text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      {log.ipAddress}
                    </span>
                  </td>

                  {/* User Agent */}
                  <td className="px-3 py-4 whitespace-nowrap text-xs text-slate-500 max-w-xs truncate">
                    <span className="flex items-center gap-1.5 truncate" title={log.userAgent}>
                      <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{log.userAgent}</span>
                    </span>
                  </td>

                  {/* Timestamp */}
                  <td className="py-4 pl-3 pr-6 whitespace-nowrap text-right text-xs text-slate-500">
                    <span className="flex items-center justify-end gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(log.downloadedAt).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Activity}
          title="No download activity logged yet"
          description="Whenever you or a recipient downloads one of your encrypted files, full audit data will appear here."
        />
      )}
    </div>
  );
};

export default ActivityPage;
