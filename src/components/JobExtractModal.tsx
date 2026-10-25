import React, { useState } from 'react';
import {
  Sparkles,
  X,
  CheckCircle,
  AlertTriangle,
  FileText,
  Quote,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { JDExtractionResult, Job } from '../types';
import { api } from '../services/api';

interface JobExtractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRequirements: (extracted: Partial<Job>) => void;
}

export const JobExtractModal: React.FC<JobExtractModalProps> = ({
  isOpen,
  onClose,
  onApplyRequirements,
}) => {
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JDExtractionResult | null>(null);

  // Editable requirements state for human-in-the-loop recruiter review & approval
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDepartment, setEditedDepartment] = useState('');
  const [editedRequiredSkills, setEditedRequiredSkills] = useState<string[]>([]);
  const [editedPreferredSkills, setEditedPreferredSkills] = useState<string[]>([]);
  const [editedExpYears, setEditedExpYears] = useState(4);
  const [editedEduLevel, setEditedEduLevel] = useState('');
  const [newSkillInput, setNewSkillInput] = useState('');

  if (!isOpen) return null;

  const handleExtract = async () => {
    if (!jdText.trim()) return;
    setLoading(true);
    try {
      const data = await api.extractJD(jdText);
      setResult(data);
      setEditedTitle(data.jobTitle || '');
      setEditedDepartment(data.department || 'Engineering');
      setEditedRequiredSkills(data.requiredSkills.map((s) => s.skill));
      setEditedPreferredSkills(data.preferredSkills.map((s) => s.skill));
      setEditedExpYears(data.experienceYearsMin || 4);
      setEditedEduLevel(data.educationLevel || "Bachelor's Degree in Computer Science or related field");
    } catch (e) {
      console.error('JD extraction error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndUse = () => {
    if (!result) return;
    onApplyRequirements({
      title: editedTitle,
      department: editedDepartment,
      description: jdText,
      requiredSkills: editedRequiredSkills,
      preferredSkills: editedPreferredSkills,
      experienceMinYears: editedExpYears,
      educationLevel: editedEduLevel,
      responsibilities: result.responsibilities.map((r) => r.item),
      certifications: result.certifications.map((c) => c.name),
      requirementsApproved: true,
    });
    onClose();
  };

  const removeRequiredSkill = (index: number) => {
    setEditedRequiredSkills(editedRequiredSkills.filter((_, i) => i !== index));
  };

  const addRequiredSkill = () => {
    if (newSkillInput.trim()) {
      setEditedRequiredSkills([...editedRequiredSkills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                AI Job Description Processor & Verifier
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Extracts structured qualifications with verbatim evidence quotes. Requires explicit recruiter approval before saving.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input Job Description Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Paste Raw Job Description Text
              </label>
              <button
                type="button"
                onClick={() =>
                  setJdText(`Senior Full-Stack Cloud Engineer
Department: Engineering
Location: Remote (US)

About the Role:
We are looking for a Senior Full-Stack Cloud Engineer with at least 5 years of practical experience building resilient distributed microservices. You will collaborate on core platform APIs and design real-time data streaming pipelines.

Requirements:
- 5+ years building production web applications in Python and TypeScript.
- Strong proficiency with FastAPI, PostgreSQL, and Docker container architectures.
- Experience with Kubernetes cluster operations and CI/CD pipelines.
- Bachelor's or Master's degree in Computer Science or equivalent practical experience.

Preferred Qualifications:
- Familiarity with Vector Search engines and LLM integration patterns.
- AWS or GCP cloud architect certifications.`)
                }
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Insert Sample Engineering JD
              </button>
            </div>
            <textarea
              rows={6}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste full job description text, requirements, responsibilities, and experience guidelines..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <div className="flex justify-end">
              <button
                onClick={handleExtract}
                disabled={loading || !jdText.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Extracting & Validating...' : 'Extract Structured Requirements'}</span>
              </button>
            </div>
          </div>

          {/* Extracted & Verified Requirements Review */}
          {result && (
            <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in-50">
              {/* Human-in-the-loop Notification */}
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300">
                  <span className="font-bold">Human Verification Required:</span> AI extraction is advisory. Review the extracted qualifications and verified supporting evidence quotes below. Edit any values before approving.
                </div>
              </div>

              {/* Title & Department Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Extracted Job Title
                  </label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editedDepartment}
                    onChange={(e) => setEditedDepartment(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Required Skills with Evidence Quotes */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Required Mandatory Skills ({editedRequiredSkills.length})</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    With supporting citation quotes
                  </span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {editedRequiredSkills.map((skill, idx) => {
                    const originalItem = result.requiredSkills.find((s) => s.skill === skill);
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-start justify-between gap-2"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{skill}</span>
                          </div>
                          {originalItem?.evidence && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 italic flex items-center gap-1">
                              <Quote className="w-3 h-3 shrink-0 text-slate-400" />
                              <span className="truncate">"{originalItem.evidence}"</span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRequiredSkill(idx)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="Add additional required skill..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={addRequiredSkill}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
                  >
                    Add Skill
                  </button>
                </div>
              </div>

              {/* Experience & Education Verification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Min Required Experience (Years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={editedExpYears}
                    onChange={(e) => setEditedExpYears(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  {result.experienceEvidence && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      Quote: "{result.experienceEvidence}"
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Education Level
                  </label>
                  <input
                    type="text"
                    value={editedEduLevel}
                    onChange={(e) => setEditedEduLevel(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  {result.educationEvidence && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      Quote: "{result.educationEvidence}"
                    </div>
                  )}
                </div>
              </div>

              {/* Uncertain Items Flagged by AI */}
              {result.uncertainItems && result.uncertainItems.length > 0 && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/30 space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                    <span>Uncertain / Ambiguous Items Flagged</span>
                  </span>
                  <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc list-inside space-y-0.5">
                    {result.uncertainItems.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          {result && (
            <button
              onClick={handleApproveAndUse}
              className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve & Apply to Job Requisition</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
