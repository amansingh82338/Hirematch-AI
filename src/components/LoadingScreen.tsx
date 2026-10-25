import React from 'react';
import { Briefcase } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Initializing HireMatch AI Recruitment CRM...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-crm-bg text-crm-text p-6">
      <div className="flex flex-col items-center max-w-sm text-center">
        <div className="w-14 h-14 rounded-xl bg-crm-accent flex items-center justify-center shadow-sm mb-4">
          <Briefcase className="w-7 h-7 text-crm-accent-fg" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-crm-text mb-1">
          HireMatch AI
        </h2>
        <p className="text-xs font-medium text-crm-text-secondary uppercase tracking-wider mb-6">
          Enterprise Recruitment Operations
        </p>

        {/* Clean subtle spinner and activity bar */}
        <div className="w-48 h-1.5 bg-crm-surface-secondary rounded-full overflow-hidden mb-4 border border-crm-border">
          <div className="h-full bg-crm-accent w-2/5 animate-pulse rounded-full" />
        </div>

        <p className="text-xs text-crm-text-secondary leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
};
