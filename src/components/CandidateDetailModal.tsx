import React, { useState } from 'react';
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
} from 'lucide-react';
import { Candidate } from '../types';
import { api } from '../services/api';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
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
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                {candidate.headline}
              </p>
              <div className="flex items-center flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
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
                {candidate.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {candidate.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Speech Synthesis Read Briefing Button */}
            <button
              onClick={handlePlayTTS}
              disabled={ttsLoading}
              title="Read executive briefing aloud using speech synthesis"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors"
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
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {w.title}
                      </div>
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {w.company}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {w.startDate} - {w.endDate || 'Present'}
                    </span>
                  </div>
                  {w.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {w.description}
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
                onScheduleInterview(candidate.id);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Schedule Interview</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onRunMatch(candidate.id);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20"
            >
              <span>Match Against Job Requisitions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
