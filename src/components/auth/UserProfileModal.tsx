import React from 'react';
import { 
  X, 
  LogOut, 
  User, 
  Mail, 
  ShieldCheck, 
  Database, 
  Cloud, 
  Layers, 
  Calendar,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { SyncStatusBadge } from '../common/SyncStatusBadge';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTestPanel?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  isOpen, 
  onClose,
  onOpenTestPanel 
}) => {
  const { currentUser, signOut, syncStatus, isDbConnected, dbConnectionMessage, checkConnection } = useAuth();
  const { profile, plans, completedCreditsCount } = useAcademic();

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-br from-[#17365D] to-[#1e4577] text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-lg font-black text-[#F4C95D]">
              {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">
                  {currentUser?.displayName || profile.name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white">
                  {currentUser?.isAnonymous ? 'Demo Student' : 'Verified Student'}
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{currentUser?.email || `${profile.name.toLowerCase().replace(/\s+/g, '.')}@university.edu`}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Degree & Academic Standing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Degree Program / Major
              </span>
              <p className="text-xs font-black text-slate-800 leading-snug">{profile.major}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Target: Class of {profile.targetGradYear}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Completed Units
              </span>
              <p className="text-xs font-black text-slate-800 leading-snug">{completedCreditsCount} Units</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{plans.length} Saved Academic Plans</p>
            </div>
          </div>

          {/* Cloud Database & Sync Status */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#2563EB]" />
                Cloud Firestore Storage
              </span>
              <SyncStatusBadge showDetails={true} />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {dbConnectionMessage}
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
              <div>
                <span className="text-slate-400 block font-medium">Student UID:</span>
                <span className="font-mono text-slate-700 font-bold text-[10px] truncate block" title={currentUser?.uid || 'local'}>
                  {currentUser?.uid || 'Offline Mode (Local Storage)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Local Cache:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  IndexedDB Active
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={checkConnection}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Test DB Connection</span>
              </button>

              {onOpenTestPanel && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenTestPanel();
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-[#2563EB] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Run Security & Sync Tests</span>
                </button>
              )}
            </div>
          </div>

          {/* Security & Access Isolation Guarantee */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Role-Based Access Control (RBAC)
            </span>
            <p className="text-[11px] text-slate-500">
              Firestore Security Rules restrict your data to path <code className="text-[#2563EB] bg-slate-100 px-1 py-0.5 rounded font-mono">/users/{currentUser?.uid || '{userId}'}/*</code>. Catalog course editing is restricted to institutional administrators.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Session is automatically saved
          </span>

          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
