import React, { useState } from 'react';
import { User, X, Check, AlertCircle } from 'lucide-react';
import { Candidate } from '../types';
import { api } from '../services/api';

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
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
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
        workHistory: [
          {
            title: headline || 'Engineer',
            company: 'Prior Enterprise',
            startDate: '2022',
            endDate: 'Present',
            description: summary || 'Delivered key customer features.',
            skillsUsed: skills,
          },
        ],
        education: [
          {
            degree: "Bachelor's in Computer Science or related",
            institution: 'Accredited University',
          },
        ],
        projects: [],
        certifications: [],
        source,
        reviewStatus: 'verified',
        missingFields: phone ? [] : ['phone'],
        hasResume: false,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
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
                Manual profile creation with automated duplicate detection.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
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
