import React, { useState, useEffect } from 'react';
import { Search, Briefcase, User, X, ArrowRight } from 'lucide-react';
import { Job, Candidate } from '../types';
import { api } from '../services/api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectJob: (jobId: string) => void;
  onSelectCandidate: (candidateId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectJob,
  onSelectCandidate,
}) => {
  const [query, setQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle modal
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [jobsData, candidatesData] = await Promise.all([
          api.getJobs({ search: query }),
          api.getCandidates({ search: query }),
        ]);
        setJobs(jobsData.slice(0, 5));
        setCandidates(candidatesData.slice(0, 5));
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by job title, candidate name, skill, or location..."
            autoFocus
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
              Searching database...
            </div>
          )}

          {/* Jobs Section */}
          {jobs.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Job Openings ({jobs.length})</span>
              </div>
              <div className="space-y-1">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => {
                      onSelectJob(job.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-left transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {job.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{job.department}</span>
                        <span>•</span>
                        <span>{job.location} ({job.workplaceType})</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Candidates Section */}
          {candidates.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Candidate Profiles ({candidates.length})</span>
              </div>
              <div className="space-y-1">
                {candidates.map((cand) => (
                  <button
                    key={cand.id}
                    onClick={() => {
                      onSelectCandidate(cand.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                        {cand.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {cand.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {cand.headline || cand.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex flex-wrap gap-1">
                        {(cand.skills || []).slice(0, 2).map((s) => (
                          <span
                            key={s}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && jobs.length === 0 && candidates.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No matching jobs or candidates found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
