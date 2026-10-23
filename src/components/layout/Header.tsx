import React, { useState } from 'react';
import { 
  GraduationCap, 
  Award, 
  Layers, 
  Menu, 
  X, 
  AlertTriangle, 
  BookOpen, 
  ChevronDown,
  UserCheck,
  LogIn,
  User
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { useAuth } from '../../context/AuthContext';
import { SyncStatusBadge } from '../common/SyncStatusBadge';
import { TARGET_GRADUATION_CREDITS } from '../../data/degreeRequirements';

interface HeaderProps {
  currentPageTitle: string;
  currentPageSubtitle?: string;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNavigate: (page: string) => void;
  onOpenProspectus?: () => void;
  onOpenSignIn?: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPageTitle,
  currentPageSubtitle,
  onToggleSidebar,
  isSidebarOpen,
  onNavigate,
  onOpenProspectus,
  onOpenSignIn,
  onOpenProfile,
}) => {
  const { 
    profile, 
    plans, 
    activePlanId, 
    setActivePlanId, 
    cumulativeGpa, 
    completedCreditsCount, 
    prerequisiteAlerts 
  } = useAcademic();
  const { currentUser } = useAuth();

  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);

  const activePlan = plans.find(p => p.id === activePlanId);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left section: Hamburger for mobile + Page title & breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-[#17365D] hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Toggle navigation"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-bold text-[#17365D] tracking-tight whitespace-nowrap">
                  {currentPageTitle}
                </h1>
                {currentPageSubtitle && (
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 shrink-0">
                    {currentPageSubtitle}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] hidden sm:block truncate">
                {profile.university} · {profile.major} · Catalog {profile.catalogYear}
              </p>
            </div>
          </div>

          {/* Right section: Plan Switcher, Academic Badges, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Prerequisite Warnings Badge if any */}
            {prerequisiteAlerts.length > 0 && (
              <button
                onClick={() => onNavigate('Academic Planner')}
                title={`${prerequisiteAlerts.length} prerequisite conflict(s) detected in planned terms`}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors animate-pulse cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="hidden sm:inline">{prerequisiteAlerts.length} Prereq Notice</span>
                <span className="sm:hidden font-mono font-bold text-[11px]">{prerequisiteAlerts.length}</span>
              </button>
            )}

            {/* Official Prospectus button */}
            {onOpenProspectus && (
              <button
                onClick={onOpenProspectus}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#17365D] text-white hover:bg-[#0F2440] transition-colors shadow-2xs cursor-pointer"
                title="View Official University Curriculum Prospectus"
              >
                <GraduationCap className="w-3.5 h-3.5 text-[#F4C95D]" />
                <span>Prospectus</span>
              </button>
            )}

            {/* Plan Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-[#17365D] hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                title={`Active Plan: ${activePlan?.name}`}
                aria-label="Switch Academic Plan"
              >
                <Layers className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#2563EB] shrink-0" />
                <span className="hidden sm:inline max-w-[140px] md:max-w-[180px] truncate text-left font-semibold">
                  {activePlan?.name || 'Active Plan'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 hidden sm:inline" />
              </button>

              {isPlanDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsPlanDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50">
                    <div className="px-3 py-1.5 border-b border-slate-100">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Switch Degree Plan
                      </p>
                    </div>
                    {plans.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActivePlanId(p.id);
                          setIsPlanDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          p.id === activePlanId ? 'bg-blue-50/60 font-semibold text-[#2563EB]' : 'text-slate-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">
                            {p.semesters.length} Semesters
                          </p>
                        </div>
                        {p.id === activePlanId && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                        )}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                      <button
                        onClick={() => {
                          setIsPlanDropdownOpen(false);
                          onNavigate('My Saved Plans');
                        }}
                        className="w-full text-center py-1.5 text-xs text-[#2563EB] hover:underline font-medium"
                      >
                        Manage & Compare Plans →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* GPA Badge with Gold Indicator */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => onNavigate('My Academic Progress')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('My Academic Progress'); } }}
              className="cursor-pointer hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 shadow-2xs hover:bg-amber-100/80 transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-none"
              title="Dean's List Standing: Cumulative GPA"
            >
              <Award className="w-3.5 h-3.5 text-[#D9A834]" />
              <span className="font-semibold text-[#17365D]">GPA: <span className="font-mono tabular-nums">{cumulativeGpa.toFixed(2)}</span></span>
            </div>

            {/* Progress Badge */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => onNavigate('My Academic Progress')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('My Academic Progress'); } }}
              className="cursor-pointer hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-xs text-[#17365D] shadow-2xs hover:bg-blue-100/60 transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-none"
              title="Completed Degree Credits"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>
                <strong className="font-bold text-[#17365D] font-mono tabular-nums">{completedCreditsCount}</strong>
                <span className="text-slate-500 font-normal">/{TARGET_GRADUATION_CREDITS} cr</span>
              </span>
            </div>

            {/* Cloud Sync Status Indicator */}
            <div className="hidden sm:block">
              <SyncStatusBadge />
            </div>

            {/* Authentication / Student Account */}
            {currentUser ? (
              <div 
                role="button"
                tabIndex={0}
                onClick={onOpenProfile || (() => onNavigate('Settings'))}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (onOpenProfile || (() => onNavigate('Settings')))(); } }}
                className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-none rounded-lg"
                title="Student Cloud Profile & Security"
              >
                <div className="w-8 h-8 rounded-full bg-[#17365D] text-[#F4C95D] flex items-center justify-center font-black text-xs ring-2 ring-white group-hover:ring-[#2563EB] transition-all shadow-xs">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : profile.name.charAt(0)}
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-bold text-[#17365D] leading-tight group-hover:text-[#2563EB] transition-colors">
                    {currentUser.displayName || profile.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {currentUser.isAnonymous ? 'Demo Account' : (currentUser.email || profile.studentId)}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenSignIn}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#F4C95D] focus:outline-none"
                title="Sign in with Google or Demo Account"
                aria-label="Sign In"
              >
                <LogIn className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
