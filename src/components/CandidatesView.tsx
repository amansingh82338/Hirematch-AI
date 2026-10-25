import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Sparkles,
  MapPin,
  Briefcase,
  FileText,
  ShieldCheck,
  AlertTriangle,
  GitCompare,
  Calendar,
  ExternalLink,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { Candidate, CandidateReviewStatus } from '../types';
import { api } from '../services/api';
import { CandidateAddModal } from './CandidateAddModal';
import { BulkResumeModal } from './BulkResumeModal';
import { CandidateDetailModal } from './CandidateDetailModal';
import { NavTab } from './Sidebar';

interface CandidatesViewProps {
  onNavigate: (tab: NavTab, meta?: any) => void;
  openBulkImmediately?: boolean;
}

export const CandidatesView: React.FC<CandidatesViewProps> = ({
  onNavigate,
  openBulkImmediately = false,
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [minExp, setMinExp] = useState<number | undefined>(undefined);
  const [reviewStatusFilter, setReviewStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(openBulkImmediately);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    loadCandidates();
  }, [search, skillFilter, minExp, reviewStatusFilter, sourceFilter]);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const list = await api.getCandidates({
        search,
        skill: skillFilter || undefined,
        minExperience: minExp,
        reviewStatus: reviewStatusFilter || undefined,
        source: sourceFilter || undefined,
      });
      setCandidates(list);
    } catch (e) {
      console.error('Failed to load candidates:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            Candidate CRM & Directory
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {candidates.length} Verified Profiles
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise candidate repository with structured work history, skills, and evidence citations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>Bulk Resume Ingestion</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate name, email, title, or skills..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="">All Skills</option>
            <option value="TypeScript">TypeScript</option>
            <option value="Python">Python</option>
            <option value="React">React</option>
            <option value="Kubernetes">Kubernetes</option>
            <option value="PostgreSQL">PostgreSQL</option>
            <option value="Figma">Figma</option>
          </select>

          <select
            value={reviewStatusFilter}
            onChange={(e) => setReviewStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="">All Review Statuses</option>
            <option value="verified">Verified Profiles</option>
            <option value="pending_review">Pending Review</option>
            <option value="flagged">Flagged</option>
          </select>

          <select
            value={minExp || ''}
            onChange={(e) => setMinExp(e.target.value ? Number(e.target.value) : undefined)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="">Any Experience</option>
            <option value="3">3+ Years</option>
            <option value="5">5+ Years</option>
            <option value="7">7+ Years</option>
          </select>
        </div>
      </div>

      {/* Candidates List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Candidates Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting your search query or upload candidate resumes using the bulk ingestion tool.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-lg bg-crm-surface-secondary text-crm-text border border-crm-border flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                    {cand.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <h2
                        onClick={() => setSelectedCandidate(cand)}
                        className="text-base font-bold text-slate-900 dark:text-white hover:text-crm-accent transition-colors cursor-pointer"
                      >
                        {cand.name}
                      </h2>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          cand.reviewStatus === 'verified'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : cand.reviewStatus === 'flagged'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {cand.reviewStatus.replace('_', ' ')}
                      </span>
                      {cand.hasResume && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>PDF Resume Verified</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {cand.headline || 'Software Professional'}
                    </p>

                    <div className="flex items-center flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                      <span>{cand.email}</span>
                      <span>•</span>
                      {cand.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {cand.location}
                        </span>
                      )}
                      <span>•</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {cand.totalExperienceYears} years total experience
                      </span>
                      <span>•</span>
                      <span className="capitalize text-slate-400">Via {cand.source.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Candidate Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedCandidate(cand)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <span>View Profile</span>
                  </button>

                  <button
                    onClick={() => onNavigate('matching', { candidateId: cand.id })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold transition-colors"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>Match Against Jobs</span>
                  </button>

                  <button
                    onClick={() => onNavigate('interviews', { candidateId: cand.id })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Interview</span>
                  </button>
                </div>
              </div>

              {/* Skills Chips */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                {(cand.skills || []).map((skill) => (
                  <span
                    key={skill}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {cand.missingFields && cand.missingFields.length > 0 && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40">
                    Unknown info: {cand.missingFields.join(', ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CandidateAddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCandidateAdded={(newC) => setCandidates([newC, ...candidates])}
      />

      <BulkResumeModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onUploadComplete={loadCandidates}
      />

      <CandidateDetailModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onRunMatch={(cid) => {
          setSelectedCandidate(null);
          onNavigate('matching', { candidateId: cid });
        }}
        onScheduleInterview={(cid) => {
          setSelectedCandidate(null);
          onNavigate('interviews', { candidateId: cid });
        }}
        onStatusUpdated={(updated) => {
          setCandidates(candidates.map((c) => (c.id === updated.id ? updated : c)));
          setSelectedCandidate(updated);
        }}
      />
    </div>
  );
};
