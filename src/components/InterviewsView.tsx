import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Video,
  Phone,
  Building,
  CheckCircle,
  Clock,
  Star,
  User,
  Volume2,
  VolumeX,
  FileCheck,
  ShieldCheck,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { Interview, InterviewFeedback, Job, Candidate, InterviewRecommendation } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { NavTab } from './Sidebar';

interface InterviewsViewProps {
  onNavigate: (tab: NavTab, meta?: any) => void;
  initialCandidateId?: string;
  initialJobId?: string;
}

export const InterviewsView: React.FC<InterviewsViewProps> = ({
  onNavigate,
  initialCandidateId,
  initialJobId,
}) => {
  const { user, availableUsers } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isScheduleOpen, setIsScheduleOpen] = useState(Boolean(initialCandidateId));
  const [selectedInterviewForFeedback, setSelectedInterviewForFeedback] = useState<Interview | null>(null);
  const [viewingFeedbackList, setViewingFeedbackList] = useState<{ interview: Interview; feedback: InterviewFeedback[] } | null>(null);

  // Scheduling Form State
  const [title, setTitle] = useState('Technical Architecture & Core Competencies');
  const [schedJobId, setSchedJobId] = useState(initialJobId || '');
  const [schedCandidateId, setSchedCandidateId] = useState(initialCandidateId || '');
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(Date.now() + 86400000 * 2);
    d.setHours(14, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [format, setFormat] = useState<'video' | 'phone' | 'onsite'>('video');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/hrc-qwe-xyz');
  const [prepNotes, setPrepNotes] = useState('Verify hands-on experience with vector retrieval and distributed PostgreSQL.');
  const [selectedInterviewers, setSelectedInterviewers] = useState<string[]>(['usr_maria']);

  // Feedback Form State
  const [rating, setRating] = useState(4);
  const [recommendation, setRecommendation] = useState<InterviewRecommendation>('hire');
  const [criteria1Score, setCriteria1Score] = useState(4);
  const [criteria2Score, setCriteria2Score] = useState(4);
  const [strengths, setStrengths] = useState('');
  const [areasOfConcern, setAreasOfConcern] = useState('');

  // TTS State
  const [ttsPlayingId, setTtsPlayingId] = useState<string | null>(null);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [intList, jList, cList] = await Promise.all([
        api.getInterviews(),
        api.getJobs({ status: 'published' }),
        api.getCandidates(),
      ]);
      setInterviews(intList);
      setJobs(jList);
      setCandidates(cList);
      if (!schedJobId && jList.length > 0) setSchedJobId(jList[0].id);
      if (!schedCandidateId && cList.length > 0) setSchedCandidateId(cList[0].id);
    } catch (e) {
      console.error('Failed to load interviews:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedJobId || !schedCandidateId) return;

    try {
      const newInt = await api.scheduleInterview({
        title,
        jobId: schedJobId,
        candidateId: schedCandidateId,
        applicationId: `app_${schedCandidateId}`,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        format,
        meetingLink: format === 'video' ? meetingLink : undefined,
        interviewerIds: selectedInterviewers,
        status: 'scheduled',
        preparationNotes: prepNotes,
      });

      setInterviews([...interviews, newInt]);
      setIsScheduleOpen(false);
    } catch (e) {
      console.error('Failed to schedule interview:', e);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterviewForFeedback) return;

    try {
      await api.submitInterviewFeedback({
        interviewId: selectedInterviewForFeedback.id,
        rating,
        recommendation,
        criteriaRatings: [
          { criterion: 'Technical Depth & Architecture', rating: criteria1Score, comments: 'Evaluated system tradeoffs.' },
          { criterion: 'Communication & Culture Alignment', rating: criteria2Score, comments: 'Clear, collaborative approach.' },
        ],
        strengths,
        areasOfConcern,
      });

      // Update interview status to completed
      setInterviews(
        interviews.map((i) =>
          i.id === selectedInterviewForFeedback.id ? { ...i, status: 'completed' } : i
        )
      );
      setSelectedInterviewForFeedback(null);
    } catch (e) {
      console.error('Failed to submit feedback:', e);
    }
  };

  const handleReadPrepAloud = async (intItem: Interview) => {
    if (ttsPlayingId === intItem.id && audioElem) {
      audioElem.pause();
      setTtsPlayingId(null);
      return;
    }

    try {
      const textToRead = `Interview briefing for ${intItem.title}. Candidate: ${intItem.candidateName}. Position: ${intItem.jobTitle}. Scheduled duration: ${intItem.durationMinutes} minutes. Format: ${intItem.format}. Preparation guidelines: ${intItem.preparationNotes || 'Evaluate technical depth against approved job criteria.'}`;
      const { audioBase64 } = await api.generateSpeechTTS(textToRead, 'Fenrir');

      if (audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
        audio.onended = () => setTtsPlayingId(null);
        audio.play();
        setAudioElem(audio);
        setTtsPlayingId(intItem.id);
      } else {
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(textToRead);
          u.onend = () => setTtsPlayingId(null);
          window.speechSynthesis.speak(u);
          setTtsPlayingId(intItem.id);
        }
      }
    } catch (e) {
      console.error('TTS error:', e);
    }
  };

  const handleOpenViewFeedback = async (intItem: Interview) => {
    try {
      const fb = await api.getInterviewFeedback(intItem.id);
      setViewingFeedbackList({ interview: intItem, feedback: fb });
    } catch (e) {
      console.error('Failed to get feedback:', e);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            Interview Management & Evaluations
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {interviews.length} Scheduled
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Coordinate interview schedules, assign interview committees, and capture structured rubrics.
          </p>
        </div>

        <button
          onClick={() => setIsScheduleOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Interview</span>
        </button>
      </div>

      {/* Interviews List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <CalendarCheck className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Interviews Currently Scheduled
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Schedule an interview session for shortlisted candidates directly from here or the pipeline board.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {interviews.map((intItem) => {
            const isCompleted = intItem.status === 'completed';
            return (
              <div
                key={intItem.id}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {intItem.title}
                      </h2>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                      >
                        {intItem.status}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span>Candidate: {intItem.candidateName || 'Candidate Profile'}</span>
                      <span>•</span>
                      <span>Position: {intItem.jobTitle}</span>
                    </div>

                    <div className="flex items-center flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1 font-mono font-medium text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {new Date(intItem.scheduledAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        ({intItem.durationMinutes} mins)
                      </span>
                      <span>•</span>
                      <span className="capitalize flex items-center gap-1">
                        {intItem.format === 'video' ? (
                          <Video className="w-3.5 h-3.5 text-sky-500" />
                        ) : (
                          <Phone className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        {intItem.format}
                      </span>
                      {intItem.meetingLink && (
                        <a
                          href={intItem.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          Join Google Meet <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Read Prep Aloud Button */}
                    <button
                      onClick={() => handleReadPrepAloud(intItem)}
                      title="Read briefing notes aloud using speech synthesis"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {ttsPlayingId === intItem.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Read Aloud</span>
                        </>
                      )}
                    </button>

                    {isCompleted ? (
                      <button
                        onClick={() => handleOpenViewFeedback(intItem)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>View Evaluation</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedInterviewForFeedback(intItem)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/20"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>Submit Feedback</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Preparation Notes Preview */}
                {intItem.preparationNotes && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                      Interviewer Focus & Preparation Guidelines:
                    </span>
                    {intItem.preparationNotes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Schedule Candidate Interview
            </h2>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Interview Stage / Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Candidate
                  </label>
                  <select
                    value={schedCandidateId}
                    onChange={(e) => setSchedCandidateId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Job Requisition
                  </label>
                  <select
                    value={schedJobId}
                    onChange={(e) => setSchedJobId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Duration (Minutes)
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Format & Meeting Link
                </label>
                <div className="flex gap-2 mb-2">
                  {(['video', 'phone', 'onsite'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormat(fmt)}
                      className={`px-3 py-1.5 rounded-lg capitalize font-semibold ${
                        format === fmt
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
                {format === 'video' && (
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Preparation Guidelines for Interview Committee
                </label>
                <textarea
                  rows={3}
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-3.5 py-1.5 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  Schedule Interview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Structured Feedback Modal */}
      {selectedInterviewForFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Structured Interview Evaluation Rubric
            </h2>
            <p className="text-xs text-slate-500">
              Candidate: <strong>{selectedInterviewForFeedback.candidateName}</strong> • {selectedInterviewForFeedback.jobTitle}
            </p>

            <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Overall Hiring Recommendation
                </label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value as InterviewRecommendation)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="strong_hire">Strong Hire (Top 5% Candidate)</option>
                  <option value="hire">Hire (Meets All Bar Requirements)</option>
                  <option value="neutral">Neutral / Hold for Comparison</option>
                  <option value="no_hire">No Hire</option>
                  <option value="strong_no_hire">Strong No Hire</option>
                </select>
              </div>

              {/* Numerical Rating */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Overall Score (1 = Unsatisfactory, 5 = Exceptional)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1 ${
                        rating === star
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${rating >= star ? 'fill-current' : ''}`} />
                      <span>{star}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Demonstrated Strengths
                </label>
                <textarea
                  rows={2}
                  required
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="Key technical capabilities, clear problem articulation..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Areas of Concern / Further Evaluation Needed
                </label>
                <textarea
                  rows={2}
                  value={areasOfConcern}
                  onChange={(e) => setAreasOfConcern(e.target.value)}
                  placeholder="Gaps in specific tools or lack of production examples..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedInterviewForFeedback(null)}
                  className="px-3.5 py-1.5 font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  Submit Formal Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Feedback Modal */}
      {viewingFeedbackList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Submitted Interview Evaluations
            </h2>
            <div className="space-y-3">
              {viewingFeedbackList.feedback.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{fb.interviewerName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold capitalize">
                      {fb.recommendation.replace('_', ' ')} (Score: {fb.rating}/5)
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Strengths:</strong> {fb.strengths}
                  </p>
                  {fb.areasOfConcern && (
                    <p className="text-slate-600 dark:text-slate-300">
                      <strong>Areas of Concern:</strong> {fb.areasOfConcern}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingFeedbackList(null)}
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
