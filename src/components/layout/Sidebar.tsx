import React from 'react';
import { 
  LayoutDashboard, 
  GraduationCap, 
  BookOpen, 
  GitFork, 
  CalendarDays, 
  Scale, 
  BookmarkCheck, 
  Settings, 
  AlertCircle,
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { TARGET_GRADUATION_CREDITS } from '../../data/degreeRequirements';
import { COURSES_DATA } from '../../data/coursesData';

export type NavPageId = 
  | 'Dashboard'
  | 'My Academic Progress'
  | 'Course Catalog'
  | 'Prerequisite Explorer'
  | 'Academic Planner'
  | 'Workload Assessment'
  | 'My Saved Plans'
  | 'Settings';

interface SidebarProps {
  currentPage: NavPageId;
  onSelectPage: (page: NavPageId) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isOpen,
  onCloseMobile,
}) => {
  const { 
    profile, 
    plans, 
    prerequisiteAlerts, 
    completedCreditsCount, 
    degreeAudit 
  } = useAcademic();

  const navItems = [
    {
      id: 'Dashboard' as NavPageId,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'My Academic Progress' as NavPageId,
      label: 'My Academic Progress',
      icon: GraduationCap,
      badge: `${degreeAudit.overallPercentComplete}%`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'Course Catalog' as NavPageId,
      label: 'Course Catalog',
      icon: BookOpen,
      badge: `${COURSES_DATA.length} Courses`,
      badgeColor: 'bg-slate-100 text-slate-600',
    },
    {
      id: 'Prerequisite Explorer' as NavPageId,
      label: 'Prerequisite Explorer',
      icon: GitFork,
      badge: prerequisiteAlerts.length > 0 ? `${prerequisiteAlerts.length} Alerts` : 'Interactive',
      badgeColor: prerequisiteAlerts.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700',
    },
    {
      id: 'Academic Planner' as NavPageId,
      label: 'Academic Planner',
      icon: CalendarDays,
      badge: '4-Year',
      badgeColor: 'bg-indigo-50 text-indigo-700',
    },
    {
      id: 'Workload Assessment' as NavPageId,
      label: 'Workload Assessment',
      icon: Scale,
      badge: 'Mamdani FIS',
      badgeColor: 'bg-purple-50 text-purple-700',
    },
    {
      id: 'My Saved Plans' as NavPageId,
      label: 'My Saved Plans',
      icon: BookmarkCheck,
      badge: `${plans.length} Tracks`,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'Settings' as NavPageId,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#17365D] text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-blue-900/60 bg-[#0F2440]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center shadow-md ring-1 ring-white/20 shrink-0">
              <GraduationCap className="w-6 h-6 text-[#F4C95D]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">CourseAdvisor</span>
              </div>
              <p className="text-[11px] font-medium tracking-wide uppercase text-blue-200">
                Academic Planner
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C95D]"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300/80">
              Navigation Menu
            </p>
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectPage(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C95D] ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-md shadow-blue-950/20'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-[#F4C95D]' : 'text-blue-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : `${item.badgeColor} border-transparent`
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: Degree Milestone summary card */}
        <div className="p-4 border-t border-blue-900/60 bg-[#0F2440]/60">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-blue-200 font-medium">Degree Completion</span>
              <span className="font-bold text-[#F4C95D]">
                {completedCreditsCount}/{TARGET_GRADUATION_CREDITS} cr
              </span>
            </div>

            {/* Custom styled progress bar */}
            <div className="w-full h-2 rounded-full bg-blue-950/80 overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-[#2563EB] to-[#F4C95D] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (completedCreditsCount / TARGET_GRADUATION_CREDITS) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-blue-200/80 pt-0.5">
              <span>Class: <strong className="text-white">Junior</strong></span>
              <span>Grad: <strong className="text-white">{profile.targetGradTerm} {profile.targetGradYear}</strong></span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
