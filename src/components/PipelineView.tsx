import React, { useState, useEffect } from 'react';
import {
  Kanban,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Calendar,
  AlertCircle,
  History,
} from 'lucide-react';
import { Application, ApplicationStage, Job, PipelineEvent } from '../types';
import { api } from '../services/api';
import { NavTab } from './Sidebar';

interface PipelineViewProps {
  onNavigate: (tab: NavTab, meta?: any) => void;
  initialJobId?: string;
}

const STAGES: { id: ApplicationStage; label: string; color: string }[] = [
  { id: 'applied', label: 'Applied', color: 'border-slate-300 dark:border-slate-700' },
  { id: 'screening', label: 'Screening', color: 'border-sky-400' },
  { id: 'shortlisted', label: 'Shortlisted', color: 'border-indigo-500' },
  { id: 'interview', label: 'Interview', color: 'border-violet-500' },
  { id: 'assessment', label: 'Assessment', color: 'border-amber-500' },
  { id: 'offer', label: 'Offer', color: 'border-teal-500' },
  { id: 'hired', label: 'Hired', color: 'border-emerald-500' },
  { id: 'rejected', label: 'Rejected', color: 'border-rose-400' },
];

export const PipelineView: React.FC<PipelineViewProps> = ({ onNavigate, initialJobId }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || '');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Stage move modal
  const [activeAppToMove, setActiveAppToMove] = useState<Application | null>(null);
  const [targetStage, setTargetStage] = useState<ApplicationStage>('screening');
  const [moveNote, setMoveNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // History timeline modal
  const [historyTimelineApp, setHistoryTimelineApp] = useState<Application | null>(null);
  const [pipelineEvents, setPipelineEvents] = useState<PipelineEvent[]>([]);

  useEffect(() => {
    loadJobsAndApplications();
  }, [selectedJobId]);

  const loadJobsAndApplications = async () => {
    setLoading(true);
    try {
      const [jobsData, appsData] = await Promise.all([
        api.getJobs({ status: 'published' }),
        api.getApplications({ jobId: selectedJobId || undefined }),
      ]);
      setJobs(jobsData);
      setApplications(appsData);
    } catch (e) {
      console.error('Failed to load pipeline:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMoveModal = (app: Application, nextStage: ApplicationStage) => {
    setActiveAppToMove(app);
    setTargetStage(nextStage);
    setMoveNote('');
    setRejectionReason('');
  };

  const handleConfirmMove = async () => {
    if (!activeAppToMove) return;
    try {
      const updated = await api.updateApplicationStage(
        activeAppToMove.id,
        targetStage,
        moveNote,
        targetStage === 'rejected' ? rejectionReason : undefined
      );
      setApplications(applications.map((a) => (a.id === updated.id ? updated : a)));
      setActiveAppToMove(null);
    } catch (e) {
      console.error('Failed to move stage:', e);
    }
  };

  const handleViewHistory = async (app: Application) => {
    setHistoryTimelineApp(app);
    try {
      const events = await api.getPipelineEvents(app.id);
      setPipelineEvents(events);
    } catch (e) {
      console.error('Failed to load pipeline events:', e);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            Recruitment Pipeline Kanban
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {applications.length} Active Applications
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visual stage progression, bottleneck detection, and immutable stage history records.
          </p>
        </div>

        {/* Job Filter Selector */}
        <div className="flex items-center gap-2.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
            Filter Job:
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="">All Job Openings ({jobs.length})</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
        {STAGES.map((stage) => {
          const stageApps = applications.filter((a) => a.stage === stage.id);
          return (
            <div
              key={stage.id}
              className="w-72 shrink-0 flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 p-3 max-h-[75vh]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full border-2 ${stage.color} bg-white dark:bg-slate-800`} />
                  <span>{stage.label}</span>
                </span>
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs">
                  {stageApps.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {stageApps.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 italic">
                    No candidates in this stage
                  </div>
                ) : (
                  stageApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 dark:bg-slate-800/90 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {app.candidate?.name || 'Candidate'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                            {app.job?.title || 'Job Opening'}
                          </div>
                        </div>

                        {app.overallScore !== undefined && (
                          <div
                            className={`text-xs font-black px-1.5 py-0.5 rounded ${
                              app.overallScore >= 80
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}
                          >
                            {app.overallScore}%
                          </div>
                        )}
                      </div>

                      {/* Candidate Skills preview */}
                      {app.candidate?.skills && (
                        <div className="flex flex-wrap gap-1">
                          {app.candidate.skills.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Application Notes */}
                      {app.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded">
                          "{app.notes.split('\n')[0]}"
                        </p>
                      )}

                      {/* Card Actions Footer */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
                        <button
                          onClick={() => handleViewHistory(app)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 font-medium"
                        >
                          <History className="w-3 h-3" />
                          <span>History</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {stage.id !== 'hired' && stage.id !== 'rejected' && (
                            <button
                              onClick={() => {
                                const currentIndex = STAGES.findIndex((s) => s.id === stage.id);
                                const nextStage = STAGES[currentIndex + 1]?.id || 'interview';
                                handleOpenMoveModal(app, nextStage);
                              }}
                              className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold hover:bg-indigo-100"
                            >
                              Advance →
                            </button>
                          )}
                          {stage.id !== 'rejected' && (
                            <button
                              onClick={() => handleOpenMoveModal(app, 'rejected')}
                              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Reject candidate"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Transition & Decision Modal */}
      {activeAppToMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Move Candidate in Pipeline
            </h2>
            <p className="text-xs text-slate-500">
              Update application milestone for <strong>{activeAppToMove.candidate?.name}</strong> applying for <strong>{activeAppToMove.job?.title}</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Pipeline Stage
                </label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value as ApplicationStage)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {targetStage === 'rejected' && (
                <div>
                  <label className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    Rejection Reason (Audit Required)
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Lacks required distributed systems experience in production..."
                    className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Stage Transition Decision Note
                </label>
                <textarea
                  rows={3}
                  value={moveNote}
                  onChange={(e) => setMoveNote(e.target.value)}
                  placeholder="Notes from hiring manager, interview scores, or next actions..."
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveAppToMove(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMove}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Confirm Stage Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage History Timeline Modal */}
      {historyTimelineApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Stage History Timeline
                </h2>
                <div className="text-xs text-slate-500">
                  {historyTimelineApp.candidate?.name} • {historyTimelineApp.job?.title}
                </div>
              </div>
              <button
                onClick={() => setHistoryTimelineApp(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 pt-2">
              {pipelineEvents.length === 0 ? (
                <div className="text-xs text-slate-400 italic">No stage changes recorded.</div>
              ) : (
                pipelineEvents.map((evt, idx) => (
                  <div key={evt.id || idx} className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        Moved to <span className="capitalize">{evt.toStage}</span> by {evt.actorName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {new Date(evt.timestamp).toLocaleString()}
                      </div>
                      {evt.note && (
                        <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg mt-1">
                          {evt.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setHistoryTimelineApp(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
