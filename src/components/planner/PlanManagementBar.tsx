import React, { useState } from 'react';
import { 
  Sparkles, 
  Save, 
  Copy, 
  Trash2, 
  Edit3, 
  Layers, 
  Check, 
  ChevronDown, 
  Plus, 
  Printer, 
  Download,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { AcademicPlan } from '../../types/academic';
import { TARGET_GRADUATION_CREDITS } from '../../data/degreeRequirements';

interface PlanManagementBarProps {
  onOpenGenerator: () => void;
  showExplanations: boolean;
  onToggleExplanations: () => void;
  onOpenAddTerm: () => void;
  onNavigateToWorkload?: () => void;
}

export const PlanManagementBar: React.FC<PlanManagementBarProps> = ({
  onOpenGenerator,
  showExplanations,
  onToggleExplanations,
  onOpenAddTerm,
  onNavigateToWorkload,
}) => {
  const { 
    plans, 
    activePlanId, 
    setActivePlanId, 
    activePlan, 
    saveActivePlan, 
    duplicatePlan, 
    renamePlan, 
    deletePlan,
    prerequisiteAlerts,
    exportDataJson,
    showToast
  } = useAcademic();

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameInput, setRenameInput] = useState(activePlan.name);
  const [renameDescInput, setRenameDescInput] = useState(activePlan.description);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);

  const handleStartRename = () => {
    setRenameInput(activePlan.name);
    setRenameDescInput(activePlan.description);
    setIsRenameOpen(true);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameInput.trim()) return;
    renamePlan(activePlan.id, renameInput.trim(), renameDescInput.trim());
    setIsRenameOpen(false);
  };

  const handleDelete = () => {
    if (plans.length <= 1) {
      showToast('Cannot delete the only available plan.', 'error');
      return;
    }
    deletePlan(activePlan.id);
    setIsDeleteConfirmOpen(false);
    showToast('Plan deleted.', 'info');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AcademicPlan_${activePlan.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Plan exported to JSON file.', 'success');
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4">
        
        {/* Top row: Plan switcher, status, and action buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          
          {/* Active Plan Selector & Quick Tools */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 min-w-0">
              <button
                onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 sm:px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-[#17365D] transition-colors shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Layers className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span className="truncate">{activePlan.name}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              </button>

              {/* Plan Switcher Dropdown */}
              {isPlanDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Switch Active Plan ({plans.length} Available)
                  </div>
                  {plans.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActivePlanId(p.id);
                        setIsPlanDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-blue-50 transition-colors cursor-pointer ${
                        p.id === activePlanId ? 'bg-blue-50/70 text-[#2563EB] font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{p.semesters.length} semesters</div>
                      </div>
                      {p.id === activePlanId && <Check className="w-4 h-4 text-[#2563EB] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Plan Utility Toolbar (Rename, Duplicate, Export, Print, Delete) */}
            <div className="flex items-center bg-slate-100/90 border border-slate-200/90 rounded-xl p-0.5 shrink-0">
              <button
                onClick={handleStartRename}
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#17365D] hover:bg-white transition-colors cursor-pointer"
                title="Rename Active Plan"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => duplicatePlan(activePlan.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#17365D] hover:bg-white transition-colors cursor-pointer"
                title="Duplicate Plan"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleExport}
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#17365D] hover:bg-white transition-colors cursor-pointer"
                title="Export JSON"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handlePrint}
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#17365D] hover:bg-white transition-colors cursor-pointer"
                title="Print Roadmap"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>

              {plans.length > 1 && (
                <button
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                  title="Delete Plan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Core Planner Action Buttons (Symmetric 2x2 on mobile, flex on desktop) */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full lg:w-auto">
            <button
              onClick={onOpenGenerator}
              className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs focus-visible:ring-2 focus-visible:ring-[#F4C95D] focus:outline-none cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F4C95D] shrink-0" />
              <span>Auto-Plan</span>
            </button>

            <button
              onClick={saveActivePlan}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs focus-visible:ring-2 focus-visible:ring-emerald-400 focus:outline-none cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 shrink-0" />
              <span>Save Plan</span>
            </button>

            <button
              onClick={onOpenAddTerm}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-none cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Add Term</span>
            </button>

            <button
              onClick={onToggleExplanations}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-none cursor-pointer ${
                showExplanations
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Toggle Course Placement Explanations"
            >
              {showExplanations ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Explanations</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Explanations</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom row: Plan health summary & timestamp */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-slate-600 text-[11px] sm:text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                Last Updated: <strong className="text-slate-800">{new Date(activePlan.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span>
                Terms: <strong className="text-[#17365D]">{activePlan.semesters.length} Semesters</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span>Sequence Status: </span>
              {prerequisiteAlerts.length === 0 ? (
                <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Prerequisites Validated
                </span>
              ) : (
                <span className="text-amber-700 font-bold inline-flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  {prerequisiteAlerts.length} Sequencing Alert(s)
                </span>
              )}
            </div>
          </div>

          {onNavigateToWorkload && (
            <button
              onClick={onNavigateToWorkload}
              className="text-[#2563EB] hover:underline font-bold text-xs flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              Assess in Workload Modeler &rarr;
            </button>
          )}
        </div>

      </div>

      {/* Rename Modal */}
      {isRenameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <form 
            onSubmit={handleSaveRename}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 p-6 sm:p-7 max-w-lg w-full space-y-5 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-[#2563EB]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-[#17365D]">
                    Rename Academic Plan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update the title and notes for this schedule scenario.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 text-xs sm:text-sm">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={renameInput}
                  onChange={e => setRenameInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB] shadow-2xs transition-all"
                  placeholder="e.g. MSU-Naawan BSES Official Plan"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5 text-xs sm:text-sm">
                  Description / Academic Notes
                </label>
                <textarea
                  value={renameDescInput}
                  onChange={e => setRenameDescInput(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#2563EB] shadow-2xs transition-all resize-y"
                  placeholder="Add curriculum matrix notes, batch year, or target milestones..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRenameOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-rose-200 p-6 sm:p-7 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-rose-700">
                  Delete Academic Plan?
                </h3>
                <p className="text-xs text-slate-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong>"{activePlan.name}"</strong>? This will remove all scheduled course terms in this roadmap scenario.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
