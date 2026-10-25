export type UserRole = 'admin' | 'recruiter' | 'hiring_manager' | 'interviewer';

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
  avatar?: string;
  passwordHash?: string;
  failedLoginAttempts?: number;
  lockoutUntil?: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  organizationId: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthResponse {
  user: User;
  organization: Organization;
  token: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string;
  industry: string;
  plan: string;
  createdAt: string;
}

export type JobStatus = 'draft' | 'published' | 'paused' | 'closed' | 'archived';
export type WorkplaceType = 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship';

export interface ScoringWeights {
  requiredSkills: number; // e.g. 40
  experience: number;     // e.g. 25
  education: number;      // e.g. 15
  projects: number;       // e.g. 10
  preferredSkills: number;// e.g. 10
}

export interface Job {
  id: string;
  organizationId: string;
  title: string;
  department: string;
  location: string;
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  status: JobStatus;
  description: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  experienceMinYears: number;
  experienceMaxYears?: number;
  educationLevel: string;
  certifications: string[];
  openingsCount: number;
  hiringManagerId: string;
  recruiterId: string;
  scoringWeights: ScoringWeights;
  requirementsApproved: boolean;
  requirementsApprovedBy?: string;
  requirementsApprovedAt?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedRequirement {
  field: string;
  value: string | string[] | number;
  confidence: number;
  supportingQuote: string;
  uncertain: boolean;
  flagReason?: string;
}

export interface JDExtractionResult {
  jobTitle?: string;
  department?: string;
  requiredSkills: { skill: string; evidence: string; confidence: number; uncertain: boolean }[];
  preferredSkills: { skill: string; evidence: string; confidence: number; uncertain: boolean }[];
  experienceYearsMin: number;
  experienceYearsMax?: number;
  experienceEvidence: string;
  educationLevel: string;
  educationEvidence: string;
  responsibilities: { item: string; evidence: string }[];
  certifications: { name: string; evidence: string }[];
  uncertainItems: string[];
  rawText: string;
}

export interface WorkHistoryItem {
  id?: string;
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  skillsUsed?: string[];
}

export interface EducationItem {
  id?: string;
  degree: string;
  fieldOfStudy?: string;
  institution: string;
  year?: string;
  gpa?: string;
}

export interface ProjectItem {
  id?: string;
  title: string;
  description?: string;
  technologies?: string[];
  url?: string;
}

export type CandidateReviewStatus = 'pending_review' | 'verified' | 'flagged';

export interface Candidate {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  totalExperienceYears: number;
  skills: string[];
  workHistory: WorkHistoryItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: string[];
  source: 'referral' | 'linkedin' | 'career_site' | 'agency' | 'upload';
  reviewStatus: CandidateReviewStatus;
  missingFields: string[]; // e.g. ['phone', 'certifications'] marked explicitly as unknown
  hasResume: boolean;
  resumeFileName?: string;
  resumeParsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeExtractionResult {
  candidateName: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  totalExperienceYears: number;
  skills: { name: string; quote: string; confidence: number }[];
  workHistory: {
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    description: string;
    quote: string;
  }[];
  education: {
    degree: string;
    institution: string;
    year?: string;
    quote: string;
  }[];
  projects: {
    title: string;
    description: string;
    technologies: string[];
    quote: string;
  }[];
  certifications: {
    name: string;
    quote: string;
  }[];
  unknownFields: string[];
  confidence: number;
  securityNotice?: string; // Flag if adversarial prompt injection detected in resume
}

export type ApplicationStage =
  | 'applied'
  | 'screening'
  | 'shortlisted'
  | 'interview'
  | 'assessment'
  | 'offer'
  | 'hired'
  | 'rejected';

export interface Application {
  id: string;
  organizationId: string;
  jobId: string;
  candidateId: string;
  stage: ApplicationStage;
  stageUpdatedAt: string;
  overallScore?: number;
  matchRunId?: string;
  notes?: string;
  rejectionReason?: string;
  assignedRecruiterId?: string;
  createdAt: string;
  updatedAt: string;
  // Joined fields for convenience
  candidate?: Candidate;
  job?: Job;
}

export interface CriterionMatch {
  criterion: 'requiredSkills' | 'experience' | 'education' | 'projects' | 'preferredSkills';
  name: string;
  weight: number;
  score: number;       // 0 to 100
  weightedScore: number; // score * (weight / 100)
  evidence: string[];
  missingEvidence: string[];
  unknownInfo: string[];
  confidence: number;
}

export interface MatchRun {
  id: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  scoringConfigVersion: number;
  weights: ScoringWeights;
  overallScore: number; // 0 to 100
  criteria: CriterionMatch[];
  skillGaps: string[];
  strongMatches: string[];
  summaryExplanation: string;
  disclaimer: string;
  generatedAt: string;
}

export interface PipelineEvent {
  id: string;
  applicationId: string;
  fromStage: ApplicationStage | 'none';
  toStage: ApplicationStage;
  actorUserId: string;
  actorName: string;
  note?: string;
  timestamp: string;
}

export interface Interview {
  id: string;
  organizationId: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  format: 'video' | 'phone' | 'onsite';
  meetingLink?: string;
  location?: string;
  interviewerIds: string[];
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  preparationNotes?: string;
  candidateName?: string;
  jobTitle?: string;
  createdAt: string;
}

export type InterviewRecommendation =
  | 'strong_hire'
  | 'hire'
  | 'neutral'
  | 'no_hire'
  | 'strong_no_hire';

export interface InterviewFeedback {
  id: string;
  interviewId: string;
  interviewerUserId: string;
  interviewerName: string;
  rating: number; // 1 to 5
  recommendation: InterviewRecommendation;
  criteriaRatings: {
    criterion: string;
    rating: number;
    comments: string;
  }[];
  strengths: string;
  areasOfConcern: string;
  submittedAt: string;
}

export interface CommunicationTemplate {
  id: string;
  organizationId: string;
  name: string;
  category: 'invitation' | 'rejection' | 'offer' | 'followup';
  subject: string;
  bodyTemplate: string;
  variables: string[]; // e.g. ['candidate_name', 'job_title', 'company_name']
}

export interface CommunicationMessage {
  id: string;
  organizationId: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  senderUserId: string;
  senderName: string;
  type: 'email' | 'invite' | 'status_update' | 'offer_letter';
  subject: string;
  body: string;
  status: 'draft' | 'sent' | 'delivered';
  templateId?: string;
  sentAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  activeJobsCount: number;
  totalCandidatesCount: number;
  newApplicantsCount: number;
  shortlistedCount: number;
  interviewsScheduledCount: number;
  offersCount: number;
  hiresCount: number;
  stageFunnel: {
    stage: ApplicationStage;
    count: number;
    conversionRate: number; // percentage from previous stage
  }[];
  jobProgress: {
    jobId: string;
    title: string;
    department: string;
    openingsCount: number;
    applicationsCount: number;
    shortlistedCount: number;
    interviewingCount: number;
    hiresCount: number;
  }[];
  recentActivities: AuditLog[];
  alerts: {
    id: string;
    type: 'warning' | 'info' | 'action_required';
    title: string;
    message: string;
    linkUrl?: string;
  }[];
  metrics: {
    avgTimeToHireDays: number;
    interviewToOfferRate: number;
    offerAcceptanceRate: number;
    topSources: { source: string; count: number }[];
  };
}
