import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { db } from './server/db';
import {
  extractJobDescription,
  parseResumeText,
  generateSpeechTTS,
  generateRecruitmentImage,
  chatWithTalentCopilot,
  isGeminiConfigured,
} from './server/gemini';
import { calculateCandidateJobMatch } from './src/services/matching';
import { User, ApplicationStage } from './src/types';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable JSON parsing with generous payload limit for resume files & base64
app.use(express.json({ limit: '50mb' }));

// Tenant & Authentication Middleware
// Maintains active demo user fallback (Sarah Jenkins - VP of Talent Acquisition, Admin)
let currentActor: User = db.getUsers('org_acme')[0] || {
  id: 'usr_sarah',
  organizationId: 'org_acme',
  name: 'Sarah Jenkins',
  email: 'sarah.jenkins@acme.ai',
  role: 'admin',
  title: 'VP of Talent Acquisition',
  department: 'Human Resources',
  createdAt: new Date().toISOString(),
};

declare global {
  namespace Express {
    interface Request {
      user?: User;
      organization?: any;
      token?: string;
    }
  }
}

// Extract Bearer token and validate session for authentic multi-tenant isolation
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const sessionData = db.validateSession(token);
    if (sessionData) {
      req.user = sessionData.user;
      req.organization = sessionData.organization;
      req.token = token;
      return next();
    }
  }
  req.user = undefined;
  req.organization = undefined;
  req.token = undefined;
  next();
});

const getActor = (req: express.Request): User => {
  if (!req.user) {
    const err: any = new Error('Authentication required. Please sign in to access workspace data.');
    err.status = 401;
    throw err;
  }
  return req.user;
};

// --- AUTH & SESSION ROUTES ---

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, organizationName } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const result = db.registerUser(name, email, password, organizationName);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Set as active session for fallback as well
  if (result.user) currentActor = result.user;

  res.status(201).json({
    user: result.user,
    organization: result.organization,
    token: result.session?.token,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const result = db.loginUser(email, password);
  if (!result.success) {
    return res.status(result.lockout ? 429 : 401).json({
      error: result.error,
      lockout: result.lockout,
    });
  }

  // Set as current demo actor too
  if (result.user) currentActor = result.user;

  res.json({
    user: result.user,
    organization: result.organization,
    token: result.session?.token,
  });
});

app.post('/api/auth/logout', (req, res) => {
  if (req.token) {
    db.destroySession(req.token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

app.post('/api/auth/change-password', (req, res) => {
  const actor = getActor(req);
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  const result = db.changePassword(actor.id, oldPassword, newPassword);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ success: true, message: 'Password updated successfully.' });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const result = db.requestPasswordReset(email);
  res.json(result);
});

app.patch('/api/auth/profile', (req, res) => {
  const actor = getActor(req);
  const updated = db.updateUserProfile(actor.id, req.body);
  if (!updated) return res.status(404).json({ error: 'User not found.' });

  if (currentActor.id === actor.id) {
    currentActor = updated;
  }

  res.json({ success: true, user: updated });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.json({
      user: null,
      organization: null,
      availableUsers: [],
      organizations: [],
      isGeminiConfigured: isGeminiConfigured(),
    });
  }

  const org = req.organization || db.getOrganization(req.user.organizationId);
  const availableUsers = db.getUsers(req.user.organizationId);
  const organizations = db.getOrganizations();

  res.json({
    user: req.user,
    organization: org,
    availableUsers,
    organizations,
    isGeminiConfigured: isGeminiConfigured(),
  });
});

app.post('/api/auth/switch-user', (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  const user = db.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const session = db.createSession(user.id, user.organizationId);
  const org = db.getOrganization(user.organizationId);

  res.json({
    success: true,
    user,
    organization: org,
    token: session.token,
  });
});

// --- DASHBOARD REAL METRICS ---

app.get('/api/dashboard/stats', (req, res) => {
  const actor = getActor(req);
  const stats = db.getDashboardStats(actor.organizationId);
  res.json(stats);
});

// --- JOBS MANAGEMENT ---

app.get('/api/jobs', (req, res) => {
  const actor = getActor(req);
  const { search, department, status, workplaceType } = req.query as Record<string, string>;
  const jobs = db.getJobs(actor.organizationId, {
    search,
    department,
    status,
    workplaceType,
  });
  res.json(jobs);
});

app.get('/api/jobs/:id', (req, res) => {
  const actor = getActor(req);
  const job = db.getJob(req.params.id, actor.organizationId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.post('/api/jobs', (req, res) => {
  const actor = getActor(req);
  try {
    const created = db.createJob(
      {
        ...req.body,
        organizationId: actor.organizationId,
        scoringWeights: req.body.scoringWeights || {
          requiredSkills: 40,
          experience: 25,
          education: 15,
          projects: 10,
          preferredSkills: 10,
        },
      },
      actor
    );
    res.status(201).json(created);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.patch('/api/jobs/:id', (req, res) => {
  const actor = getActor(req);
  const updated = db.updateJob(req.params.id, req.body, actor);
  if (!updated) return res.status(404).json({ error: 'Job not found' });
  res.json(updated);
});

// --- AI JOB DESCRIPTION PROCESSING ---

app.post('/api/jobs/extract-jd', async (req, res) => {
  const { jdText } = req.body;
  if (!jdText || typeof jdText !== 'string') {
    return res.status(400).json({ error: 'Job description text is required' });
  }
  const result = await extractJobDescription(jdText);
  res.json(result);
});

app.post('/api/jobs/:id/approve-requirements', (req, res) => {
  const actor = getActor(req);
  const { approvedRequirements } = req.body;
  const job = db.getJob(req.params.id, actor.organizationId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const updated = db.updateJob(
    req.params.id,
    {
      ...approvedRequirements,
      requirementsApproved: true,
      requirementsApprovedBy: actor.id,
      requirementsApprovedAt: new Date().toISOString(),
    },
    actor
  );

  res.json(updated);
});

// --- CANDIDATE MANAGEMENT ---

app.get('/api/candidates', (req, res) => {
  const actor = getActor(req);
  const { search, skill, minExperience, reviewStatus, source } = req.query as Record<string, string>;
  const list = db.getCandidates(actor.organizationId, {
    search,
    skill,
    minExperience: minExperience ? Number(minExperience) : undefined,
    reviewStatus,
    source,
  });
  res.json(list);
});

app.get('/api/candidates/:id', (req, res) => {
  const actor = getActor(req);
  const candidate = db.getCandidate(req.params.id, actor.organizationId);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
  res.json(candidate);
});

app.post('/api/candidates', (req, res) => {
  const actor = getActor(req);
  const result = db.createCandidate(
    {
      ...req.body,
      organizationId: actor.organizationId,
      reviewStatus: req.body.reviewStatus || 'verified',
      missingFields: req.body.missingFields || [],
    },
    actor
  );

  if (result.duplicate) {
    return res.status(409).json({
      error: 'Duplicate candidate detected',
      existingCandidate: result.existing,
      message: `A candidate with email ${req.body.email} already exists in the system.`,
    });
  }

  res.status(201).json(result.candidate);
});

app.patch('/api/candidates/:id', (req, res) => {
  const actor = getActor(req);
  const updated = db.updateCandidate(req.params.id, req.body, actor);
  if (!updated) return res.status(404).json({ error: 'Candidate not found' });
  res.json(updated);
});

// --- AI RESUME PARSING ---

app.post('/api/candidates/parse-resume', async (req, res) => {
  const { resumeText, fileName } = req.body;
  if (!resumeText) {
    return res.status(400).json({ error: 'Resume text is required' });
  }

  const extraction = await parseResumeText(resumeText);
  res.json({
    extraction,
    fileName: fileName || 'Uploaded_Resume.pdf',
    parsedAt: new Date().toISOString(),
  });
});

app.post('/api/candidates/bulk-upload', async (req, res) => {
  const actor = getActor(req);
  const { resumes } = req.body;
  if (!Array.isArray(resumes)) {
    return res.status(400).json({ error: 'Resumes must be an array' });
  }

  const results = [];
  for (const item of resumes) {
    const extraction = await parseResumeText(item.text);
    const existing = db.checkDuplicateCandidate(actor.organizationId, extraction.email);

    if (existing) {
      results.push({
        fileName: item.fileName,
        status: 'duplicate',
        candidate: existing,
      });
      continue;
    }

    const created = db.createCandidate(
      {
        organizationId: actor.organizationId,
        name: extraction.candidateName || 'Unknown Candidate',
        email: extraction.email || `candidate_${Date.now()}@domain.com`,
        phone: extraction.phone,
        location: extraction.location,
        headline: extraction.headline,
        summary: extraction.summary,
        totalExperienceYears: extraction.totalExperienceYears || 0,
        skills: extraction.skills.map((s) => s.name),
        workHistory: extraction.workHistory,
        education: extraction.education,
        projects: extraction.projects,
        certifications: extraction.certifications.map((c) => c.name),
        source: 'upload',
        reviewStatus: extraction.confidence > 0.85 ? 'verified' : 'pending_review',
        missingFields: extraction.unknownFields || [],
        hasResume: true,
        resumeFileName: item.fileName,
        resumeParsedAt: new Date().toISOString(),
      },
      actor
    );

    results.push({
      fileName: item.fileName,
      status: 'created',
      candidate: created.candidate,
      extraction,
    });
  }

  res.json({ processedCount: results.length, items: results });
});

// --- APPLICATIONS & PIPELINE ---

app.get('/api/applications', (req, res) => {
  const actor = getActor(req);
  const { jobId, candidateId, stage } = req.query as Record<string, string>;
  const apps = db.getApplications(actor.organizationId, {
    jobId,
    candidateId,
    stage: stage as ApplicationStage,
  });
  res.json(apps);
});

app.post('/api/applications', (req, res) => {
  const actor = getActor(req);
  const { jobId, candidateId, notes } = req.body;
  if (!jobId || !candidateId) {
    return res.status(400).json({ error: 'jobId and candidateId are required' });
  }

  const app = db.createApplication(actor.organizationId, jobId, candidateId, actor, notes);
  res.status(201).json(app);
});

app.patch('/api/applications/:id/stage', (req, res) => {
  const actor = getActor(req);
  const { stage, note, rejectionReason } = req.body;
  if (!stage) return res.status(400).json({ error: 'Stage is required' });

  const updated = db.updateApplicationStage(req.params.id, stage, actor, note, rejectionReason);
  if (!updated) return res.status(404).json({ error: 'Application not found' });
  res.json(updated);
});

app.get('/api/applications/:id/events', (req, res) => {
  const events = db.getPipelineEvents(req.params.id);
  res.json(events);
});

// --- MATCHING ENGINE & COMPARISON ---

app.post('/api/matching/run', (req, res) => {
  const actor = getActor(req);
  const { jobId, candidateId, customWeights } = req.body;
  const job = db.getJob(jobId, actor.organizationId);
  const candidate = db.getCandidate(candidateId, actor.organizationId);

  if (!job || !candidate) {
    return res.status(404).json({ error: 'Job or Candidate not found' });
  }

  const match = calculateCandidateJobMatch({
    job,
    candidate,
    customWeights,
    scoringVersion: job.version || 1,
  });

  db.saveMatchRun(match);
  res.json(match);
});

app.post('/api/matching/compare', (req, res) => {
  const actor = getActor(req);
  const { jobId, candidateIds } = req.body;
  if (!jobId || !Array.isArray(candidateIds) || candidateIds.length === 0) {
    return res.status(400).json({ error: 'jobId and an array of candidateIds are required' });
  }

  const job = db.getJob(jobId, actor.organizationId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const comparisons = candidateIds.map((cid: string) => {
    const candidate = db.getCandidate(cid, actor.organizationId);
    if (!candidate) return null;
    const match = calculateCandidateJobMatch({ job, candidate });
    return {
      candidate,
      match,
    };
  }).filter(Boolean);

  res.json({
    job,
    comparisons,
    disclaimer: 'Alignment scores are purely advisory based on documented skills and criteria weights.',
  });
});

// --- INTERVIEWS ---

app.get('/api/interviews', (req, res) => {
  const actor = getActor(req);
  const { jobId } = req.query as { jobId?: string };
  const interviews = db.getInterviews(actor.organizationId, jobId);
  res.json(interviews);
});

app.post('/api/interviews', (req, res) => {
  const actor = getActor(req);
  try {
    const created = db.createInterview(
      {
        ...req.body,
        organizationId: actor.organizationId,
      },
      actor
    );
    res.status(201).json(created);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.patch('/api/interviews/:id', (req, res) => {
  const actor = getActor(req);
  const updated = db.updateInterview(req.params.id, req.body, actor);
  if (!updated) return res.status(404).json({ error: 'Interview not found' });
  res.json(updated);
});

app.get('/api/interviews/:id/feedback', (req, res) => {
  const feedback = db.getInterviewFeedback(req.params.id);
  res.json(feedback);
});

app.post('/api/interviews/feedback', (req, res) => {
  const actor = getActor(req);
  try {
    const fb = db.submitInterviewFeedback(req.body, actor);
    res.status(201).json(fb);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// --- COMMUNICATIONS & TEMPLATES ---

app.get('/api/communications', (req, res) => {
  const actor = getActor(req);
  const { applicationId } = req.query as { applicationId?: string };
  const comms = db.getCommunications(actor.organizationId, applicationId);
  res.json(comms);
});

app.get('/api/communications/templates', (req, res) => {
  const actor = getActor(req);
  const tmpls = db.getTemplates(actor.organizationId);
  res.json(tmpls);
});

app.post('/api/communications/send', (req, res) => {
  const actor = getActor(req);
  try {
    const sent = db.sendCommunication(
      {
        ...req.body,
        organizationId: actor.organizationId,
      },
      actor
    );
    res.status(201).json(sent);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// --- AI STUDIO CAPABILITIES (TTS, IMAGE GEN, CHATBOT) ---

app.post('/api/ai/tts', async (req, res) => {
  try {
    const { text, voiceName } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required for TTS' });
    const audioBase64 = await generateSpeechTTS(text, voiceName || 'Kore');
    res.json({ audioBase64, mimeType: 'audio/wav' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'TTS generation failed' });
  }
});

app.post('/api/ai/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio, imageSize } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const imageUrl = await generateRecruitmentImage({
      prompt,
      aspectRatio: aspectRatio || '16:9',
      imageSize: imageSize || '1K',
    });

    res.json({
      imageUrl,
      imageSize: imageSize || '1K',
      aspectRatio: aspectRatio || '16:9',
      modelUsed: 'hirematch-nlp-vector-engine',
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Image generation failed' });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, role } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const reply = await chatWithTalentCopilot({
      role: role || 'sourcing_advisor',
      messages,
    });

    res.json({ reply, role });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Chat generation failed' });
  }
});

// --- SETTINGS & AUDIT LOGS ---

app.get('/api/settings', (req, res) => {
  res.json(db.getSettings());
});

app.patch('/api/settings', (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

app.get('/api/audit-logs', (req, res) => {
  const actor = getActor(req);
  const logs = db.getAuditLogs(actor.organizationId);
  res.json(logs);
});

// --- CLIENT / VITE SERVING ---

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HireMatch AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
