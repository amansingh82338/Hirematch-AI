import React, { useState, useRef, useEffect } from 'react';
import {
  BotMessageSquare,
  Send,
  Sparkles,
  User,
  Copy,
  Check,
  RefreshCw,
  Search,
  BookOpen,
  Scale,
  FileCheck,
} from 'lucide-react';
import { api } from '../services/api';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

type CopilotRole =
  | 'sourcing_advisor'
  | 'interview_evaluator'
  | 'job_spec_architect'
  | 'candidate_comparer';

export const AiCopilotView: React.FC = () => {
  const [role, setRole] = useState<CopilotRole>('sourcing_advisor');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: `Hello! I am your **AI Talent Copilot**, powered by the embedded HireMatch NLP Engine.

I can help you with:
- Crafting high-precision **Boolean search strings** for LinkedIn Recruiter & GitHub
- Preparing structured **technical interview rubrics** & behavioral evaluation criteria
- Auditing **job descriptions** for inclusive phrasing and clear requirements
- Conducting neutral, evidence-grounded candidate comparisons

Select a role above or ask a question below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Map to message history format
      const formattedHistory = newMessages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const res = await api.chatTalentCopilot(formattedHistory, role);
      setMessages([
        ...newMessages,
        {
          role: 'model',
          text: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e) {
      console.error('Chat error:', e);
      setMessages([
        ...newMessages,
        {
          role: 'model',
          text: 'I encountered an issue processing your request. Please try again or rephrase your prompt.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const promptSuggestions = [
    {
      label: 'Boolean Sourcing String for AI Engineer',
      prompt: 'Generate a LinkedIn Recruiter boolean search query for a Senior AI Systems Engineer with Python, FastAPI, and Vector Search experience.',
    },
    {
      label: 'System Design Interview Rubric',
      prompt: 'Prepare a 45-minute technical system design rubric with scoring criteria (1-5) evaluating vector database scaling and cache strategies.',
    },
    {
      label: 'Job Spec Inclusion Review',
      prompt: 'Review requirements for a Staff Frontend position to distinguish mandatory technical skills from optional preferences and eliminate biased language.',
    },
  ];

  const roleInfo: Record<CopilotRole, { title: string; desc: string; icon: any }> = {
    sourcing_advisor: {
      title: 'Talent Sourcing Advisor',
      desc: 'Boolean queries, talent market mapping & outreach copy',
      icon: Search,
    },
    interview_evaluator: {
      title: 'Technical Interview Evaluator',
      desc: 'Structured STAR questions, rubrics & non-biased scoring',
      icon: BookOpen,
    },
    job_spec_architect: {
      title: 'Job Spec Architect',
      desc: 'Inclusive language audit, requirements calibration',
      icon: Scale,
    },
    candidate_comparer: {
      title: 'Candidate Alignment Analyst',
      desc: 'Objective, evidence-backed candidate tradeoffs',
      icon: FileCheck,
    },
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header & Role Switcher */}
      <div className="space-y-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              AI Talent Copilot
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                HireMatch NLP Model
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Multi-turn recruiter advisory agent with specialized system instruction roles.
            </p>
          </div>
        </div>

        {/* Specialized Role Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(roleInfo) as CopilotRole[]).map((r) => {
            const isSelected = role === r;
            const Icon = roleInfo[r].icon;
            return (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 dark:border-indigo-700 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span className="truncate">{roleInfo[r].title}</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-1">
                  {roleInfo[r].desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages Scrollable Thread */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-4 shadow-xs">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                  isUser
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    : 'bg-crm-accent text-crm-accent-fg'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>

              <div className={`space-y-1 max-w-[85%] sm:max-w-[75%]`}>
                <div
                  className={`p-4 rounded-xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-crm-accent text-crm-accent-fg rounded-tr-xs'
                      : 'bg-slate-50 dark:bg-slate-850 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-xs'
                  }`}
                >
                  {msg.text}
                </div>

                <div
                  className={`flex items-center gap-2 text-[10px] text-slate-400 px-1 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.text, idx)}
                      className="hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-0.5"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-crm-accent text-crm-accent-fg flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 animate-pulse">
              HireMatch NLP Engine is evaluating requirements...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Try:
        </span>
        {promptSuggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s.prompt)}
            className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 shrink-0 transition-colors"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Input Composer */}
      <div className="shrink-0 flex gap-2">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`Ask your ${roleInfo[role].title}... (Press Enter to send)`}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none shadow-xs"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm disabled:opacity-50 transition-colors shadow-sm shadow-indigo-500/20 shrink-0 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
