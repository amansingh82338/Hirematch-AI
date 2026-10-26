/**
 * Tour persistence and configuration logic for HireMatch AI
 */

export interface TourStepConfig {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto';
  disableBeacon?: boolean;
}

export const TOUR_STORAGE_PREFIX = 'hirematch_tour_completed_';

export function getTourStorageKey(userId: string): string {
  return `${TOUR_STORAGE_PREFIX}${userId || 'guest'}`;
}

export function isTourCompleted(userId: string, storage: Storage = window.localStorage): boolean {
  try {
    return storage.getItem(getTourStorageKey(userId)) === 'true';
  } catch {
    return false;
  }
}

export function markTourCompleted(userId: string, storage: Storage = window.localStorage): void {
  try {
    storage.setItem(getTourStorageKey(userId), 'true');
  } catch {
    // Graceful fallback for restricted storage environments
  }
}

export function resetTourStatus(userId: string, storage: Storage = window.localStorage): void {
  try {
    storage.removeItem(getTourStorageKey(userId));
  } catch {
    // Graceful fallback
  }
}

export const ONBOARDING_TOUR_STEPS: TourStepConfig[] = [
  {
    target: '#tour-command-center',
    title: 'Recruitment Command Center',
    content: 'Welcome to HireMatch AI. This dashboard provides real-time visibility into your hiring pipeline, active job requisitions, and candidate alignment metrics.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '#tour-dashboard-kpis',
    title: 'Pipeline Health & Metrics',
    content: 'Track active job openings, total candidates in your CRM, upcoming interviews, and offer acceptance rates at a single glance.',
    placement: 'bottom',
  },
  {
    target: '#tour-create-job-btn',
    title: 'Create Job Openings',
    content: 'Publish new requisitions with AI-assisted job description generation and automatic skill requirement extraction.',
    placement: 'bottom',
  },
  {
    target: '#tour-bulk-parse-btn',
    title: 'Bulk Resume AI Parsing',
    content: 'Upload resumes in bulk to extract candidate work history, key technical competencies, education, and contact details automatically.',
    placement: 'bottom',
  },
  {
    target: '#tour-recruitment-funnel',
    title: 'Conversion Funnel',
    content: 'Inspect candidate progression across all stages—from initial application to phone screening, technical evaluation, and final hire.',
    placement: 'top',
  },
  {
    target: '#tour-priority-alerts',
    title: 'Priority Alerts & Action Items',
    content: 'Stay informed on pending interviewer evaluations, urgent offers awaiting candidate signatures, and stalled applications.',
    placement: 'top',
  },
  {
    target: '#tour-global-search',
    title: 'Global Instant Search',
    content: 'Press ⌘K or click here anytime to search across all jobs, candidates, resumes, and specific skill tags instantly.',
    placement: 'bottom',
  },
  {
    target: '#tour-sidebar-nav',
    title: 'Recruiter Workspace Navigation',
    content: 'Access dedicated workspaces: Visual Kanban Pipeline, Explainable AI Match & Compare, Interview Scheduling, and Talent Copilot.',
    placement: 'right',
  },
  {
    target: '#tour-theme-toggle',
    title: 'Custom Color Themes',
    content: 'Toggle between custom Light and Dark modes. Your preference is persisted across sessions without any screen flash.',
    placement: 'bottom',
  },
  {
    target: '#tour-user-menu',
    title: 'Account & Organization Security',
    content: 'Review your role permissions, switch demo personas for role-based access testing, or manage organization settings.',
    placement: 'bottom',
  },
];
