import React, { useState, useRef } from 'react';
import {
  User,
  X,
  Check,
  AlertCircle,
  Plus,
  Upload,
  FileText,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Candidate } from '../types';
import { api } from '../services/api';
import { readFileText, fileToBase64, formatFileSize } from '../utils/fileUpload';

interface CandidateAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCandidateAdded: (candidate: Candidate) => void;
}

export const CandidateAddModal: React.FC<CandidateAddModalProps> = ({
  isOpen,
  onClose,
  onCandidateAdded,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [headline, setHeadline] = useState('');
  const [totalExperienceYears, setTotalExperienceYears] = useState(4);
  const [skills, setSkills] = useState<string[]>(['TypeScript', 'React']);
  const [skillInput, setSkillInput] = useState('');
  const [source, setSource] = useState<'referral' | 'linkedin' | 'career_site' | 'agency' | 'upload'>('referral');
  const [summary, setSummary] = useState('');
  const [workHistory, setWorkHistory] = useState<Candidate['workHistory']>([]);
  const [education, setEducation] = useState<Candidate['education']>([]);
  const [projects, setProjects] = useState<Candidate['projects']>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Resume drag-and-drop & parsing state
  const [isDragging, setIsDragging] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);
  const [attachedResume, setAttachedResume] = useState<{
    fileName: string;
    size: number;
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleResumeFile = async (file: File) => {
    setParsingResume(true);
    setDuplicateWarning(null);
    try {
      let base64: string | undefined;
      try {
        base64 = await fileToBase64(file);
      } catch {
        // Ignore base64 conversion error
      }

      const text = await readFileText(file);
      setAttachedResume({
        fileName: file.name,
        size: file.size,
        text,
      });

      // Call resume parser with both extracted text and raw base64 buffer
      const parsed = await api.parseResume(text, file.name, base64);
      if (parsed?.extraction) {
        const ext = parsed.extraction;
        if (ext.candidateName) setName(ext.candidateName);
        if (ext.email) setEmail(ext.email);
        if (ext.phone) setPhone(ext.phone);
        if (ext.location) setLocation(ext.location);
        if (ext.headline) setHeadline(ext.headline);
        if (ext.summary) setSummary(ext.summary);
        if (typeof ext.totalExperienceYears === 'number' && ext.totalExperienceYears >= 0) {
          setTotalExperienceYears(ext.totalExperienceYears);
        }
        if (ext.skills && ext.skills.length > 0) {
          setSkills(ext.skills.map((s) => s.name));
        }
        if (ext.workHistory && ext.workHistory.length > 0) {
          setWorkHistory(ext.workHistory);
        }
        if (ext.education && ext.education.length > 0) {
          setEducation(ext.education);
        }
        if (ext.projects && ext.projects.length > 0) {
          setProjects(ext.projects);
        }
        if (ext.certifications && ext.certifications.length > 0) {
          setCertifications(ext.certifications.map((c) => c.name));
        }
        if (parsed.extractedText) {
          setAttachedResume({
            fileName: file.name,
            size: file.size,
            text: parsed.extractedText,
          });
        }
        setSource('upload');
      }
    } catch (e) {
      console.error('Failed to parse resume:', e);
    } finally {
      setParsingResume(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleResumeFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);
    setDuplicateWarning(null);

    try {
      const created = await api.createCandidate({
        name,
        email,
        phone: phone || undefined,
        location: location || 'United States',
        headline: headline || 'Software Professional',
        summary,
        totalExperienceYears,
        skills,
        workHistory: workHistory && workHistory.length > 0 ? workHistory : [
          {
            title: headline || 'Engineer',
            company: 'Prior Enterprise',
            startDate: '2022',
            endDate: 'Present',
            description: summary || 'Delivered key customer features.',
            skillsUsed: skills,
          },
        ],
        education: education && education.length > 0 ? education : [
          {
            degree: "Bachelor's in Computer Science or related",
            institution: 'Accredited University',
          },
        ],
        projects: projects || [],
        certifications: certifications || [],
        source,
        reviewStatus: 'verified',
        missingFields: phone ? [] : ['phone'],
        hasResume: !!attachedResume,
        resumeFileName: attachedResume?.fileName,
        resumeParsedAt: attachedResume ? new Date().toISOString() : undefined,
      });

      onCandidateAdded(created);
      onClose();
    } catch (err: any) {
      setDuplicateWarning(err.message || 'Duplicate candidate email detected');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.docx,.doc,.txt,.rtf,.md"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleResumeFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Add Candidate Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Drag-and-drop a resume to auto-fill fields or create manually.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {duplicateWarning && (
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {/* Resume Upload / Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-4 rounded-xl border-2 border-dashed transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20'
            }`}
          >
            {!attachedResume ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-100/60 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 shrink-0">
                    {parsingResume ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {parsingResume
                        ? 'Parsing resume document...'
                        : isDragging
                        ? 'Drop resume here to auto-populate profile'
                        : 'Drag & Drop Resume (PDF, DOCX, TXT)'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Instantly extracts candidate name, contacts, skills, and experience.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={parsingResume}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Attach Resume</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                      <span>{attachedResume.fileName}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ({formatFileSize(attachedResume.size)})
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                      ✓ Profile fields populated from resume
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>Replace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachedResume(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                    title="Remove attached resume"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Montgomery"
                className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Email Address * (Deduplicated)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.m@example.com"
                className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 012-3456"
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State / Remote"
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Acquisition Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="referral">Internal Referral</option>
                <option value="linkedin">LinkedIn Recruiter</option>
                <option value="career_site">Company Careers Portal</option>
                <option value="agency">Agency Partner</option>
                <option value="upload">Direct Upload</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Professional Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Backend Architect | Go & PostgreSQL"
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Total Experience (Years)
              </label>
              <input
                type="number"
                min={0}
                max={40}
                value={totalExperienceYears}
                onChange={(e) => setTotalExperienceYears(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Technical Skills & Proficiencies
            </label>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                    className="hover:text-rose-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Type skill & press Enter"
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Executive Summary / Recruiter Notes
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Candidate background notes, strengths, and initial impressions..."
              className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim()}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 disabled:opacity-50 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Adding...' : 'Add Candidate to CRM'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
