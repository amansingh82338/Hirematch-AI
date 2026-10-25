import React from 'react';
import { FileCheck, ArrowLeft, Shield, Scale, AlertTriangle, Users } from 'lucide-react';

interface TermsViewProps {
  onBack?: () => void;
}

export const TermsView: React.FC<TermsViewProps> = ({ onBack }) => {
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
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-crm-text">
              Terms & Conditions of Service
            </h1>
            <p className="text-xs text-crm-text-secondary mt-0.5">
              HireMatch AI Enterprise Recruitment Platform Agreement | Updated October 2026
            </p>
          </div>
        </div>

        <div className="space-y-6 text-xs text-crm-text-secondary leading-relaxed pt-4 border-t border-crm-border">
          <section>
            <h2 className="text-sm font-bold text-crm-text mb-2 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-crm-accent" />
              1. Platform Scope and Purpose
            </h2>
            <p>
              HireMatch AI provides recruitment teams, human resources professionals, and interviewers with software tools to manage job requisitions, candidate profiles, resume parsing workflows, alignment scoring, interview evaluation rubrics, and candidate outreach.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-crm-text mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-crm-accent" />
              2. Fair Hiring Compliance and User Responsibility
            </h2>
            <p className="mb-2">
              Organizations utilizing HireMatch AI agree to comply with applicable federal, state, and local employment laws, including Title VII of the Civil Rights Act, the Americans with Disabilities Act, and fair employment standards.
            </p>
            <p>
              Users agree never to use candidate alignment calculations as the sole determinant for employment decisions. All final hiring, rejection, and offer decisions require independent human evaluation and recruiter judgment.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-crm-text mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-crm-accent" />
              3. Customer Data Ownership
            </h2>
            <p>
              Customers retain sole ownership and title to all job descriptions, candidate resumes, evaluation notes, and internal communications submitted to the platform. HireMatch AI does not use proprietary customer recruitment records to train public AI foundation models.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-crm-text mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-crm-accent" />
              4. Responsible Use of AI Capabilities
            </h2>
            <p>
              Recruitment teams are required to review extracted job requirements and resume parsing results before approving criteria versions. Uploading resumes containing malicious injection scripts or deceptive formatting intended to compromise recruitment integrity is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-crm-text mb-2">
              5. Auditability and Activity Tracking
            </h2>
            <p>
              To maintain accountability, administrative actions including requirement versioning, candidate status changes, and interview submissions are recorded in immutable audit logs accessible to tenant administrators.
            </p>
          </section>

          <section className="pt-4 border-t border-crm-border text-[11px]">
            <p>
              Questions regarding these terms may be directed to your organization legal counsel or <code className="text-crm-text font-mono">legal@acme.ai</code>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
