import React, { useState, useRef } from 'react';
import {
  User,
  X,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  CheckCircle,
  AlertTriangle,
  Volume2,
  VolumeX,
  FileText,
  Quote,
  ShieldCheck,
  Send,
  Calendar,
  Plus,
  Upload,
  Loader2,
} from 'lucide-react';
import { Candidate } from '../types';
import { api } from '../services/api';
import { readFileText, fileToBase64, formatFileSize } from '../utils/fileUpload';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onRunMatch: (candidateId: string) => void;
  onScheduleInterview: (candidateId: string) => void;
  onStatusUpdated?: (candidate: Candidate) => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  onClose,
  onRunMatch,
  onScheduleInterview,
  onStatusUpdated,
}) => {
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);

  // Resume drag-and-drop & update
  const [isDragging, setIsDragging] = useState(false);
  const [updatingResume, setUpdatingResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!candidate) return null;

  const handlePlayTTS = async () => {
    if (isPlayingTTS && audioElement) {
      audioElement.pause();
      setIsPlayingTTS(false);
      return;
    }

    setTtsLoading(true);
    try {
      const summaryText = `Candidate profile for ${candidate.name}. ${candidate.headline || ''}. Total verified experience: ${candidate.totalExperienceYears} years. Key skills include ${candidate.skills.slice(0, 6).join(', ')}. Candidate review status is ${candidate.reviewStatus}. Summary: ${candidate.summary || 'Strong background in software engineering.'}`;
      const { audioBase64 } = await api.generateSpeechTTS(summaryText, 'Kore');

      if (audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
        audio.onended = () => setIsPlayingTTS(false);
        audio.play();
        setAudioElement(audio);
        setIsPlayingTTS(true);
      } else {
        // Fallback Web Speech API
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(summaryText);
          utterance.onend = () => setIsPlayingTTS(false);
          window.speechSynthesis.speak(utterance);
          setIsPlayingTTS(true);
        }
      }
    } catch (e) {
      console.error('TTS error:', e);
    } finally {
      setTtsLoading(false);
    }
  };

  const handleToggleVerify = async () => {
    try {
      const newStatus = candidate.reviewStatus === 'verified' ? 'pending_review' : 'verified';
      const updated = await api.updateCandidate(candidate.id, { reviewStatus: newStatus });
      if (onStatusUpdated) onStatusUpdated(updated);
    } catch (e) {
      console.error('Failed to update review status:', e);
    }
  };

  const handleResumeFile = async (file: File) => {
    setUpdatingResume(true);
    try {
      let base64: string | undefined;
      try {
        base64 = await fileToBase64(file);
      } catch {
        // Ignore
      }

      const text = await readFileText(file);
      const parsed = await api.parseResume(text, file.name, base64);

      const updates: Partial<Candidate> = {
        hasResume: true,
        resumeFileName: file.name,
        resumeParsedAt: new Date().toISOString(),
      };

      if (parsed?.extraction) {
        const ext = parsed.extraction;
        if (ext.candidateName && (!candidate.name || candidate.name === 'Unknown Candidate' || candidate.name === 'Jordan Smith')) {
          updates.name = ext.candidateName;
        }
        if (ext.email && (!candidate.email || candidate.email.includes('example.com') || candidate.email.includes('@domain.com'))) {
          updates.email = ext.email;
        }
        if (ext.phone && (!candidate.phone || candidate.phone === '923 923 894 1004')) {
          updates.phone = ext.phone;
        }
        if (ext.location && (!candidate.location || candidate.location === 'J ,XM' || candidate.location === 'United States')) {
          updates.location = ext.location;
        }
        if (ext.skills?.length) {
          updates.skills = Array.from(new Set([...candidate.skills, ...ext.skills.map((s) => s.name)]));
        }
        if (typeof ext.totalExperienceYears === 'number' && ext.totalExperienceYears >= 0) {
          updates.totalExperienceYears = ext.totalExperienceYears;
        }
        if (ext.summary) {
          updates.summary = ext.summary;
        }
        if (ext.headline) {
          updates.headline = ext.headline;
        }
        if (ext.workHistory?.length) {
          updates.workHistory = ext.workHistory;
        }
        if (ext.education?.length) {
          updates.education = ext.education;
        }
        if (ext.projects?.length) {
          updates.projects = ext.projects;
        }
        if (ext.certifications?.length) {
          updates.certifications = ext.certifications.map((c) => c.name);
        }
      }

      const updated = await api.updateCandidate(candidate.id, updates);
      if (onStatusUpdated) onStatusUpdated(updated);
    } catch (err) {
      console.error('Failed to upload and parse new resume:', err);
    } finally {
      setUpdatingResume(false);
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

      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-crm-accent text-crm-accent-fg flex items-center justify-center font-black text-xl shadow-xs shrink-0">
              {candidate.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center flex-wrap gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {candidate.name}
                </h2>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    candidate.reviewStatus === 'verified'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : candidate.reviewStatus === 'flagged'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {candidate.reviewStatus.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 capitalize">
                  via {candidate.source}
                </span>
              </div>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {candidate.headline}
              </p>
              <div className="flex items-center flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {candidate.location}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {candidate.email}
                </span>
                {candidate.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {candidate.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayTTS}
              disabled={ttsLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                isPlayingTTS
                  ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300'
                  : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
              }`}
            >
              {isPlayingTTS ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                  <span>Stop Audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{ttsLoading ? 'Generating...' : 'Read Aloud (TTS)'}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Resume Ingestion / Dropzone Bar */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-3.5 rounded-xl border-2 border-dashed transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-indigo-100/60 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 shrink-0">
                  {updatingResume ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {updatingResume
                      ? 'Parsing uploaded document...'
                      : isDragging
                      ? 'Drop resume here to update profile'
                      : candidate.hasResume && candidate.resumeFileName
                      ? `Resume Attached: ${candidate.resumeFileName}`
                      : 'No resume document currently attached'}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                    {candidate.hasResume
                      ? `Last updated: ${new Date(candidate.resumeParsedAt || Date.now()).toLocaleDateString()} • Drag & drop to replace`
                      : 'Drag & drop PDF, DOCX, or TXT resume to enrich profile and skills'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={updatingResume}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{candidate.hasResume ? 'Replace Resume' : 'Attach Resume'}</span>
              </button>
            </div>
          </div>

          {/* Summary */}
          {candidate.summary && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Executive Profile Summary
              </span>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {candidate.summary}
              </p>
            </div>
          )}

          {/* Missing Fields Marked As Unknown */}
          {candidate.missingFields && candidate.missingFields.length > 0 && (
            <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Missing Information Policy:</span> The following fields were not provided in the original resume and are marked <span className="font-mono font-semibold">UNKNOWN</span> rather than assumed absent: {candidate.missingFields.join(', ')}.
              </div>
            </div>
          )}

          {/* Skills Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Documented Skills ({candidate.skills.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Work History */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Verified Work History ({candidate.totalExperienceYears} yrs experience)</span>
            </span>

            <div className="space-y-3">
              {candidate.workHistory.map((w, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {w.title}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 font-medium">
                        {w.company} • {w.startDate} - {w.endDate}
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {w.description}
                  </p>
                  {w.quote && (
                    <p className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500 italic">
                      "{w.quote}"
                    </p>
                  )}
                  {w.skillsUsed && w.skillsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {w.skillsUsed.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Education & Projects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Education */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Academic Degrees</span>
              </span>
              <div className="space-y-2">
                {candidate.education.map((edu, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-xs"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">{edu.degree}</div>
                    <div className="text-slate-500 dark:text-slate-400">{edu.institution} {edu.year && `• ${edu.year}`}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Certifications</span>
              </span>
              <div className="space-y-2">
                {candidate.certifications && candidate.certifications.length > 0 ? (
                  candidate.certifications.map((cert, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-xs flex items-center gap-2"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{cert}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 italic">
                    None recorded on profile
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleToggleVerify}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Mark {candidate.reviewStatus === 'verified' ? 'Pending Review' : 'Verified'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onRunMatch(candidate.id);
              }}
              className="px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
            >
              Match Scorecard
            </button>
            <button
              onClick={() => {
                onClose();
                onScheduleInterview(candidate.id);
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Interview</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
