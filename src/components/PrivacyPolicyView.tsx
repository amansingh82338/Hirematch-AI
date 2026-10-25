import React from 'react';
import { ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle2, UserCheck } from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBack?: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 text-crm-text">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-crm-text-secondary hover:text-crm-text cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Application</span>
        </button>
      )}

      <div className="border border-crm-border bg-crm-surface rounded-xl p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-crm-surface-secondary border border-crm-border flex items-center justify-center text-crm-accent">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-crm-text">
              HireMatch AI Privacy Policy
            </h1>
            <p className="text-xs text-crm-text-secondary mt-0.5">
              Effective Date: October 2026 | Enterprise Recruitment Data Governance
            </p>
          </div>
        </div>

        <div className="space-y-6 text-xs text-crm-text-secondary leading-relaxed pt-4 border-t border-crm-border">
          <section>
            <h2 className="text-sm font-bold text-crm-text mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-crm-accent" />
              1. Commitment to Candidate and Customer Privacy
            </h2>
            <p>
              HireMatch AI is dedicated to safeguarding recruitment data, applicant submissions, and enterprise hiring workflows. This policy specifies how candidate documents, job requisitions, interviewer feedback, and audit logs are collected, processed, and protected within your dedicated workspace tenant.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-crm-text mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-crm-accent" />
              2. Data Collected and Processed
            </h2>
            <p className="mb-2">
              Our platform processes information submitted by recruiters, hiring managers, and candidates, including:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Candidate identity data: Full name, email address, telephone contact, and geographic location.</li>
              <li>Professional histories: Employment records, titles, educational credentials, certifications, and technical projects.</li>
              <li>Resume documents: Uploaded PDF and DOCX files, parsed text segments, and cited extraction evidence.</li>
              <li>Evaluation metrics: Recruiter interview scorecards, qualitative ratings, feedback rubrics, and communication histories.</li>
              <li>Account credentials: Salted cryptographic password hashes and session tokens. Plaintext passwords are never stored.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-bold text-crm-text mb-2 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-crm-accent" />
              3. Strict Multi-Tenant Isolation
            </h2>
            <p>
              HireMatch AI enforces strict tenant data partitioning. Every registered customer organization operates within an isolated data domain. Candidates, open jobs, match scores, and interview rubrics associated with your organization are never accessible or queryable by other customer organizations.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-crm-text mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-crm-accent" />
              4. Ethical AI and Algorithmic Non-Discrimination
            </h2>
            <p className="mb-2">
              HireMatch AI operates under strict ethical guidelines for artificial intelligence:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Advisory Scoring Only: Candidate match scores reflect verifiable alignment with stated job criteria. They do not predict career success and do not constitute automated hiring decisions.</li>
              <li>Human in the Loop: Human recruiters retain full authority over all pipeline stage transitions, shortlisting, interview invitations, and job offers.</li>
              <li>Protected Attributes Excluded: Scoring criteria exclude protected characteristics, such as race, gender, age, religion, national origin, and marital status.</li>
              <li>Evidence Traceability: AI extraction outputs are linked to original resume quotes so recruiters can inspect and correct parsed information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-bold text-crm-text mb-2">
              5. Data Security and Retention
            </h2>
            <p>
              All customer communications are encrypted using Transport Layer Security (TLS 1.3). Application data is maintained with continuous backups, and audit logs record critical events including job requirement approvals, candidate stage modifications, and interview scorecards. Organizations may request data deletion or candidate profile purging at any time.
            </p>
          </section>

          <section className="pt-4 border-t border-crm-border text-[11px]">
            <p>
              For privacy inquiries or data rights requests, contact your workspace administrator or email <code className="text-crm-text font-mono">privacy@acme.ai</code>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
