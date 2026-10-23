import React, { useState } from 'react';
import { 
  BookmarkCheck, 
  Layers, 
  Plus, 
  Copy, 
  Trash2, 
  Check, 
  Download, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Printer
} from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { COURSE_BY_ID_MAP } from '../data/coursesData';
import { TARGET_GRADUATION_CREDITS } from '../data/degreeRequirements';
import { CustomSelect } from '../components/common/CustomSelect';

interface SavedPlansPageProps {
  onNavigate?: (page: string) => void;
}

export const SavedPlansPage: React.FC<SavedPlansPageProps> = ({ onNavigate }) => {
  const { 
    plans, 
    activePlanId, 
    setActivePlanId, 
    createPlan, 
    deletePlan, 
    exportDataJson 
  } = useAcademic();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [duplicateFromId, setDuplicateFromId] = useState<string>(activePlanId);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;

    createPlan(newPlanName.trim(), newPlanDesc.trim(), duplicateFromId || undefined);
    setNewPlanName('');
    setNewPlanDesc('');
    setIsCreateModalOpen(false);
  };

  const handleExportDownload = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CourseAdvisor_AcademicPlan_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrintSchedule = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#17365D] text-white">
                Degree Plan Registry
              </span>
              <span className="text-xs text-slate-500">
                Manage Multi-Track Scenarios & Grad Paths
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#17365D] tracking-tight">
              My Saved Academic Plans & Tracks
            </h2>
            <p className="text-xs text-[#64748B] mt-1 max-w-2xl">
              Create and compare multiple graduation trajectories: standard four-year paths, accelerated summer terms, or specialized concentrations. Switch your active roadmap anytime.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportDownload}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>{downloadSuccess ? 'Downloaded!' : 'Export JSON'}</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map(plan => {
          const isActive = plan.id === activePlanId;
          const totalCredits = plan.semesters.reduce((acc, sem) => {
            return acc + sem.courseIds.reduce((cAcc, cId) => {
              const c = COURSE_BY_ID_MAP.get(cId);
              return cAcc + (c?.credits || 0);
            }, 0);
          }, 0);

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between shadow-xs transition-all ${
                isActive
                  ? 'border-[#2563EB] ring-2 ring-blue-100'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {plan.semesters.length} Semesters
                  </span>
                  {isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2563EB] text-white flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Active Track
                    </span>
                  ) : (
                    <button
                      onClick={() => setActivePlanId(plan.id)}
                      className="text-xs font-semibold text-[#2563EB] hover:underline"
                    >
                      Make Active
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-base text-[#17365D]">
                  {plan.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {plan.description || 'Custom academic pathway for graduation.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mapped Credits</span>
                    <strong className="text-slate-800 font-bold">{totalCredits} / {TARGET_GRADUATION_CREDITS} cr</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Final Term</span>
                    <strong className="text-slate-800 font-bold">
                      {plan.semesters[plan.semesters.length - 1]?.name || 'N/A'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setActivePlanId(plan.id);
                    if (onNavigate) onNavigate('Academic Planner');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#17365D] hover:bg-[#2563EB] text-white transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Open in Planner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      createPlan(`${plan.name} (Copy)`, plan.description, plan.id);
                    }}
                    className="px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center gap-1"
                    title="Duplicate Plan"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Clone</span>
                  </button>

                  {plans.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${plan.name}"?`)) {
                          deletePlan(plan.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-side Plan Comparison Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <h3 className="font-bold text-base text-[#17365D] mb-4">
          Degree Track Comparison Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-y border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Track Name</th>
                <th className="px-4 py-3 font-semibold">Semesters</th>
                <th className="px-4 py-3 font-semibold">Total Credits</th>
                <th className="px-4 py-3 font-semibold">Average Cr/Term</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Switch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.map(p => {
                const totalCreds = p.semesters.reduce((acc, sem) => {
                  return acc + sem.courseIds.reduce((cAcc, cId) => {
                    const c = COURSE_BY_ID_MAP.get(cId);
                    return cAcc + (c?.credits || 0);
                  }, 0);
                }, 0);
                const avg = p.semesters.length > 0 ? (totalCreds / p.semesters.length).toFixed(1) : 0;
                const isActive = p.id === activePlanId;

                return (
                  <tr key={p.id} className={isActive ? 'bg-blue-50/50 font-medium' : ''}>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {p.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.semesters.length} terms
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {totalCreds} cr
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      ~{avg} cr/term
                    </td>
                    <td className="px-4 py-3">
                      {isActive ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                        </span>
                      ) : (
                        <span className="text-slate-400">Alternative Track</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isActive && (
                        <button
                          onClick={() => setActivePlanId(p.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 text-[#2563EB] hover:bg-blue-50 rounded"
                        >
                          Select
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Plan Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-base text-[#17365D] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#2563EB]" />
              Create New Academic Degree Plan
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cybersecurity Track, 3-Year Fast Track"
                  value={newPlanName}
                  onChange={e => setNewPlanName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Description / Focus
                </label>
                <textarea
                  rows={2}
                  placeholder="Goals, target graduation term, elective focus..."
                  value={newPlanDesc}
                  onChange={e => setNewPlanDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Initialize From Template
                </label>
                <CustomSelect
                  value={duplicateFromId}
                  onChange={setDuplicateFromId}
                  options={[
                    { value: '', label: 'Start Empty Structure' },
                    ...plans.map(p => ({
                      value: p.id,
                      label: `Duplicate from: ${p.name}`,
                      sublabel: `${p.semesters.length} Semesters`,
                    })),
                  ]}
                  size="sm"
                  className="rounded-xl border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
