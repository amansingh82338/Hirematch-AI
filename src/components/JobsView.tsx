import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Sparkles,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  ExternalLink,
  Kanban,
  Edit,
  Eye,
  Sliders,
} from 'lucide-react';
import { Job, JobStatus, WorkplaceType } from '../types';
import { api } from '../services/api';
import { JobCreateModal } from './JobCreateModal';
import { JobExtractModal } from './JobExtractModal';
import { NavTab } from './Sidebar';

interface JobsViewProps {
  onNavigate: (tab: NavTab, meta?: any) => void;
  openCreateImmediately?: boolean;
}

export const JobsView: React.FC<JobsViewProps> = ({
  onNavigate,
  openCreateImmediately = false,
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [workplaceFilter, setWorkplaceFilter] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(openCreateImmediately);
  const [isExtractOpen, setIsExtractOpen] = useState(false);
  const [extractedPrefill, setExtractedPrefill] = useState<Partial<Job> | undefined>(undefined);
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<Job | null>(null);

  useEffect(() => {
    loadJobs();
  }, [search, departmentFilter, statusFilter, workplaceFilter]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await api.getJobs({
        search,
        department: departmentFilter || undefined,
        status: statusFilter || undefined,
        workplaceType: workplaceFilter || undefined,
      });
      setJobs(data);
    } catch (e) {
      console.error('Failed to load jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    try {
      const updated = await api.updateJob(jobId, { status: newStatus });
      setJobs(jobs.map((j) => (j.id === jobId ? updated : j)));
    } catch (e) {
      console.error('Failed to update job status:', e);
    }
  };

  const handleApplyExtractedRequirements = (extracted: Partial<Job>) => {
    setExtractedPrefill(extracted);
    setIsCreateOpen(true);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            Job Openings
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {jobs.length} Positions
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage requisition statuses, approved qualification criteria, and AI scoring weights.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsExtractOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>AI JD Auto-Extract</span>
          </button>
          <button
            onClick={() => {
              setExtractedPrefill(undefined);
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Job</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, required skills, or keywords..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product Engineering">Product Engineering</option>
            <option value="Design">Design</option>
            <option value="Infrastructure">Infrastructure</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={workplaceFilter}
            onChange={(e) => setWorkplaceFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="">All Workplace Types</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-Site</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid / List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Job Openings Match Your Filters
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or create a new job opening using our AI Job Description extractor.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => {
            const isApproved = job.requirementsApproved;
            return (
              <div
                key={job.id}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <h2
                        onClick={() => setSelectedJobForDetail(job)}
                        className="text-base font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        {job.title}
                      </h2>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          job.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : job.status === 'paused'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {job.status}
                      </span>

                      {/* Requirements Approval Pill */}
                      {isApproved ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-indigo-500" />
                          <span>v{job.version || 1} Approved Criteria</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-500" />
                          <span>Pending Approval</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {job.department}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location} ({job.workplaceType})
                      </span>
                      <span>•</span>
                      {job.salaryMin && job.salaryMax && (
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                          <DollarSign className="w-3 h-3 text-emerald-500" />
                          ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax / 1000).toFixed(0)}k / year
                        </span>
                      )}
                      <span>•</span>
                      <span>{job.experienceMinYears}+ yrs exp min</span>
                    </div>
                  </div>

                  {/* Actions Button Group */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onNavigate('pipeline', { jobId: job.id })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                      title="Open Candidate Kanban for this job"
                    >
                      <Kanban className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Pipeline</span>
                    </button>

                    <button
                      onClick={() => onNavigate('matching', { jobId: job.id })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold transition-colors"
                      title="Compare candidates for this position"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Match Engine</span>
                    </button>

                    <button
                      onClick={() =>
                        handleStatusChange(
                          job.id,
                          job.status === 'published' ? 'paused' : 'published'
                        )
                      }
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs"
                      title={job.status === 'published' ? 'Pause job' : 'Publish job'}
                    >
                      {job.status === 'published' ? 'Pause' : 'Activate'}
                    </button>
                  </div>
                </div>

                {/* Required Skills Badges & Scoring Weights Preview */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Required:
                    </span>
                    {job.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.preferredSkills && job.preferredSkills.length > 0 && (
                      <span className="text-[11px] text-slate-400 italic ml-1">
                        +{job.preferredSkills.length} preferred
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                    <span className="flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-indigo-500" />
                      Weights: Skills {job.scoringWeights.requiredSkills}% / Exp {job.scoringWeights.experience}% / Edu {job.scoringWeights.education}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <JobCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        initialData={extractedPrefill}
        onJobCreated={(newJob) => {
          setJobs([newJob, ...jobs]);
        }}
        onOpenExtractor={() => {
          setIsCreateOpen(false);
          setIsExtractOpen(true);
        }}
      />

      <JobExtractModal
        isOpen={isExtractOpen}
        onClose={() => setIsExtractOpen(false)}
        onApplyRequirements={handleApplyExtractedRequirements}
      />

      {/* Job Detail Modal */}
      {selectedJobForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedJobForDetail.title}
                </h2>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedJobForDetail.department} • {selectedJobForDetail.location} ({selectedJobForDetail.workplaceType})
                </div>
              </div>
              <button
                onClick={() => setSelectedJobForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Description:
                </span>
                <p>{selectedJobForDetail.description}</p>
              </div>

              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Core Responsibilities:
                </span>
                <ul className="list-disc list-inside space-y-1">
                  {selectedJobForDetail.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Required Minimum Education:
                  </span>
                  <span>{selectedJobForDetail.educationLevel}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Requirements Approval:
                  </span>
                  <span>
                    Version {selectedJobForDetail.version} - Approved by Hiring Committee
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  const jid = selectedJobForDetail.id;
                  setSelectedJobForDetail(null);
                  onNavigate('pipeline', { jobId: jid });
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Open Candidate Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
