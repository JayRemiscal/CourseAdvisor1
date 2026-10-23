import React, { useState, useEffect } from 'react';
import { AcademicProvider, useAcademic } from './context/AcademicContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavPageId } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { AcademicProgressPage } from './pages/AcademicProgressPage';
import { CourseCatalogPage } from './pages/CourseCatalogPage';
import { PrerequisiteExplorerPage } from './pages/PrerequisiteExplorerPage';
import { AcademicPlannerPage } from './pages/AcademicPlannerPage';
import { WorkloadAssessmentPage } from './pages/WorkloadAssessmentPage';
import { SavedPlansPage } from './pages/SavedPlansPage';
import { SettingsPage } from './pages/SettingsPage';
import { CourseModal } from './components/common/CourseModal';
import { ProspectusModal } from './components/common/ProspectusModal';
import { SignInModal } from './components/auth/SignInModal';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { COURSE_BY_ID_MAP, COURSES_DATA } from './data/coursesData';
import { Course } from './types/academic';

import { CheckCircle2, X } from 'lucide-react';

const PAGE_TO_HASH: Record<NavPageId, string> = {
  'Dashboard': 'dashboard',
  'My Academic Progress': 'progress',
  'Course Catalog': 'catalog',
  'Prerequisite Explorer': 'prerequisites',
  'Academic Planner': 'planner',
  'Workload Assessment': 'workload',
  'My Saved Plans': 'plans',
  'Settings': 'settings'
};

const HASH_TO_PAGE: Record<string, NavPageId> = {
  dashboard: 'Dashboard',
  progress: 'My Academic Progress',
  catalog: 'Course Catalog',
  prerequisites: 'Prerequisite Explorer',
  planner: 'Academic Planner',
  workload: 'Workload Assessment',
  plans: 'My Saved Plans',
  settings: 'Settings'
};

const getInitialPage = (): NavPageId => {
  if (typeof window !== 'undefined') {
    const rawHash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
    if (rawHash && HASH_TO_PAGE[rawHash]) {
      return HASH_TO_PAGE[rawHash];
    }
    try {
      const stored = localStorage.getItem('courseadvisor_active_page');
      if (stored && Object.values(HASH_TO_PAGE).includes(stored as NavPageId)) {
        return stored as NavPageId;
      }
    } catch {}
  }
  return 'Dashboard';
};

function MainApp() {
  const [currentPage, setCurrentPage] = useState<NavPageId>(getInitialPage);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCourseModalId, setSelectedCourseModalId] = useState<string | null>(null);
  const [isProspectusModalOpen, setIsProspectusModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { toasts, removeToast } = useAcademic();

  const handleNavigate = (page: NavPageId) => {
    setCurrentPage(page);
    try {
      localStorage.setItem('courseadvisor_active_page', page);
      const hash = PAGE_TO_HASH[page];
      if (hash && window.location.hash !== `#/${hash}`) {
        window.history.pushState(null, '', `#/${hash}`);
      }
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Synchronize hash on initial load and handle browser back/forward buttons
  useEffect(() => {
    const hash = PAGE_TO_HASH[currentPage];
    if (hash && window.location.hash !== `#/${hash}`) {
      window.history.replaceState(null, '', `#/${hash}`);
    }

    const handleHashChange = () => {
      const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
      if (raw && HASH_TO_PAGE[raw]) {
        const targetPage = HASH_TO_PAGE[raw];
        setCurrentPage(targetPage);
        try {
          localStorage.setItem('courseadvisor_active_page', targetPage);
        } catch {}
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const selectedCourse = selectedCourseModalId 
    ? (COURSE_BY_ID_MAP.get(selectedCourseModalId) || COURSES_DATA.find(c => c.code === selectedCourseModalId) || null)
    : null;

  const pageSubtitles: Record<NavPageId, string> = {
    'Dashboard': 'Academic Overview & Key Metrics',
    'My Academic Progress': 'Degree Audit & What-If GPA Simulator',
    'Course Catalog': 'Curriculum Directory & Syllabi Specs',
    'Prerequisite Explorer': 'Visual Flowchart & Dependency Validator',
    'Academic Planner': '4-Year Multi-Semester Schedule Roadmap',
    'Workload Assessment': 'Mamdani Fuzzy Inference & Workload Modeler',
    'My Saved Plans': 'Degree Track Scenarios & Comparisons',
    'Settings': 'Profile Preferences & Data Storage'
  };

  const [prereqExplorerInitialCode, setPrereqExplorerInitialCode] = useState<string>('ENS035');

  const handleExplorePrerequisites = (courseCode: string) => {
    setPrereqExplorerInitialCode(courseCode);
    handleNavigate('Prerequisite Explorer');
  };

  const handleOpenCourse = (courseId: string) => {
    setSelectedCourseModalId(courseId);
  };

  const handleSelectPrereqInModal = (prereqCourse: Course) => {
    setSelectedCourseModalId(prereqCourse.id);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#1F2937] flex flex-col lg:flex-row antialiased selection:bg-[#2563EB] selection:text-white">
      
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={handleNavigate}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <Header
          currentPageTitle={currentPage}
          currentPageSubtitle={pageSubtitles[currentPage]}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onNavigate={(page) => handleNavigate(page as NavPageId)}
          onOpenProspectus={() => setIsProspectusModalOpen(true)}
          onOpenSignIn={() => setIsSignInModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />

        {/* Dynamic Page Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentPage === 'Dashboard' && (
            <DashboardPage
              onNavigate={handleNavigate}
              onOpenCourse={handleOpenCourse}
              onOpenProspectus={() => setIsProspectusModalOpen(true)}
            />
          )}

          {currentPage === 'My Academic Progress' && (
            <AcademicProgressPage 
              onOpenCourse={handleOpenCourse}
              onOpenProspectus={() => setIsProspectusModalOpen(true)}
              onExplorePrerequisites={handleExplorePrerequisites}
            />
          )}

          {currentPage === 'Course Catalog' && (
            <CourseCatalogPage 
              onOpenCourse={handleOpenCourse}
              onOpenProspectus={() => setIsProspectusModalOpen(true)}
              onExplorePrerequisites={handleExplorePrerequisites}
            />
          )}

          {currentPage === 'Prerequisite Explorer' && (
            <PrerequisiteExplorerPage 
              onOpenCourse={handleOpenCourse}
              initialCourseCode={prereqExplorerInitialCode}
              onNavigate={(page) => handleNavigate(page as NavPageId)}
            />
          )}

          {currentPage === 'Academic Planner' && (
            <AcademicPlannerPage 
              onOpenCourse={handleOpenCourse} 
              onNavigateToWorkload={() => handleNavigate('Workload Assessment')}
            />
          )}

          {currentPage === 'Workload Assessment' && (
            <WorkloadAssessmentPage onOpenCourse={handleOpenCourse} />
          )}

          {currentPage === 'My Saved Plans' && (
            <SavedPlansPage 
              onNavigate={(page) => handleNavigate(page as NavPageId)}
            />
          )}

          {currentPage === 'Settings' && (
            <SettingsPage />
          )}
        </main>
      </div>

      {/* Official Prospectus Modal */}
      <ProspectusModal
        isOpen={isProspectusModalOpen}
        onClose={() => setIsProspectusModalOpen(false)}
        onOpenCourse={handleOpenCourse}
      />

      {/* Global Course Details Modal */}
      {selectedCourse && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setSelectedCourseModalId(null)}
          onSelectPrereqCourse={handleSelectPrereqInModal}
          onExplorePrerequisites={handleExplorePrerequisites}
        />
      )}

      {/* Authentication & Profile Modals */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenTestPanel={() => {
          setIsProfileModalOpen(false);
          handleNavigate('Settings');
        }}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-700'
                : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-blue-900 text-white border-blue-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1">{toast.text}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AcademicProvider>
        <MainApp />
      </AcademicProvider>
    </AuthProvider>
  );
}
