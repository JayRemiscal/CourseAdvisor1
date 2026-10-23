import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  GraduationCap, 
  Sliders, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  AlertCircle, 
  Info,
  ShieldCheck,
  BookOpen,
  Database,
  Cloud
} from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { useAuth } from '../context/AuthContext';
import { SecurityAndPersistenceTestPanel } from '../components/auth/SecurityAndPersistenceTestPanel';
import { SyncStatusBadge } from '../components/common/SyncStatusBadge';
import { TermType } from '../types/academic';
import { CustomSelect } from '../components/common/CustomSelect';

export const SettingsPage: React.FC = () => {
  const { 
    profile, 
    updateProfile, 
    resetToDefaults, 
    exportDataJson, 
    importDataJson 
  } = useAcademic();
  const { currentUser, isDbConnected, dbConnectionMessage, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [formData, setFormData] = useState(profile);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [importJsonText, setImportJsonText] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setSaveMessage('Academic profile updated successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleReset = () => {
    if (confirm('Reset all academic data, plans, and grades to the initial sample state? This cannot be undone.')) {
      resetToDefaults();
      setFormData(profile);
      setSaveMessage('All academic data restored to defaults.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleImportSubmit = () => {
    setImportError(null);
    if (!importJsonText.trim()) {
      setImportError('Please paste valid JSON data.');
      return;
    }

    const success = importDataJson(importJsonText);
    if (success) {
      setIsImportModalOpen(false);
      setImportJsonText('');
      setSaveMessage('Academic data imported successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setImportError('Failed to parse or invalid data structure. Please verify JSON format.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#17365D] text-white">
            System Preferences
          </span>
          <span className="text-xs text-slate-500">
            Student Identity & Degree Parameters
          </span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#17365D] tracking-tight">
          Academic Profile & System Settings
        </h2>
        <p className="text-xs text-[#64748B] mt-1">
          Configure degree parameters, catalog year requirements, study hour tolerance thresholds, and persistent storage backups.
        </p>

        {/* Tab Navigation Controls */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold mt-5 max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-[#17365D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-[#2563EB]" />
            <span>Profile & Parameters</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'security'
                ? 'bg-white text-[#17365D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cloud & Security Suite</span>
          </button>
        </div>

        {saveMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveMessage}</span>
          </div>
        )}
      </div>

      {activeTab === 'security' ? (
        <SecurityAndPersistenceTestPanel />
      ) : (
        <>
          <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* Student Identity Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-[#17365D] flex items-center gap-2">
            <User className="w-4 h-4 text-[#2563EB]" />
            Student Identity & University Enrollment
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Full Student Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Student Identification ID
              </label>
              <input
                type="text"
                value={formData.studentId}
                onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                University Institution
              </label>
              <input
                type="text"
                value={formData.university}
                onChange={e => setFormData({ ...formData, university: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Student Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>
        </div>

        {/* Academic Program & Catalog Year */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-[#17365D] flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#2563EB]" />
            Academic Program & Catalog Year
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Declared Major Degree
              </label>
              <CustomSelect
                value={formData.major}
                onChange={val => setFormData({ ...formData, major: val })}
                options={[
                  { value: 'Bachelor of Science in Environmental Science', label: 'Bachelor of Science in Environmental Science' },
                  { value: 'Bachelor of Science in Marine Biology', label: 'Bachelor of Science in Marine Biology' },
                  { value: 'Bachelor of Science in Fisheries', label: 'Bachelor of Science in Fisheries' },
                  { value: 'Computer Science, B.S.', label: 'Computer Science, B.S.' },
                ]}
                size="sm"
                className="rounded-xl border-slate-300"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Declared Minor / Field Concentration
              </label>
              <input
                type="text"
                value={formData.minor}
                onChange={e => setFormData({ ...formData, minor: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Degree Catalog Year & Prospectus
              </label>
              <CustomSelect
                value={formData.catalogYear}
                onChange={val => setFormData({ ...formData, catalogYear: val })}
                options={[
                  { value: 'SY 2025–2026', label: 'SY 2025–2026 (BOR No. 357, S. 2017)' },
                  { value: 'SY 2024–2025', label: 'SY 2024–2025' },
                  { value: 'SY 2023–2024', label: 'SY 2023–2024' },
                ]}
                size="sm"
                className="rounded-xl border-slate-300"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Target Graduation Term & Year
              </label>
              <div className="flex gap-2">
                <div className="w-1/2">
                  <CustomSelect<TermType>
                    value={formData.targetGradTerm}
                    onChange={val => setFormData({ ...formData, targetGradTerm: val })}
                    options={[
                      { value: 'Spring', label: 'Spring' },
                      { value: 'Fall', label: 'Fall' },
                      { value: 'Summer', label: 'Summer' },
                    ]}
                    size="sm"
                    className="rounded-xl border-slate-300"
                  />
                </div>
                <input
                  type="number"
                  value={formData.targetGradYear}
                  onChange={e => setFormData({ ...formData, targetGradYear: parseInt(e.target.value, 10) })}
                  className="w-1/2 px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Workload and Targets */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-[#17365D] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#2563EB]" />
            Academic Targets & Workload Limits
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Target Cumulative GPA
              </label>
              <input
                type="number"
                step="0.05"
                min="2.0"
                max="4.0"
                value={formData.targetGpa}
                onChange={e => setFormData({ ...formData, targetGpa: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Used in GPA target simulator</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Max Credits Per Semester
              </label>
              <input
                type="number"
                min="12"
                max="24"
                value={formData.maxCreditsPerTerm}
                onChange={e => setFormData({ ...formData, maxCreditsPerTerm: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Flags overload warnings</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Max Weekly Study Hours
              </label>
              <input
                type="number"
                min="20"
                max="70"
                value={formData.maxWeeklyHoursLimit}
                onChange={e => setFormData({ ...formData, maxWeeklyHoursLimit: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Controls burnout warnings</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors shadow-2xs"
            >
              Save Profile Preferences
            </button>
          </div>
        </div>

      </form>

      {/* Storage & Data Management */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-[#17365D] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Data Backup & Persistent Storage
        </h3>
        <p className="text-xs text-slate-600">
          CourseAdvisor stores your plans and grades in browser local storage. You can export a full JSON backup to save or transfer to another device.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => {
              const dataStr = exportDataJson();
              const blob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `CourseAdvisor_Backup_${profile.name.replace(/\s+/g, '_')}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Complete Backup</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import Backup JSON</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5 ml-auto"
          >
            <RotateCcw className="w-4 h-4 text-rose-500" />
            <span>Restore Default Sample Data</span>
          </button>
        </div>
      </div>

      {/* Architecture & Limitations Section */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-[#17365D] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#2563EB]" />
          System Architecture, Logic & Roadmap
        </h4>
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            <strong>Prerequisite Timing Logic:</strong> CourseAdvisor validates not just whether you've taken a prerequisite, but <em>when</em>. Courses placed in the same semester or subsequent to a dependent course are actively flagged as invalid concurrent enrollments.
          </p>
          <p>
            <strong>Workload Formula:</strong> Calculations follow the standardized Carnegie unit rule (1 credit = 1 lecture hr + 2 independent study hrs/wk) combined with individual course project and exam intensity multipliers.
          </p>
          <p>
            <strong>Future Capabilities on Roadmap:</strong> Official SIS (Student Information System) API sync, degree audit PDF certificate generation, waitlist probability tracking, and collaborative multi-advisor shared comments.
          </p>
        </div>
      </div>
      </>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-lg w-full space-y-4">
            <h3 className="font-bold text-base text-[#17365D]">
              Import Academic Data Backup
            </h3>
            <p className="text-xs text-slate-600">
              Paste the exported CourseAdvisor JSON content below to restore all profile data, degree plans, and grade records:
            </p>

            <textarea
              rows={8}
              value={importJsonText}
              onChange={e => setImportJsonText(e.target.value)}
              placeholder="Paste JSON here..."
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />

            {importError && (
              <p className="text-xs text-rose-600 font-medium">
                {importError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              >
                Restore Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
