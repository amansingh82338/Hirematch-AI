import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  FileText,
  CheckCircle,
  Clock,
  Sparkles,
  User,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { CommunicationMessage, CommunicationTemplate, Candidate, Job } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { NavTab } from './Sidebar';

interface CommunicationsViewProps {
  onNavigate: (tab: NavTab, meta?: any) => void;
}

export const CommunicationsView: React.FC<CommunicationsViewProps> = ({ onNavigate }) => {
  const { user, organization } = useAuth();
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer State
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [comms, tmpls, cList, jList] = await Promise.all([
        api.getCommunications(),
        api.getTemplates(),
        api.getCandidates(),
        api.getJobs({ status: 'published' }),
      ]);
      setMessages(comms);
      setTemplates(tmpls);
      setCandidates(cList);
      setJobs(jList);

      if (cList.length > 0) setSelectedCandidateId(cList[0].id);
      if (tmpls.length > 0) {
        applyTemplate(tmpls[0], cList[0], jList[0]);
      }
    } catch (e) {
      console.error('Failed to load communications:', e);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (
    tmpl: CommunicationTemplate,
    cand?: Candidate,
    jb?: Job
  ) => {
    setSelectedTemplateId(tmpl.id);
    const candidateName = cand?.name || 'Elena Rostova';
    const jobTitle = jb?.title || 'Senior Software Engineer';
    const companyName = organization?.name || 'Acme Cloud & AI Systems';

    let resolvedSubject = tmpl.subject
      .replace(/{{candidate_name}}/g, candidateName)
      .replace(/{{job_title}}/g, jobTitle)
      .replace(/{{company_name}}/g, companyName);

    let resolvedBody = tmpl.bodyTemplate
      .replace(/{{candidate_name}}/g, candidateName)
      .replace(/{{job_title}}/g, jobTitle)
      .replace(/{{company_name}}/g, companyName)
      .replace(/{{recruiter_name}}/g, user?.name || 'Recruiter')
      .replace(/{{duration}}/g, '45')
      .replace(/{{scheduled_time}}/g, 'Tomorrow at 2:00 PM EST')
      .replace(/{{meeting_link}}/g, 'https://meet.google.com/hrc-qwe-xyz')
      .replace(/{{department}}/g, jb?.department || 'Engineering')
      .replace(/{{salary_offer}}/g, '$195,000 / year + equity')
      .replace(/{{start_date}}/g, 'First of Next Month');

    setSubject(resolvedSubject);
    setBody(resolvedBody);
  };

  const handleTemplateChange = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find((t) => t.id === tmplId);
    const cand = candidates.find((c) => c.id === selectedCandidateId);
    if (tmpl) {
      applyTemplate(tmpl, cand, jobs[0]);
    }
  };

  const handleCandidateChange = (candId: string) => {
    setSelectedCandidateId(candId);
    const cand = candidates.find((c) => c.id === candId);
    const tmpl = templates.find((t) => t.id === selectedTemplateId) || templates[0];
    if (tmpl) {
      applyTemplate(tmpl, cand, jobs[0]);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cand = candidates.find((c) => c.id === selectedCandidateId);
    if (!cand || !subject.trim() || !body.trim()) return;

    setSending(true);
    try {
      const sent = await api.sendCommunication({
        applicationId: `app_${cand.id}`,
        candidateId: cand.id,
        candidateName: cand.name,
        candidateEmail: cand.email,
        type: 'email',
        subject,
        body,
        templateId: selectedTemplateId,
      });

      setMessages([sent, ...messages]);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 4000);
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setSending(false);
    }
  };

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          Candidate Outreach & Messaging
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            Recruiter Controlled
          </span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Compose personalized candidate communications using reusable email templates. Messages are never sent automatically without recruiter verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Composer */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-500" />
              <span>Compose Candidate Message</span>
            </h2>
            <span className="text-xs text-slate-500">
              Sender: {user?.name} ({user?.email})
            </span>
          </div>

          {sendSuccess && (
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Message dispatched and logged to candidate audit history.</span>
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-4 text-xs">
            {/* Recipient & Template Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Recipient Candidate
                </label>
                <select
                  value={selectedCandidateId}
                  onChange={(e) => handleCandidateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Reusable Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Email Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Message Body (Variables Automatically Merged)
              </label>
              <textarea
                rows={10}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                To: <span className="font-semibold">{selectedCandidate?.email}</span>
              </span>
              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-500/20 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'Sending...' : 'Send Message Now'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Sent Delivery History Log */}
        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Outreach Delivery Log</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {messages.length} sent
            </span>
          </div>

          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                No communications sent yet.
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 dark:bg-slate-800/40 space-y-1.5 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                      {msg.candidateName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold capitalize">
                      {msg.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">
                    {msg.subject}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>By {msg.senderName}</span>
                    <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
