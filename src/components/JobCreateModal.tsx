import React, { useState, useEffect } from 'react';
import { Briefcase, X, Sparkles, Check, Sliders } from 'lucide-react';
import { Job, WorkplaceType, EmploymentType, ScoringWeights } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface JobCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (job: Job) => void;
  initialData?: Partial<Job>;
  onOpenExtractor: () => void;
}

export const JobCreateModal: React.FC<JobCreateModalProps> = ({
  isOpen,
  onClose,
  onJobCreated,
  initialData,
  onOpenExtractor,
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
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['TypeScript', 'React', 'Node.js', 'PostgreSQL']);
  const [preferredSkills, setPreferredSkills] = useState<string[]>(['Docker', 'Kubernetes', 'GraphQL']);
  const [experienceMinYears, setExperienceMinYears] = useState(5);
  const [educationLevel, setEducationLevel] = useState("Bachelor's Degree in Computer Science or related STEM field");
  const [skillInput, setSkillInput] = useState('');
  const [prefSkillInput, setPrefSkillInput] = useState('');
  const [loading, setLoading] = useState(false);

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
  }, [initialData]);

  if (!isOpen) return null;

  const totalWeight =
    weights.requiredSkills +
    weights.experience +
    weights.education +
    weights.projects +
    weights.preferredSkills;

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
        requirementsApproved: true,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
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
              type="button"
              onClick={onOpenExtractor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI JD Auto-Extract</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-5">
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
                placeholder="Type skill & press Enter (e.g. Python, Docker, PyTorch)"
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={addRequiredSkill}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
              >
                Add
              </button>
            </div>
          </div>

          {/* Preferred Skills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Preferred / Bonus Skills
            </label>
            <div className="flex flex-wrap gap-1.5">
              {preferredSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
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
                  Bonus Skills ({weights.preferredSkills}%)
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
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Overview & Responsibilities
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Full role description and key impact areas..."
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
