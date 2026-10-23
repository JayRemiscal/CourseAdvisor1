import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Star, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Calendar, 
  Layers,
  LayoutGrid,
  List,
  Sparkles,
  ArrowUpDown,
  GitFork
} from 'lucide-react';
import { COURSES_DATA } from '../data/coursesData';
import { Course, RequirementCategoryType, TermType } from '../types/academic';
import { useAcademic } from '../context/AcademicContext';
import { CustomSelect, CustomSelectOption } from '../components/common/CustomSelect';

interface CourseCatalogPageProps {
  onOpenCourse: (courseId: string) => void;
  onOpenProspectus?: () => void;
  onExplorePrerequisites?: (courseCode: string) => void;
}

export const CourseCatalogPage: React.FC<CourseCatalogPageProps> = ({
  onOpenCourse,
  onOpenProspectus,
  onExplorePrerequisites,
}) => {
  const { 
    activePlan, 
    addCourseToSemester, 
    checkCoursePrerequisites 
  } = useAcademic();

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTerm, setSelectedTerm] = useState<string>('ALL');
  const [prereqOnlyFilter, setPrereqOnlyFilter] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'code' | 'title' | 'credits' | 'difficulty'>('code');

  const [quickAddModalCourse, setQuickAddModalCourse] = useState<Course | null>(null);
  const [selectedSemId, setSelectedSemId] = useState<string>(activePlan.semesters[0]?.id || '');
  const [quickAddNotice, setQuickAddNotice] = useState<string | null>(null);

  const departments = useMemo(() => {
    const depts = new Set(COURSES_DATA.map(c => c.department));
    return ['ALL', ...Array.from(depts).sort()];
  }, []);
  const levels = ['ALL', '100', '200', '300', '400'];

  // Filtering and sorting logic
  const filteredCourses = useMemo(() => {
    return COURSES_DATA.filter(course => {
      // Search
      const q = search.toLowerCase();
      const matchSearch =
        course.code.toLowerCase().includes(q) ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        (course.tags || []).some((t: string) => t.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // Dept
      if (selectedDept !== 'ALL' && course.department !== selectedDept) return false;

      // Level
      if (selectedLevel !== 'ALL' && Math.floor(course.level / 100) * 100 !== parseInt(selectedLevel, 10)) {
        return false;
      }

      // Category
      if (selectedCategory !== 'ALL' && course.requirementCategory !== selectedCategory) return false;

      // Term
      if (selectedTerm !== 'ALL' && !course.termsOffered.includes(selectedTerm as TermType)) return false;

      // Prerequisite filter: show only courses user is eligible for
      if (prereqOnlyFilter) {
        const val = checkCoursePrerequisites(course.code, null);
        if (!val.satisfied) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'code') return a.code.localeCompare(b.code);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'credits') return b.credits - a.credits;
      if (sortBy === 'difficulty') return b.difficulty - a.difficulty;
      return 0;
    });
  }, [search, selectedDept, selectedLevel, selectedCategory, selectedTerm, prereqOnlyFilter, sortBy, checkCoursePrerequisites]);

  const handleQuickAdd = () => {
    if (!quickAddModalCourse || !selectedSemId) return;
    const ok = addCourseToSemester(selectedSemId, quickAddModalCourse.id);
    const sem = activePlan.semesters.find(s => s.id === selectedSemId);

    if (ok) {
      setQuickAddNotice(`Added ${quickAddModalCourse.code} to ${sem?.name}!`);
      setTimeout(() => {
        setQuickAddNotice(null);
        setQuickAddModalCourse(null);
      }, 1500);
    } else {
      setQuickAddNotice(`${quickAddModalCourse.code} already in this term.`);
      setTimeout(() => setQuickAddNotice(null), 1500);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats */}
      {/* Top Banner & Stats */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#17365D] text-white">
                Curriculum Registry
              </span>
              <span className="text-xs text-slate-500">
                Official Academic Bulletin · {COURSES_DATA.length} Total University Courses
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17365D] tracking-tight">
              Course Catalog & Syllabi Directory
            </h2>
            <p className="text-xs text-[#64748B] mt-1 max-w-2xl leading-relaxed">
              Search curriculum offerings, inspect prerequisite pathways, and analyze lecture, lab, and independent study commitments before enrolling.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 w-full md:w-auto">
            {onOpenProspectus && (
              <button
                onClick={onOpenProspectus}
                className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-xl text-xs font-bold bg-[#17365D] text-white hover:bg-[#0F2440] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#F4C95D]" />
                <span>Official Prospectus Sheet</span>
              </button>
            )}
            <button
              onClick={() => setPrereqOnlyFilter(!prereqOnlyFilter)}
              className={`w-full sm:w-auto justify-center px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border shadow-2xs cursor-pointer ${
                prereqOnlyFilter
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${prereqOnlyFilter ? 'text-white' : 'text-emerald-600'}`} />
              <span>{prereqOnlyFilter ? 'Showing: Ready to Enroll' : 'Filter: Prereqs Unlocked'}</span>
            </button>
          </div>
        </div>

        {/* Search & Comprehensive Filters */}
        <div className="mt-5 pt-5 border-t border-slate-100 space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by code, title, topic, or keyword (e.g. CS 310, Algorithms, Python)..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sort & View Mode */}
            <div className="flex items-center gap-2">
              <div className="w-48 sm:w-52">
                <CustomSelect
                  value={sortBy}
                  onChange={val => setSortBy(val as any)}
                  options={[
                    { value: 'code', label: 'Sort: Course Code' },
                    { value: 'title', label: 'Sort: Title (A-Z)' },
                    { value: 'credits', label: 'Sort: Credits (High-Low)' },
                    { value: 'difficulty', label: 'Sort: Difficulty (High-Low)' },
                  ]}
                  size="sm"
                  className="rounded-xl border-slate-200 bg-slate-50 text-slate-700"
                />
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-[#17365D] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-[#17365D] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Department Filter Bar - Clean Horizontal Scroll on Mobile */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider">
                Department
              </span>
              {selectedDept !== 'ALL' && (
                <button
                  onClick={() => setSelectedDept('ALL')}
                  className="text-[#2563EB] hover:underline font-semibold text-[10px]"
                >
                  Reset Dept ({selectedDept})
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs">
              {departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-3 py-1 rounded-lg font-semibold shrink-0 transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-none cursor-pointer text-xs ${
                    selectedDept === dept
                      ? 'bg-[#17365D] text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Level & Category Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
            {/* Level pills */}
            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mr-1">
                Level:
              </span>
              {levels.map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-none cursor-pointer text-xs ${
                    selectedLevel === lvl
                      ? 'bg-[#2563EB] text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {lvl === 'ALL' ? 'All' : `${lvl}s`}
                </button>
              ))}
            </div>

            {/* Category dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] sm:hidden shrink-0">
                Category:
              </span>
              <div className="w-full sm:w-48">
                <CustomSelect
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={[
                    { value: 'ALL', label: 'All Categories' },
                    { value: 'MajorCore', label: 'Major Core' },
                    { value: 'MajorElective', label: 'CS Electives' },
                    { value: 'MathScience', label: 'Math & Science' },
                    { value: 'GenEd', label: 'General Ed' },
                    { value: 'Capstone', label: 'Senior Capstone' },
                    { value: 'FreeElective', label: 'Free Electives' },
                  ]}
                  size="sm"
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Results Count bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 px-1 gap-1">
        <span>
          Showing <strong className="text-slate-800">{filteredCourses.length}</strong> catalog courses
        </span>
        <span className="truncate max-w-full sm:max-w-md">
          Active Plan: <strong className="text-[#17365D] font-medium">{activePlan.name}</strong>
        </span>
      </div>

      {/* Course Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">No courses match your active filters</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing search terms or department filters.</p>
            </div>
          ) : (
            filteredCourses.map(course => {
              const prereqValidation = checkCoursePrerequisites(course.code, null);

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-[#17365D] text-white">
                          {course.code}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-[#2563EB] border border-blue-100">
                          {course.credits} cr
                        </span>
                      </div>

                      {/* Prereq Status Chip */}
                      {course.prerequisites.length === 0 ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          No Prereqs
                        </span>
                      ) : prereqValidation.satisfied ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Prereqs Needed
                        </span>
                      )}
                    </div>

                    {/* Course Title */}
                    <h3 
                      onClick={() => onOpenCourse(course.id)}
                      className="font-bold text-sm text-[#17365D] group-hover:text-[#2563EB] transition-colors cursor-pointer line-clamp-1 leading-snug"
                    >
                      {course.title}
                    </h3>

                    {/* Course Description */}
                    <p className="text-xs text-[#64748B] line-clamp-2 mt-2 leading-relaxed">
                      {course.description}
                    </p>

                    {/* Prerequisites Tags */}
                    {course.prerequisites.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400 font-medium">Prereqs: </span>
                        <span className="font-mono text-slate-700">
                          {course.prerequisites.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Meta & Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {course.weeklyHours.lecture + course.weeklyHours.lab + course.weeklyHours.study}h/wk
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Star className="w-3 h-3 text-[#D9A834]" />
                        {course.difficulty.toFixed(1)} / 5
                      </span>
                      <span>
                        {course.termsOffered.join('·')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenCourse(course.id)}
                        className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                      >
                        Details
                      </button>

                      {onExplorePrerequisites && (
                        <button
                          onClick={() => onExplorePrerequisites(course.code)}
                          className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors flex items-center justify-center gap-1"
                          title="Explore Prerequisite Tree"
                        >
                          <GitFork className="w-3 h-3 text-indigo-600" />
                          <span>Prereqs</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setQuickAddModalCourse(course);
                          setSelectedSemId(activePlan.semesters[0]?.id || '');
                        }}
                        className="py-1.5 px-2.5 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Plan</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="bg-[#17365D] text-white text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">Course Code</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Credits</th>
                  <th className="px-4 py-3 font-semibold">Requirement</th>
                  <th className="px-4 py-3 font-semibold">Prerequisites</th>
                  <th className="px-4 py-3 font-semibold">Weekly Study</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.map(course => {
                  const prereqValidation = checkCoursePrerequisites(course.code, null);

                  return (
                    <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#17365D]">
                        {course.code}
                      </td>
                      <td className="px-4 py-3">
                        <p 
                          onClick={() => onOpenCourse(course.id)}
                          className="font-bold text-slate-800 hover:text-[#2563EB] cursor-pointer"
                        >
                          {course.title}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {course.termsOffered.join(', ')}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {course.credits}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {course.requirementCategory}
                      </td>
                      <td className="px-4 py-3">
                        {course.prerequisites.length === 0 ? (
                          <span className="text-emerald-700 text-[11px] font-medium">None</span>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[11px] text-slate-700">
                              {course.prerequisites.join(', ')}
                            </span>
                            {prereqValidation.satisfied ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {course.weeklyHours.lecture + course.weeklyHours.lab + course.weeklyHours.study} hrs/wk
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onExplorePrerequisites && (
                            <button
                              onClick={() => onExplorePrerequisites(course.code)}
                              className="px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded flex items-center gap-1"
                              title="Explore Prerequisite Tree"
                            >
                              <GitFork className="w-3 h-3 text-indigo-600" />
                              Prereqs
                            </button>
                          )}
                          <button
                            onClick={() => onOpenCourse(course.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 rounded"
                          >
                            Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Add Modal Popup */}
      {quickAddModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-base text-[#17365D] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2563EB]" />
              Schedule {quickAddModalCourse.code}
            </h3>
            <p className="text-xs text-slate-600">
              Select which term in <strong>{activePlan.name}</strong> to place <strong>{quickAddModalCourse.title}</strong>:
            </p>

            <CustomSelect
              value={selectedSemId}
              onChange={setSelectedSemId}
              options={activePlan.semesters.map(sem => ({
                value: sem.id,
                label: `${sem.name.replace(/\s*\(Current\)/i, '')} (${sem.academicYear})`,
                badge: sem.isCompleted ? 'Completed' : sem.isCurrent ? 'Current' : undefined,
                badgeColor: sem.isCompleted ? 'emerald' : sem.isCurrent ? 'blue' : undefined,
              }))}
              size="sm"
              className="rounded-xl border-slate-300"
            />

            {quickAddNotice && (
              <p className="text-xs font-bold text-blue-700 bg-blue-50 p-2 rounded-lg">
                {quickAddNotice}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setQuickAddModalCourse(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickAdd}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              >
                Confirm Add
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
