import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  X,
  Check,
  Sliders,
  Plus,
  Upload,
  FileText,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Job, WorkplaceType, EmploymentType, ScoringWeights } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { readFileText, formatFileSize } from '../utils/fileUpload';

interface JobCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (job: Job) => void;
  initialData?: Partial<Job>;
  initialFile?: File;
  onOpenExtractor?: () => void;
}

export const JobCreateModal: React.FC<JobCreateModalProps> = ({
  isOpen,
  onClose,
  onJobCreated,
  initialData,
  initialFile,
}) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('San Francisco, CA');
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType>('hybrid');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('full_time');
  const [salaryMin, setSalaryMin] = useState(160000);
  const [salaryMax, setSalaryMax] = useState(210000);
  const [openingsCount, setOpeningsCount] = useState(1);
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([
    'TypeScript',
    'React',
    'Node.js',
    'PostgreSQL',
  ]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>(['Docker', 'Kubernetes', 'GraphQL']);
  const [experienceMinYears, setExperienceMinYears] = useState(5);
  const [educationLevel, setEducationLevel] = useState("Bachelor's Degree in Computer Science or related STEM field");
  const [skillInput, setSkillInput] = useState('');
  const [prefSkillInput, setPrefSkillInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Drag-and-drop & JD file ingestion
  const [isDragging, setIsDragging] = useState(false);
  const [loadingJd, setLoadingJd] = useState(false);
  const [attachedJd, setAttachedJd] = useState<{
    fileName: string;
    size: number;
  } | null>(null);

  const jdFileInputRef = useRef<HTMLInputElement>(null);

  // Scoring weights configuration
  const [weights, setWeights] = useState<ScoringWeights>({
    requiredSkills: 40,
    experience: 25,
    education: 15,
    projects: 10,
    preferredSkills: 10,
  });

  useEffect(() => {
    if (initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.department) setDepartment(initialData.department);
      if (initialData.description) setDescription(initialData.description);
      if (initialData.requiredSkills) setRequiredSkills(initialData.requiredSkills);
      if (initialData.preferredSkills) setPreferredSkills(initialData.preferredSkills);
      if (initialData.experienceMinYears) setExperienceMinYears(initialData.experienceMinYears);
      if (initialData.educationLevel) setEducationLevel(initialData.educationLevel);
    }
    if (initialFile) {
      handleJdFile(initialFile);
    }
  }, [initialData, initialFile]);

  if (!isOpen) return null;

  const totalWeight =
    weights.requiredSkills +
    weights.experience +
    weights.education +
    weights.projects +
    weights.preferredSkills;

  const handleJdFile = async (file: File) => {
    setLoadingJd(true);
    try {
      const text = await readFileText(file);
      setDescription(text);
      setAttachedJd({
        fileName: file.name,
        size: file.size,
      });

      // If title is currently blank, infer from first line or file name
      if (!title.trim()) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\bjd\b|\bjob description\b/gi, '')
          .trim();
        if (cleanName.length > 3) {
          setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        } else {
          const firstLine = text.split('\n').map((l) => l.trim()).find((l) => l.length > 5 && l.length < 60);
          if (firstLine) setTitle(firstLine);
        }
      }

      // Check common tech skills to pre-populate if found in text
      const commonSkills = [
        'TypeScript', 'JavaScript', 'React', 'Node.js', 'Python', 'Go', 'Java',
        'Rust', 'Kubernetes', 'Docker', 'AWS', 'GCP', 'Azure', 'PostgreSQL',
        'MySQL', 'GraphQL', 'Next.js', 'Tailwind CSS', 'Redis', 'Kafka',
      ];
      const detected = commonSkills.filter((s) => {
        const re = new RegExp(`\\b${s}\\b`, 'i');
        return re.test(text);
      });
      if (detected.length > 0) {
        setRequiredSkills(Array.from(new Set([...requiredSkills, ...detected.slice(0, 5)])));
      }

      // Detect experience years if mentioned e.g. "5+ years", "3-5 years", "4 years"
      const expMatch = text.match(/(\d+)\+?\s*(?:-\s*\d+)?\s*years?(?:\s+of)?\s+(?:experience|exp)/i);
      if (expMatch && expMatch[1]) {
        const yrs = parseInt(expMatch[1], 10);
        if (yrs > 0 && yrs < 30) {
          setExperienceMinYears(yrs);
        }
      }
    } catch (e) {
      console.error('Failed to parse JD file:', e);
    } finally {
      setLoadingJd(false);
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
      await handleJdFile(e.dataTransfer.files[0]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const created = await api.createJob({
        title,
        department,
        location,
        workplaceType,
        employmentType,
        salaryMin,
        salaryMax,
        salaryCurrency: 'USD',
        status: 'published',
        description,
        responsibilities: [
          'Design and maintain production services with high performance and security.',
          'Collaborate with product, UX, and fellow engineers on user features.',
        ],
        requiredSkills,
        preferredSkills,
        experienceMinYears,
        educationLevel,
        certifications: [],
        openingsCount,
        hiringManagerId: user?.id || 'usr_maria',
        recruiterId: user?.id || 'usr_david',
        scoringWeights: weights,
      });

      onJobCreated(created);
      onClose();
    } catch (err) {
      console.error('Failed to create job:', err);
    } finally {
      setLoading(false);
    }
  };

  const addRequiredSkill = () => {
    if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
      setRequiredSkills([...requiredSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const addPrefSkill = () => {
    if (prefSkillInput.trim() && !preferredSkills.includes(prefSkillInput.trim())) {
      setPreferredSkills([...preferredSkills, prefSkillInput.trim()]);
      setPrefSkillInput('');
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
        ref={jdFileInputRef}
        accept=".txt,.md,.pdf,.docx,.doc,.json"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleJdFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Create New Job Opening
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define job details, approved requirements, and match scoring weight distributions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Import JD Document Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-3.5 rounded-xl border-2 border-dashed transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30'
            }`}
          >
            {!attachedJd ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-100/60 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 shrink-0">
                    {loadingJd ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {loadingJd
                        ? 'Loading Job Description...'
                        : isDragging
                        ? 'Drop JD document here'
                        : 'Drag & Drop Job Description (TXT, MD, PDF, DOCX)'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Optionally drop a file to populate description, title, and key technical skills.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => jdFileInputRef.current?.click()}
                  disabled={loadingJd}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Import JD File</span>
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
                      <span>{attachedJd.fileName}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ({formatFileSize(attachedJd.size)})
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                      ✓ Job description loaded and populated below
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => jdFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>Replace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachedJd(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                    title="Remove attached JD"
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
                Job Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Staff Distributed Systems Engineer"
                className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product Engineering">Product Engineering</option>
                <option value="Design">Product Design</option>
                <option value="Infrastructure">Infrastructure & Cloud</option>
                <option value="Data & Analytics">Data & Analytics</option>
                <option value="Human Resources">Human Resources</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Workplace Type
              </label>
              <select
                value={workplaceType}
                onChange={(e) => setWorkplaceType(e.target.value as WorkplaceType)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-Site</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="full_time">Full-Time</option>
                <option value="contract">Contract</option>
                <option value="part_time">Part-Time</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Salary & Openings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Min Salary (USD)
              </label>
              <input
                type="number"
                step={5000}
                value={salaryMin}
                onChange={(e) => setSalaryMin(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Max Salary (USD)
              </label>
              <input
                type="number"
                step={5000}
                value={salaryMax}
                onChange={(e) => setSalaryMax(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Target Openings
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={openingsCount}
                onChange={(e) => setOpeningsCount(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Required Skills Badges */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Required Skills (Hard Criteria)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {requiredSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => setRequiredSkills(requiredSkills.filter((_, i) => i !== idx))}
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
                    addRequiredSkill();
                  }
                }}
                placeholder="Type skill & press Enter"
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={addRequiredSkill}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
              >
                Add
              </button>
            </div>
          </div>

          {/* Preferred Skills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Preferred Skills (Soft Criteria)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {preferredSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => setPreferredSkills(preferredSkills.filter((_, i) => i !== idx))}
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
                value={prefSkillInput}
                onChange={(e) => setPrefSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addPrefSkill();
                  }
                }}
                placeholder="Type bonus skill & press Enter"
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={addPrefSkill}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
              >
                Add
              </button>
            </div>
          </div>

          {/* Min Experience & Education */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Minimum Experience (Years)
              </label>
              <input
                type="number"
                min={0}
                max={25}
                value={experienceMinYears}
                onChange={(e) => setExperienceMinYears(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Education Requirement
              </label>
              <input
                type="text"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Configurable Match Scoring Weights */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>Candidate Match Scoring Weights (Total: {totalWeight}%)</span>
              </span>
              {totalWeight !== 100 && (
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  (Will auto-normalize to 100%)
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  Req. Skills ({weights.requiredSkills}%)
                </label>
                <input
                  type="range"
                  min={10}
                  max={70}
                  value={weights.requiredSkills}
                  onChange={(e) => setWeights({ ...weights, requiredSkills: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  Experience ({weights.experience}%)
                </label>
                <input
                  type="range"
                  min={10}
                  max={60}
                  value={weights.experience}
                  onChange={(e) => setWeights({ ...weights, experience: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  Education ({weights.education}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={weights.education}
                  onChange={(e) => setWeights({ ...weights, education: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  Projects ({weights.projects}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={weights.projects}
                  onChange={(e) => setWeights({ ...weights, projects: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  Pref. Skills ({weights.preferredSkills}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={weights.preferredSkills}
                  onChange={(e) => setWeights({ ...weights, preferredSkills: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Overview & Responsibilities
              </label>
              <button
                type="button"
                onClick={() => jdFileInputRef.current?.click()}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Upload JD File</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Full role description, requirements, and key impact areas (or drag & drop a file here)..."
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
              disabled={loading || !title.trim()}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 disabled:opacity-50 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Publishing...' : 'Publish Job Opening'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
