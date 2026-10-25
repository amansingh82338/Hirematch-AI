import React, { useState } from 'react';
import {
  Upload,
  Sparkles,
  X,
  CheckCircle,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';

interface BulkResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

export const BulkResumeModal: React.FC<BulkResumeModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
}) => {
  const [resumesToProcess, setResumesToProcess] = useState<
    Array<{ fileName: string; text: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [processedResults, setProcessedResults] = useState<any[] | null>(null);

  if (!isOpen) return null;

  const handleAddSampleResumes = () => {
    setResumesToProcess([
      {
        fileName: 'Liam_Kovacs_Cloud_Engineer.pdf',
        text: `Liam Kovacs
Email: liam.kovacs@cloudmail.io
Phone: +1 (206) 555-7193
Location: Seattle, WA

Summary:
Cloud Infrastructure & DevOps Engineer with 6 years of hands-on experience designing Kubernetes microservices, Terraform automation, and CI/CD pipelines.

Experience:
- Senior DevOps Engineer at Nordstrom Tech (2022 - Present)
  Designed multi-cluster Kubernetes deployments on AWS. Reduced deployment failure rate by 35% through automated Canary releases.
  Skills: Kubernetes, Docker, Terraform, AWS, Linux, CI/CD Pipelines.
- Systems Engineer at F5 Networks (2019 - 2022)
  Maintained Linux bare-metal and container infrastructure with Prometheus and Ansible.

Education:
- B.S. in Computer Science, University of Washington, 2019.

Certifications:
- Certified Kubernetes Administrator (CKA).`,
      },
      {
        fileName: 'Amina_Bello_Frontend_Architect.docx',
        text: `Amina Bello
Email: amina.bello@techfoundry.co
Phone: +1 (650) 555-0922
Location: San Francisco, CA

Headline: Senior Frontend Engineer | React 19, TypeScript & Design Systems

Professional Profile:
Over 5 years of frontend leadership building responsive web applications, design systems, and web performance optimizations.

Work History:
- Senior UI Engineer at Figma Community Partner (2021 - Present)
  Spearheaded component library refactoring with React and TypeScript. Architected accessible WCAG 2.1 AA components.
  Skills: React, TypeScript, Tailwind CSS, Next.js, WCAG Accessibility.
- Frontend Developer at Canva (2019 - 2021)
  Built real-time collaborative canvas controls in JavaScript and CSS.

Education:
- Bachelor of Science in Software Engineering, San Jose State University, 2019.

Side Projects:
- AccessibleUI Toolkit: Open-source headless UI component library for React.`,
      },
    ]);
  };

  const handleRunProcessing = async () => {
    if (resumesToProcess.length === 0) return;
    setLoading(true);
    try {
      const data = await api.bulkUploadResumes(resumesToProcess);
      setProcessedResults(data.items);
      onUploadComplete();
    } catch (e) {
      console.error('Bulk upload processing error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Bulk Resume AI Ingestion & Evidence Extractor
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Parses PDF/DOCX resumes, detects duplicate candidates, sanitizes adversarial prompt injections, and captures evidence citations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!processedResults ? (
            <>
              {/* Drag & Drop File Zone */}
              <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Upload Candidate Resumes (PDF, DOCX, TXT)
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    AI will extract skills, experience, and certifications while marking missing fields as "unknown" rather than absent.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleAddSampleResumes}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load 2 Realistic Candidate Resumes</span>
                  </button>
                </div>
              </div>

              {/* Staged Resumes List */}
              {resumesToProcess.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Staged for Parsing ({resumesToProcess.length} documents)
                  </span>
                  <div className="space-y-2">
                    {resumesToProcess.map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {doc.fileName}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            ({(doc.text.length / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => setResumesToProcess(resumesToProcess.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Anti-Injection Security Notice */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800 dark:text-slate-200">Adversarial Resistance:</strong> Resumes are treated strictly as untrusted user data. Embedded instructions to override hiring ratings or bypass stages are neutralized.
                </span>
              </div>
            </>
          ) : (
            /* Results View */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Successfully processed {processedResults.length} resumes into candidate CRM.</span>
              </div>

              <div className="space-y-3">
                {processedResults.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.candidate?.name || item.fileName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {item.status === 'duplicate' ? 'Duplicate Profile Merged' : 'Created & Staged'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {item.candidate?.headline || item.candidate?.email}
                    </div>
                    {item.extraction && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(item.extraction.skills || []).slice(0, 5).map((s: any) => (
                          <span
                            key={s.name}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {processedResults ? 'Done' : 'Cancel'}
          </button>
          {!processedResults ? (
            <button
              onClick={handleRunProcessing}
              disabled={loading || resumesToProcess.length === 0}
              className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 disabled:opacity-50 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Parsing Documents...' : `Parse ${resumesToProcess.length} Resumes`}</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              View in Candidates CRM
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
