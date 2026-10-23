import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  GraduationCap, 
  Sparkles, 
  AlertCircle, 
  Users, 
  ArrowRight,
  Database,
  Cloud,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose }) => {
  const { signInWithGoogle, signInAsDemoStudent, loading, authError, clearAuthError } = useAuth();
  const [selectedDemo, setSelectedDemo] = useState<'alex' | 'jordan' | 'morgan'>('alex');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    const success = await signInWithGoogle();
    if (success) {
      onClose();
    }
  };

  const handleDemoSignIn = async (student: 'alex' | 'jordan' | 'morgan') => {
    setSelectedDemo(student);
    const success = await signInAsDemoStudent(student);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-br from-[#17365D] to-[#1e4577] text-white">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F4C95D] text-slate-900 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Firebase Auth & Security
              </span>
            </div>
            <h3 className="text-xl font-black tracking-tight">Student Sign-In</h3>
            <p className="text-xs text-slate-200 mt-1">
              Access your personal degree audit, schedule plans, and workload assessments.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Error Banner */}
          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Authentication Notice</p>
                <p className="mt-0.5 text-rose-700">{authError}</p>
              </div>
              <button 
                onClick={clearAuthError}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Primary Action: Google Sign-In */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Signing In...' : 'Continue with Google'}</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Or Test with Student Personas
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          </div>

          {/* Student Personas for Multi-User Isolation Testing */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">
              Quickly switch accounts to verify student data isolation and cloud sync:
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleDemoSignIn('alex')}
                disabled={loading}
                className="p-3 rounded-xl border border-slate-200 hover:border-[#2563EB] hover:bg-blue-50/50 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    AR
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-[#2563EB]">
                      Alex Rivera (Junior)
                    </h5>
                    <p className="text-[11px] text-slate-500">B.S. Computer Science • Year 3</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => handleDemoSignIn('jordan')}
                disabled={loading}
                className="p-3 rounded-xl border border-slate-200 hover:border-[#2563EB] hover:bg-blue-50/50 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                    JT
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-[#2563EB]">
                      Jordan Taylor (Freshman)
                    </h5>
                    <p className="text-[11px] text-slate-500">B.S. Software Engineering • Year 1</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Privacy & Zero-Trust Notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Student Data Isolation Guarantee</span>
            </div>
            <p>
              Your academic progress and schedules are protected by server-enforced Firebase Security Rules. No other student can read or edit your records.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
          Offline changes are automatically cached in IndexedDB and synchronized when reconnected.
        </div>
      </div>
    </div>
  );
};
