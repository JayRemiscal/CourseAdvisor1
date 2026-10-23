import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SyncStatusBadge: React.FC<{ showDetails?: boolean }> = ({ showDetails = false }) => {
  const { syncStatus, isDbConnected } = useAuth();
  const { state, isOnline, lastSyncedAt } = syncStatus;

  let badgeContent = {
    icon: Cloud,
    label: 'Cloud Connected',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  };

  if (!isOnline || state === 'offline') {
    badgeContent = {
      icon: CloudOff,
      label: 'Offline (IndexedDB)',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    };
  } else if (state === 'saving' || state === 'syncing') {
    badgeContent = {
      icon: RefreshCw,
      label: state === 'saving' ? 'Saving...' : 'Syncing...',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500 animate-pulse',
    };
  } else if (state === 'error') {
    badgeContent = {
      icon: AlertCircle,
      label: 'Sync Warning',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    };
  } else if (state === 'synced') {
    badgeContent = {
      icon: CheckCircle2,
      label: 'Cloud Synced',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    };
  }

  const Icon = badgeContent.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${badgeContent.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${badgeContent.dot}`} />
      <Icon className={`w-3.5 h-3.5 ${state === 'saving' || state === 'syncing' ? 'animate-spin' : ''}`} />
      <span>{badgeContent.label}</span>
      {showDetails && lastSyncedAt && (
        <span className="text-[10px] opacity-75 font-normal ml-1">
          {new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
};
