import {
  User,
  Organization,
  Job,
  Candidate,
  Application,
  MatchRun,
  PipelineEvent,
  Interview,
  InterviewFeedback,
  CommunicationMessage,
  CommunicationTemplate,
  AuditLog,
  DashboardStats,
  JDExtractionResult,
  ResumeExtractionResult,
  AuthResponse,
} from '../types';

function getToken(): string | null {
  try {
    return localStorage.getItem('hirematch_token');
  } catch (e) {
    return null;
  }
}

function setToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem('hirematch_token', token);
    } else {
      localStorage.removeItem('hirematch_token');
    }
  } catch (e) {}
}

function getAuthHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { ...customHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  getToken,
  setToken,

  // Auth & Session
  async register(
    name: string,
    email: string,
    password: string,
    organizationName?: string
  ): Promise<AuthResponse> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, organizationName }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Login failed');
      (err as any).lockout = data.lockout;
      throw err;
    }
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (e) {}
    setToken(null);
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to change password');
    }
    return data;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  async updateProfile(updates: { name?: string; title?: string; department?: string; avatar?: string }): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }
    return data;
  },

  async getAuth(): Promise<{
    user: User;
    organization: Organization;
    availableUsers: User[];
    organizations: Organization[];
    isGeminiConfigured: boolean;
  }> {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async switchUser(userId?: string, organizationId?: string): Promise<{ success: boolean; user: User; token?: string }> {
    const res = await fetch('/api/auth/switch-user', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ userId, organizationId }),
    });
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch('/api/dashboard/stats', {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Jobs
  async getJobs(filters?: { search?: string; department?: string; status?: string; workplaceType?: string }): Promise<Job[]> {
    const cleanParams: Record<string, string> = {};
    if (filters) {
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== '' && v !== 'undefined') {
          cleanParams[k] = String(v);
        }
      }
    }
    const params = new URLSearchParams(cleanParams);
    const qs = params.toString();
    const res = await fetch(`/api/jobs${qs ? `?${qs}` : ''}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getJob(id: string): Promise<Job> {
    const res = await fetch(`/api/jobs/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async createJob(jobData: Partial<Job>): Promise<Job> {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(jobData),
    });
    return res.json();
  },

  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  // AI JD Extraction
  async extractJD(jdText: string): Promise<JDExtractionResult> {
    const res = await fetch('/api/jobs/extract-jd', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ jdText }),
    });
    return res.json();
  },

  async approveJobRequirements(id: string, approvedRequirements: Partial<Job>): Promise<Job> {
    const res = await fetch(`/api/jobs/${id}/approve-requirements`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ approvedRequirements }),
    });
    return res.json();
  },

  // Candidates
  async getCandidates(filters?: { search?: string; skill?: string; minExperience?: number; reviewStatus?: string; source?: string }): Promise<Candidate[]> {
    const cleanParams: Record<string, string> = {};
    if (filters) {
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== '' && v !== 'undefined') {
          cleanParams[k] = String(v);
        }
      }
    }
    const params = new URLSearchParams(cleanParams);
    const qs = params.toString();
    const res = await fetch(`/api/candidates${qs ? `?${qs}` : ''}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getCandidate(id: string): Promise<Candidate> {
    const res = await fetch(`/api/candidates/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async createCandidate(data: Partial<Candidate>): Promise<Candidate> {
    const res = await fetch('/api/candidates', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || err.error || 'Failed to create candidate');
    }
    return res.json();
  },

  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate> {
    const res = await fetch(`/api/candidates/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  // AI Resume Parsing & Bulk Upload
  async parseResume(resumeText: string, fileName?: string): Promise<{ extraction: ResumeExtractionResult; fileName: string; parsedAt: string }> {
    const res = await fetch('/api/candidates/parse-resume', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ resumeText, fileName }),
    });
    return res.json();
  },

  async bulkUploadResumes(resumes: { fileName: string; text: string }[]): Promise<{ processedCount: number; items: any[] }> {
    const res = await fetch('/api/candidates/bulk-upload', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ resumes }),
    });
    return res.json();
  },

  // Applications & Pipeline
  async getApplications(filters?: { jobId?: string; candidateId?: string; stage?: string }): Promise<Application[]> {
    const cleanParams: Record<string, string> = {};
    if (filters) {
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== '' && v !== 'undefined') {
          cleanParams[k] = String(v);
        }
      }
    }
    const params = new URLSearchParams(cleanParams);
    const qs = params.toString();
    const res = await fetch(`/api/applications${qs ? `?${qs}` : ''}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async createApplication(jobId: string, candidateId: string, notes?: string): Promise<Application> {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ jobId, candidateId, notes }),
    });
    return res.json();
  },

  async updateApplicationStage(id: string, stage: string, note?: string, rejectionReason?: string): Promise<Application> {
    const res = await fetch(`/api/applications/${id}/stage`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ stage, note, rejectionReason }),
    });
    return res.json();
  },

  async getPipelineEvents(applicationId: string): Promise<PipelineEvent[]> {
    const res = await fetch(`/api/applications/${applicationId}/events`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Matching & Side-by-Side Comparison
  async runMatch(jobId: string, candidateId: string, customWeights?: any): Promise<MatchRun> {
    const res = await fetch('/api/matching/run', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ jobId, candidateId, customWeights }),
    });
    return res.json();
  },

  async compareCandidates(jobId: string, candidateIds: string[]): Promise<{
    job: Job;
    comparisons: Array<{ candidate: Candidate; match: MatchRun }>;
    disclaimer: string;
  }> {
    const res = await fetch('/api/matching/compare', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ jobId, candidateIds }),
    });
    return res.json();
  },

  // Interviews
  async getInterviews(jobId?: string): Promise<Interview[]> {
    const url = jobId ? `/api/interviews?jobId=${jobId}` : '/api/interviews';
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async scheduleInterview(data: Partial<Interview>): Promise<Interview> {
    const res = await fetch('/api/interviews', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateInterview(id: string, updates: Partial<Interview>): Promise<Interview> {
    const res = await fetch(`/api/interviews/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async getInterviewFeedback(interviewId: string): Promise<InterviewFeedback[]> {
    const res = await fetch(`/api/interviews/${interviewId}/feedback`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async submitInterviewFeedback(feedbackData: Partial<InterviewFeedback>): Promise<InterviewFeedback> {
    const res = await fetch('/api/interviews/feedback', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(feedbackData),
    });
    return res.json();
  },

  // Communications & Templates
  async getCommunications(applicationId?: string): Promise<CommunicationMessage[]> {
    const url = applicationId ? `/api/communications?applicationId=${applicationId}` : '/api/communications';
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getTemplates(): Promise<CommunicationTemplate[]> {
    const res = await fetch('/api/communications/templates', {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async sendCommunication(data: Partial<CommunicationMessage>): Promise<CommunicationMessage> {
    const res = await fetch('/api/communications/send', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // AI TTS
  async generateSpeechTTS(text: string, voiceName?: string): Promise<{ audioBase64: string; mimeType: string }> {
    const res = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ text, voiceName }),
    });
    return res.json();
  },

  // AI Image Generation (Embedded Vector Graphics Engine with 1K, 2K, 4K)
  async generateRecruitmentImage(prompt: string, aspectRatio?: string, imageSize?: '1K' | '2K' | '4K'): Promise<{ imageUrl: string; imageSize: string; modelUsed: string }> {
    const res = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ prompt, aspectRatio, imageSize }),
    });
    return res.json();
  },

  // AI Talent Copilot Multi-Turn Chat
  async chatTalentCopilot(messages: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>, role?: string): Promise<{ reply: string; role: string }> {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ messages, role }),
    });
    return res.json();
  },

  // Settings & Audit Logs
  async getSettings(): Promise<any> {
    const res = await fetch('/api/settings', {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async updateSettings(settings: any): Promise<any> {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs', {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};
