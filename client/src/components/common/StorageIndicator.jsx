import React from 'react';
import { HardDrive } from 'lucide-react';

const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const StorageIndicator = ({ used = 0, limit = 5368709120, showIcon = true, compact = false }) => {
  const safeLimit = limit > 0 ? limit : 5368709120;
  const percent = Math.min(100, Math.round((used / safeLimit) * 100));

  let barColor = 'bg-primary-600';
  let badgeColor = 'text-primary-600';

  if (percent >= 90) {
    barColor = 'bg-red-600';
    badgeColor = 'text-red-600';
  } else if (percent >= 75) {
    barColor = 'bg-amber-500';
    badgeColor = 'text-amber-600';
  }

  if (compact) {
    return (
      <div className="w-full">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Storage</span>
          <span className="font-semibold text-slate-700">{percent}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-500 rounded-full`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {showIcon && (
            <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
              <HardDrive className="w-4 h-4" />
            </div>
          )}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Storage Usage
            </h4>
            <p className="text-sm font-bold text-slate-800">
              {formatBytes(used)} / {formatBytes(safeLimit)}
            </p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 ${badgeColor}`}>
          {percent}%
        </span>
      </div>

      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500 rounded-full`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {formatBytes(Math.max(0, safeLimit - used))} remaining
      </p>
    </div>
  );
};

export default StorageIndicator;
