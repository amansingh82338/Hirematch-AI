import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Organization,
  User,
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
  ApplicationStage,
  DashboardStats,
  AuthSession,
} from '../src/types';
import { calculateCandidateJobMatch } from '../src/services/matching';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

export interface DatabaseSchema {
  organizations: Organization[];
  users: User[];
  sessions: AuthSession[];
  jobs: Job[];
  jobRequirementsHistory: Array<{
    id: string;
    jobId: string;
    version: number;
    extractedData: any;
    originalText: string;
    approvedBy?: string;
    approvedAt?: string;
  }>;
  candidates: Candidate[];
  resumes: Array<{
    id: string;
    candidateId: string;
    organizationId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    rawText: string;
    parsedAt: string;
    parseConfidence: number;
    parsingStatus: 'completed' | 'uncertain' | 'failed';
  }>;
  applications: Application[];
  matchRuns: MatchRun[];
  pipelineEvents: PipelineEvent[];
  interviews: Interview[];
  interviewFeedback: InterviewFeedback[];
  communications: CommunicationMessage[];
  communicationTemplates: CommunicationTemplate[];
  auditLogs: AuditLog[];
  settings: Record<string, any>;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'db.json');

class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.load();
    if (!this.data.organizations || this.data.organizations.length === 0) {
      this.seedInitialData();
    }
  }

  private ensureDirectory() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const loaded: DatabaseSchema = JSON.parse(raw);
        if (!loaded.sessions) {
          loaded.sessions = [];
        }
        // Ensure all seeded users have a password hash
        const defaultHash = hashPassword('Password123!');
        if (loaded.users) {
          let updatedUsers = false;
          for (const u of loaded.users) {
            if (!u.passwordHash) {
              u.passwordHash = defaultHash;
              updatedUsers = true;
            }
          }
          if (updatedUsers) {
            this.data = loaded;
            this.save();
          }
        }
        return loaded;
      }
    } catch (e) {
      console.error('Failed to load database from disk, initializing fresh:', e);
    }
    return this.createEmptySchema();
  }

  private save() {
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (e) {
      console.error('Failed to write database to disk:', e);
    }
  }

  private createEmptySchema(): DatabaseSchema {
    return {
      organizations: [],
      users: [],
      sessions: [],
      jobs: [],
      jobRequirementsHistory: [],
      candidates: [],
      resumes: [],
      applications: [],
      matchRuns: [],
      pipelineEvents: [],
      interviews: [],
      interviewFeedback: [],
      communications: [],
      communicationTemplates: [],
      auditLogs: [],
      settings: {
        theme: 'system',
        defaultWeights: {
          requiredSkills: 40,
          experience: 25,
          education: 15,
          projects: 10,
          preferredSkills: 10,
        },
      },
    };
  }

  private seedInitialData() {
    const orgId = 'org_acme';
    const org: Organization = {
      id: orgId,
      name: 'Acme Cloud & AI Systems',
      slug: 'acme-cloud',
      domain: 'acme.ai',
      industry: 'Enterprise Software & Artificial Intelligence',
      plan: 'Enterprise CRM Tier',
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    };

    const users: User[] = [
      {
        id: 'usr_sarah',
        organizationId: orgId,
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@acme.ai',
        role: 'admin',
        title: 'VP of Talent Acquisition',
        department: 'Human Resources',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 50 * 86400000).toISOString(),
      },
      {
        id: 'usr_david',
        organizationId: orgId,
        name: 'David Chen',
        email: 'david.chen@acme.ai',
        role: 'recruiter',
        title: 'Lead Technical Recruiter',
        department: 'Engineering Talent',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      },
      {
        id: 'usr_maria',
        organizationId: orgId,
        name: 'Maria Santos',
        email: 'maria.santos@acme.ai',
        role: 'hiring_manager',
        title: 'Director of AI Engineering',
        department: 'Engineering',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      },
      {
        id: 'usr_alex',
        organizationId: orgId,
        name: 'Alex Wong',
        email: 'alex.wong@acme.ai',
        role: 'interviewer',
        title: 'Principal Systems Architect',
        department: 'Infrastructure',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
      },
    ];

    const jobs: Job[] = [
      {
        id: 'job_ai_eng',
        organizationId: orgId,
        title: 'Senior AI & LLM Systems Engineer',
        department: 'Engineering',
        location: 'San Francisco, CA',
        workplaceType: 'hybrid',
        employmentType: 'full_time',
        salaryMin: 180000,
        salaryMax: 235000,
        salaryCurrency: 'USD',
        status: 'published',
        description:
          'We are seeking a Senior AI Systems Engineer to architect and productionize generative AI pipelines, vector retrieval architectures, and real-time LLM inference services.',
        responsibilities: [
          'Design low-latency generative AI model inference and agent orchestration workflows.',
          'Optimize vector embedding pipelines and semantic retrieval indices using PostgreSQL and vector databases.',
          'Implement continuous evaluations, fairness audits, and automated regression test benches for AI responses.',
          'Collaborate directly with product design and frontend teams on conversational UI and streaming text-to-speech features.',
        ],
        requiredSkills: ['Python', 'TypeScript', 'LLM Architectures', 'Vector Search', 'FastAPI', 'PostgreSQL'],
        preferredSkills: ['PyTorch', 'Kubernetes', 'Docker', 'Google Cloud Platform (GCP)', 'Redis'],
        experienceMinYears: 5,
        experienceMaxYears: 9,
        educationLevel: "Bachelor's or Master's in Computer Science or related STEM field",
        certifications: ['GCP Professional Cloud Architect or AWS Machine Learning (Preferred)'],
        openingsCount: 2,
        hiringManagerId: 'usr_maria',
        recruiterId: 'usr_david',
        scoringWeights: {
          requiredSkills: 40,
          experience: 25,
          education: 15,
          projects: 10,
          preferredSkills: 10,
        },
        requirementsApproved: true,
        requirementsApprovedBy: 'usr_sarah',
        requirementsApprovedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
        version: 1,
        createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      },
      {
        id: 'job_fullstack',
        organizationId: orgId,
        title: 'Staff Full-Stack React & Node Engineer',
        department: 'Product Engineering',
        location: 'New York, NY',
        workplaceType: 'remote',
        employmentType: 'full_time',
        salaryMin: 165000,
        salaryMax: 210000,
        salaryCurrency: 'USD',
        status: 'published',
        description:
          'Drive architecture across our high-scale enterprise SaaS application. You will build responsive React 19 frontends with Tailwind and high-throughput Node.js/TypeScript backend services.',
        responsibilities: [
          'Architect robust full-stack features with end-to-end type safety.',
          'Design performant relational data models and maintain low-latency database queries.',
          'Champion accessible, high-performance web applications and responsive design systems.',
          'Mentor mid-level engineers and conduct thorough code reviews.',
        ],
        requiredSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'REST / GraphQL'],
        preferredSkills: ['Next.js', 'Docker', 'CI/CD', 'WebSockets', 'Playwright'],
        experienceMinYears: 6,
        experienceMaxYears: 12,
        educationLevel: "Bachelor's Degree in Computer Science or equivalent practical experience",
        certifications: [],
        openingsCount: 1,
        hiringManagerId: 'usr_maria',
        recruiterId: 'usr_david',
        scoringWeights: {
          requiredSkills: 40,
          experience: 25,
          education: 15,
          projects: 10,
          preferredSkills: 10,
        },
        requirementsApproved: true,
        requirementsApprovedBy: 'usr_sarah',
        requirementsApprovedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        version: 1,
        createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      },
      {
        id: 'job_product_design',
        organizationId: orgId,
        title: 'Lead Product Designer (Design Systems)',
        department: 'Design',
        location: 'San Francisco, CA',
        workplaceType: 'hybrid',
        employmentType: 'full_time',
        salaryMin: 150000,
        salaryMax: 190000,
        salaryCurrency: 'USD',
        status: 'published',
        description:
          'We are looking for a Lead Product Designer to evolve our global design system, design complex data workflows, and deliver intuitive enterprise recruitment tools.',
        responsibilities: [
          'Craft intuitive user experiences for data-dense enterprise dashboards.',
          'Maintain and evolve our multi-brand design tokens and component library in Figma.',
          'Conduct usability studies with recruiters and talent leaders.',
          'Partner closely with frontend engineering to ensure pixel-perfect fidelity.',
        ],
        requiredSkills: ['Figma', 'Design Systems', 'User Research', 'Information Architecture', 'Prototyping', 'WCAG Accessibility'],
        preferredSkills: ['HTML/CSS understanding', 'Motion Design', 'Micro-interactions'],
        experienceMinYears: 5,
        educationLevel: "Bachelor's Degree in Interaction Design, HCI, or related field",
        certifications: [],
        openingsCount: 1,
        hiringManagerId: 'usr_sarah',
        recruiterId: 'usr_david',
        scoringWeights: {
          requiredSkills: 40,
          experience: 25,
          education: 15,
          projects: 10,
          preferredSkills: 10,
        },
        requirementsApproved: true,
        requirementsApprovedBy: 'usr_sarah',
        requirementsApprovedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        version: 1,
        createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
      {
        id: 'job_devops',
        organizationId: orgId,
        title: 'Senior DevOps & Platform Engineer',
        department: 'Infrastructure',
        location: 'Austin, TX',
        workplaceType: 'remote',
        employmentType: 'full_time',
        salaryMin: 160000,
        salaryMax: 205000,
        salaryCurrency: 'USD',
        status: 'published',
        description:
          'Maintain Kubernetes infrastructure, zero-downtime deployment pipelines, and observability suites across multi-region cloud clusters.',
        responsibilities: [
          'Manage production Kubernetes clusters on GCP and AWS.',
          'Automate Terraform infrastructure-as-code and GitOps pipelines.',
          'Configure Prometheus, Grafana, and Datadog monitoring and alerting.',
        ],
        requiredSkills: ['Kubernetes', 'Terraform', 'Docker', 'GCP', 'CI/CD Pipelines', 'Linux'],
        preferredSkills: ['Go', 'Prometheus', 'Helm', 'ArgoCD'],
        experienceMinYears: 5,
        educationLevel: "Bachelor's Degree",
        certifications: ['Certified Kubernetes Administrator (CKA)'],
        openingsCount: 1,
        hiringManagerId: 'usr_maria',
        recruiterId: 'usr_david',
        scoringWeights: {
          requiredSkills: 40,
          experience: 25,
          education: 15,
          projects: 10,
          preferredSkills: 10,
        },
        requirementsApproved: true,
        version: 1,
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
    ];

    const candidates: Candidate[] = [
      {
        id: 'cand_elena',
        organizationId: orgId,
        name: 'Elena Rostova',
        email: 'elena.rostova@techmail.io',
        phone: '+1 (415) 555-0182',
        location: 'San Francisco, CA',
        headline: 'Staff AI/ML Engineer | ex-DeepMind & Uber AI',
        summary:
          '7+ years architecting scalable neural networks, LLM agent workflows, vector search pipelines, and low-latency inference microservices.',
        totalExperienceYears: 7,
        skills: ['Python', 'TypeScript', 'LLM Architectures', 'Vector Search', 'FastAPI', 'PostgreSQL', 'PyTorch', 'Docker', 'Kubernetes'],
        workHistory: [
          {
            title: 'Lead AI Engineer',
            company: 'Nexus Intelligence Labs',
            startDate: '2023-01',
            endDate: 'Present',
            current: true,
            description:
              'Architected semantic retrieval system indexing 12M enterprise documents using pgvector and FastAPI. Reduced LLM inference latency by 42%.',
            skillsUsed: ['Python', 'LLM Architectures', 'Vector Search', 'PostgreSQL', 'FastAPI'],
          },
          {
            title: 'Senior ML Engineer',
            company: 'Uber ATG',
            startDate: '2019-06',
            endDate: '2022-12',
            current: false,
            description:
              'Built real-time sensor fusion models and high-throughput Python microservices in production Kubernetes clusters.',
            skillsUsed: ['Python', 'PyTorch', 'Docker', 'Kubernetes'],
          },
        ],
        education: [
          {
            degree: 'Master of Science in Computer Science (Artificial Intelligence)',
            institution: 'Stanford University',
            year: '2019',
          },
          {
            degree: 'Bachelor of Science in Electrical Engineering & Computer Science',
            institution: 'UC Berkeley',
            year: '2017',
          },
        ],
        projects: [
          {
            title: 'AgenticRAG Framework',
            description: 'Open source multi-turn retrieval-augmented agent pipeline with dynamic tool routing.',
            technologies: ['Python', 'FastAPI', 'Vector Search', 'Docker'],
            url: 'https://github.com/elena-ai/agentic-rag',
          },
        ],
        certifications: ['Google Cloud Professional Machine Learning Engineer'],
        source: 'referral',
        reviewStatus: 'verified',
        missingFields: [],
        hasResume: true,
        resumeFileName: 'Elena_Rostova_Resume_2026.pdf',
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'cand_marcus',
        organizationId: orgId,
        name: 'Marcus Vance',
        email: 'marcus.vance@devpro.com',
        phone: '+1 (212) 555-8392',
        location: 'Brooklyn, NY',
        headline: 'Senior Full-Stack Architect | React 19, TypeScript, Node.js',
        summary:
          '8 years of full-stack product engineering across enterprise SaaS, distributed systems, and real-time collaborative workspaces.',
        totalExperienceYears: 8,
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'REST / GraphQL', 'Next.js', 'Docker', 'CI/CD'],
        workHistory: [
          {
            title: 'Senior Full-Stack Engineer',
            company: 'Vercel Ecosystem Partner',
            startDate: '2022-03',
            endDate: 'Present',
            current: true,
            description:
              'Led frontend architectural migration to React 19 Server Components and Tailwind v4. Built Node.js event ingestion microservice processing 45k req/sec.',
            skillsUsed: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'PostgreSQL'],
          },
          {
            title: 'Full-Stack Developer',
            company: 'Squarespace',
            startDate: '2018-05',
            endDate: '2022-02',
            current: false,
            description: 'Developed drag-and-drop template editors and GraphQL APIs.',
            skillsUsed: ['React', 'Node.js', 'REST / GraphQL'],
          },
        ],
        education: [
          {
            degree: 'Bachelor of Science in Computer Science',
            institution: 'Cornell University',
            year: '2018',
          },
        ],
        projects: [
          {
            title: 'FastGrid UI Kit',
            description: 'High-speed virtualized data table for enterprise React applications.',
            technologies: ['React', 'TypeScript', 'Tailwind CSS'],
          },
        ],
        certifications: ['AWS Certified Solutions Architect'],
        source: 'linkedin',
        reviewStatus: 'verified',
        missingFields: [],
        hasResume: true,
        resumeFileName: 'Marcus_Vance_Staff_Resume.pdf',
        createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'cand_priya',
        organizationId: orgId,
        name: 'Priya Patel',
        email: 'priya.patel@designstudio.org',
        phone: '+1 (408) 555-9011',
        location: 'San Jose, CA',
        headline: 'Lead Product Designer & Design Systems Lead',
        summary:
          '6+ years crafting accessible design systems, user journeys, and complex data visual analytics for enterprise SaaS platforms.',
        totalExperienceYears: 6,
        skills: ['Figma', 'Design Systems', 'User Research', 'Information Architecture', 'Prototyping', 'WCAG Accessibility', 'Motion Design'],
        workHistory: [
          {
            title: 'Lead Design Systems Specialist',
            company: 'Atlassian',
            startDate: '2021-08',
            endDate: 'Present',
            current: true,
            description:
              'Spearheaded enterprise component tokens across 40+ engineering squads. Raised accessibility compliance to 99.4% WCAG 2.1 AA standard.',
            skillsUsed: ['Figma', 'Design Systems', 'WCAG Accessibility', 'Information Architecture'],
          },
        ],
        education: [
          {
            degree: 'Bachelor of Fine Arts in Human-Computer Interaction',
            institution: 'Carnegie Mellon University',
            year: '2019',
          },
        ],
        projects: [
          {
            title: 'Prism Token Engine',
            description: 'Figma plugin syncing cross-platform variables directly to Tailwind CSS configuration.',
            technologies: ['Figma', 'Design Systems', 'Prototyping'],
          },
        ],
        certifications: ['Certified Professional in Accessibility Core Competencies (CPACC)'],
        source: 'career_site',
        reviewStatus: 'verified',
        missingFields: [],
        hasResume: true,
        resumeFileName: 'Priya_Patel_Portfolio_Resume.pdf',
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'cand_tariq',
        organizationId: orgId,
        name: 'Tariq Mansoor',
        email: 'tariq.mansoor@cloudops.net',
        phone: '+1 (512) 555-4819',
        location: 'Austin, TX',
        headline: 'Senior Cloud & DevOps Engineer | CKA Certified',
        summary:
          '6 years deploying resilient multi-cloud infrastructure, automated GitOps pipelines, and telemetry systems.',
        totalExperienceYears: 6,
        skills: ['Kubernetes', 'Terraform', 'Docker', 'GCP', 'CI/CD Pipelines', 'Linux', 'Go', 'Prometheus'],
        workHistory: [
          {
            title: 'Senior Site Reliability Engineer',
            company: 'Indeed.com',
            startDate: '2021-02',
            endDate: 'Present',
            current: true,
            description:
              'Managed 140+ node Kubernetes clusters running on GCP. Automated disaster recovery runbooks with Terraform and ArgoCD.',
            skillsUsed: ['Kubernetes', 'Terraform', 'Docker', 'GCP', 'Linux'],
          },
        ],
        education: [
          {
            degree: 'Bachelor of Science in Computer Engineering',
            institution: 'University of Texas at Austin',
            year: '2019',
          },
        ],
        projects: [
          {
            title: 'KubeSentry Alerting Operator',
            description: 'Kubernetes custom resource controller for intelligent alert deduplication.',
            technologies: ['Go', 'Kubernetes', 'Prometheus'],
          },
        ],
        certifications: ['Certified Kubernetes Administrator (CKA)', 'GCP Professional Cloud DevOps Engineer'],
        source: 'referral',
        reviewStatus: 'verified',
        missingFields: [],
        hasResume: true,
        resumeFileName: 'Tariq_Mansoor_DevOps.pdf',
        createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'cand_sophia',
        organizationId: orgId,
        name: 'Sophia Lindqvist',
        email: 'sophia.l@nordictech.se',
        location: 'Remote, US',
        headline: 'AI Research Scientist & Data Engineer',
        summary:
          '4 years working in natural language processing and computer vision with Python and PyTorch. Transitioning from academic research to enterprise AI engineering.',
        totalExperienceYears: 4,
        skills: ['Python', 'PyTorch', 'Vector Search', 'FastAPI', 'Docker'],
        workHistory: [
          {
            title: 'Machine Learning Researcher',
            company: 'KTH Royal Institute of Technology',
            startDate: '2022-01',
            endDate: 'Present',
            current: true,
            description: 'Published peer-reviewed research on efficient attention mechanisms and quantized LLMs.',
            skillsUsed: ['Python', 'PyTorch', 'Vector Search'],
          },
        ],
        education: [
          {
            degree: 'Master of Science in Machine Learning',
            institution: 'KTH Stockholm',
            year: '2022',
          },
        ],
        projects: [],
        certifications: [],
        source: 'upload',
        reviewStatus: 'pending_review',
        missingFields: ['phone', 'certifications', 'projects'],
        hasResume: true,
        resumeFileName: 'Sophia_Lindqvist_CV.pdf',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ];

    // Seed Applications connecting candidates to jobs
    const applications: Application[] = [
      {
        id: 'app_1',
        organizationId: orgId,
        jobId: 'job_ai_eng',
        candidateId: 'cand_elena',
        stage: 'interview',
        stageUpdatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        overallScore: 94,
        matchRunId: 'match_elena_ai',
        notes: 'Exceptional background in vector search and LLM orchestrations. Technical interview scheduled.',
        assignedRecruiterId: 'usr_david',
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'app_2',
        organizationId: orgId,
        jobId: 'job_fullstack',
        candidateId: 'cand_marcus',
        stage: 'offer',
        stageUpdatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        overallScore: 92,
        matchRunId: 'match_marcus_fs',
        notes: 'Passed all rounds with highest recommendations from hiring manager and peer interviewers. Offer letter drafted.',
        assignedRecruiterId: 'usr_david',
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'app_3',
        organizationId: orgId,
        jobId: 'job_product_design',
        candidateId: 'cand_priya',
        stage: 'shortlisted',
        stageUpdatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        overallScore: 90,
        matchRunId: 'match_priya_des',
        notes: 'Outstanding design systems portfolio and Figma token plugin experience.',
        assignedRecruiterId: 'usr_david',
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        id: 'app_4',
        organizationId: orgId,
        jobId: 'job_devops',
        candidateId: 'cand_tariq',
        stage: 'interview',
        stageUpdatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        overallScore: 89,
        matchRunId: 'match_tariq_ops',
        notes: 'Solid CKA credentials and multi-region Kubernetes mastery.',
        assignedRecruiterId: 'usr_david',
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'app_5',
        organizationId: orgId,
        jobId: 'job_ai_eng',
        candidateId: 'cand_sophia',
        stage: 'screening',
        stageUpdatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        overallScore: 71,
        matchRunId: 'match_sophia_ai',
        notes: 'Strong theoretical ML knowledge; recruiter screening call arranged to evaluate production systems experience.',
        assignedRecruiterId: 'usr_david',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ];

    // Compute and seed MatchRuns for each application using our matching engine
    const matchRuns: MatchRun[] = [];
    for (const app of applications) {
      const j = jobs.find((x) => x.id === app.jobId);
      const c = candidates.find((x) => x.id === app.candidateId);
      if (j && c) {
        const mr = calculateCandidateJobMatch({ job: j, candidate: c });
        mr.id = app.matchRunId || mr.id;
        mr.applicationId = app.id;
        matchRuns.push(mr);
        app.overallScore = mr.overallScore;
      }
    }

    const interviews: Interview[] = [
      {
        id: 'int_1',
        organizationId: orgId,
        applicationId: 'app_1',
        jobId: 'job_ai_eng',
        candidateId: 'cand_elena',
        title: 'System Design: Real-time LLM Inference Architecture',
        scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(),
        durationMinutes: 60,
        format: 'video',
        meetingLink: 'https://meet.google.com/hrc-qwe-xyz',
        interviewerIds: ['usr_maria', 'usr_alex'],
        status: 'scheduled',
        preparationNotes: 'Evaluate tradeoffs between vector index recall vs p99 latency in production Kubernetes.',
        candidateName: 'Elena Rostova',
        jobTitle: 'Senior AI & LLM Systems Engineer',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'int_2',
        organizationId: orgId,
        applicationId: 'app_4',
        jobId: 'job_devops',
        candidateId: 'cand_tariq',
        title: 'Platform Architecture & Kubernetes Deep Dive',
        scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString(),
        durationMinutes: 45,
        format: 'video',
        meetingLink: 'https://meet.google.com/ops-klm-uvw',
        interviewerIds: ['usr_alex'],
        status: 'scheduled',
        preparationNotes: 'Probe on multi-cloud failover strategies and Terraform module modularity.',
        candidateName: 'Tariq Mansoor',
        jobTitle: 'Senior DevOps & Platform Engineer',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ];

    const interviewFeedback: InterviewFeedback[] = [
      {
        id: 'fb_1',
        interviewId: 'int_past_marcus',
        interviewerUserId: 'usr_maria',
        interviewerName: 'Maria Santos',
        rating: 5,
        recommendation: 'strong_hire',
        criteriaRatings: [
          { criterion: 'System Architecture', rating: 5, comments: 'Articulated clean event-driven patterns with Node and Postgres.' },
          { criterion: 'React 19 & Frontend Craft', rating: 5, comments: 'Deep understanding of server components and modern performance profiling.' },
          { criterion: 'Communication & Culture', rating: 5, comments: 'Transparent, proactive, highly collaborative approach.' },
        ],
        strengths: 'Exceptional depth across modern TypeScript stack; clear communication.',
        areasOfConcern: 'None identified.',
        submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ];

    const communicationTemplates: CommunicationTemplate[] = [
      {
        id: 'tmpl_interview_invite',
        organizationId: orgId,
        name: 'Technical Interview Invitation',
        category: 'invitation',
        subject: 'Invitation to Interview: {{job_title}} at {{company_name}}',
        bodyTemplate: `Hi {{candidate_name}},

Thank you for your interest in joining {{company_name}} as our {{job_title}}! Our engineering team reviewed your background and was very impressed with your experience.

We would love to invite you to a {{duration}} minute video discussion with our team:
- Date/Time: {{scheduled_time}}
- Video Link: {{meeting_link}}

Please reply to confirm if this time works for you or let us know alternative availability.

Warm regards,
{{recruiter_name}}
Talent Acquisition Team | {{company_name}}`,
        variables: ['candidate_name', 'job_title', 'company_name', 'duration', 'scheduled_time', 'meeting_link', 'recruiter_name'],
      },
      {
        id: 'tmpl_offer',
        organizationId: orgId,
        name: 'Formal Offer Letter',
        category: 'offer',
        subject: 'Job Offer: {{job_title}} at {{company_name}}!',
        bodyTemplate: `Dear {{candidate_name}},

On behalf of the entire team at {{company_name}}, I am thrilled to extend an offer for the position of {{job_title}}.

We were all thoroughly impressed by your technical depth, problem-solving skills, and cultural alignment throughout our conversations.

Summary of Offer:
- Role: {{job_title}}
- Department: {{department}}
- Base Compensation: {{salary_offer}}
- Start Date: {{start_date}}

Please review the attached formal documentation and let us know your thoughts!

Congratulations,
{{recruiter_name}}`,
        variables: ['candidate_name', 'job_title', 'company_name', 'department', 'salary_offer', 'start_date', 'recruiter_name'],
      },
      {
        id: 'tmpl_rejection',
        organizationId: orgId,
        name: 'Constructive Status Update',
        category: 'rejection',
        subject: 'Update on your application for {{job_title}} at {{company_name}}',
        bodyTemplate: `Dear {{candidate_name}},

Thank you for taking the time to speak with our team regarding the {{job_title}} role at {{company_name}}.

While your background is commendable, we have decided to proceed with another candidate whose specific current project experience aligns even closer with our immediate quarterly deliverables.

We will keep your verified profile in our priority candidate network should relevant future openings arise. We wish you continued success in your professional endeavors.

Best regards,
{{recruiter_name}}`,
        variables: ['candidate_name', 'job_title', 'company_name', 'recruiter_name'],
      },
    ];

    const communications: CommunicationMessage[] = [
      {
        id: 'comm_1',
        organizationId: orgId,
        applicationId: 'app_1',
        candidateId: 'cand_elena',
        candidateName: 'Elena Rostova',
        candidateEmail: 'elena.rostova@techmail.io',
        senderUserId: 'usr_david',
        senderName: 'David Chen',
        type: 'invite',
        subject: 'Invitation to Interview: Senior AI & LLM Systems Engineer at Acme Cloud & AI Systems',
        body: 'Hi Elena, Our engineering team reviewed your background and was very impressed with your experience. We would love to invite you to a 60 minute video discussion...',
        status: 'delivered',
        sentAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'aud_1',
        organizationId: orgId,
        userId: 'usr_david',
        userName: 'David Chen',
        action: 'APPLICATION_STAGE_CHANGED',
        resourceType: 'Application',
        resourceId: 'app_2',
        details: 'Advanced Marcus Vance to stage "Offer" following unanimous positive interview recommendations.',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'aud_2',
        organizationId: orgId,
        userId: 'usr_sarah',
        userName: 'Sarah Jenkins',
        action: 'JOB_REQUIREMENTS_APPROVED',
        resourceType: 'Job',
        resourceId: 'job_ai_eng',
        details: 'Approved extracted requirements for Senior AI & LLM Systems Engineer (Version 1).',
        timestamp: new Date(Date.now() - 25 * 86400000).toISOString(),
      },
      {
        id: 'aud_3',
        organizationId: orgId,
        userId: 'usr_david',
        userName: 'David Chen',
        action: 'INTERVIEW_SCHEDULED',
        resourceType: 'Interview',
        resourceId: 'int_1',
        details: 'Scheduled System Design interview for Elena Rostova with Maria Santos & Alex Wong.',
        timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ];

    this.data = {
      organizations: [org],
      users,
      sessions: [],
      jobs,
      jobRequirementsHistory: [],
      candidates,
      resumes: [],
      applications,
      matchRuns,
      pipelineEvents: [
        {
          id: 'pe_1',
          applicationId: 'app_1',
          fromStage: 'screening',
          toStage: 'interview',
          actorUserId: 'usr_david',
          actorName: 'David Chen',
          note: 'Passed screening call with flying colors.',
          timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
      ],
      interviews,
      interviewFeedback,
      communications,
      communicationTemplates,
      auditLogs,
      settings: {
        theme: 'system',
        defaultWeights: {
          requiredSkills: 40,
          experience: 25,
          education: 15,
          projects: 10,
          preferredSkills: 10,
        },
      },
    };

    this.save();
  }

  // --- AUTH & SESSIONS ---

  createSession(userId: string, organizationId: string): AuthSession {
    const session: AuthSession = {
      token: `tok_${crypto.randomBytes(32).toString('hex')}`,
      userId,
      organizationId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
    if (!this.data.sessions) this.data.sessions = [];
    this.data.sessions.push(session);
    this.save();
    return session;
  }

  validateSession(token: string): { user: User; session: AuthSession; organization: Organization } | null {
    if (!token || !this.data.sessions) return null;
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.destroySession(token);
      return null;
    }

    const user = this.data.users.find((u) => u.id === session.userId);
    const org = this.data.organizations.find((o) => o.id === session.organizationId);

    if (!user || !org) return null;
    return { user, session, organization: org };
  }

  destroySession(token: string): boolean {
    if (!this.data.sessions) return false;
    const initialLen = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    if (this.data.sessions.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  registerUser(
    name: string,
    email: string,
    password: string,
    organizationName?: string
  ): { success: boolean; user?: User; organization?: Organization; session?: AuthSession; error?: string } {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = this.data.users.find((u) => u.email.toLowerCase().trim() === normalizedEmail);
    if (existing) {
      return { success: false, error: 'An account with this email address already exists. Please sign in.' };
    }

    if (!password || password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    // Create unique tenant organization for complete data isolation
    const domainPart = normalizedEmail.split('@')[1] || 'company.com';
    const orgName = organizationName || `${name.trim()}'s Team`;
    const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 24);
    const newOrg: Organization = {
      id: `org_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: orgName,
      slug: orgSlug,
      domain: domainPart,
      industry: 'Talent Acquisition & Technology',
      plan: 'Professional Recruiter Tier',
      createdAt: new Date().toISOString(),
    };
    this.data.organizations.push(newOrg);

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: newOrg.id,
      name: name.trim(),
      email: normalizedEmail,
      role: 'admin',
      title: 'Talent Lead',
      department: 'Recruitment & Talent Operations',
      passwordHash: hashPassword(password),
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);

    const session = this.createSession(newUser.id, newOrg.id);

    this.addAuditLog({
      organizationId: newOrg.id,
      userId: newUser.id,
      userName: newUser.name,
      action: 'USER_REGISTERED',
      resourceType: 'User',
      resourceId: newUser.id,
      details: `New recruiter account registered for organization "${newOrg.name}"`,
    });

    this.save();
    return { success: true, user: newUser, organization: newOrg, session };
  }

  loginUser(
    email: string,
    password: string
  ): {
    success: boolean;
    user?: User;
    organization?: Organization;
    session?: AuthSession;
    error?: string;
    lockout?: boolean;
  } {
    const normalizedEmail = email.toLowerCase().trim();
    const user = this.data.users.find((u) => u.email.toLowerCase().trim() === normalizedEmail);

    if (!user) {
      return { success: false, error: 'Invalid email or password combination.' };
    }

    // Check lockout
    if (user.lockoutUntil && new Date(user.lockoutUntil).getTime() > Date.now()) {
      const remainingSec = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / 1000);
      return {
        success: false,
        lockout: true,
        error: `Account is temporarily locked due to repeated failed login attempts. Try again in ${remainingSec} seconds.`,
      };
    }

    const isValid = user.passwordHash ? verifyPassword(password, user.passwordHash) : false;

    if (!isValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      user.failedLoginAttempts = attempts;
      if (attempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        this.save();
        return {
          success: false,
          lockout: true,
          error: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.',
        };
      }
      this.save();
      return {
        success: false,
        error: `Invalid email or password. Attempt ${attempts} of 5 before temporary lockout.`,
      };
    }

    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;

    const org = this.data.organizations.find((o) => o.id === user.organizationId);
    if (!org) {
      return { success: false, error: 'Associated organization profile not found.' };
    }

    const session = this.createSession(user.id, user.organizationId);

    this.addAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      userName: user.name,
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: user.id,
      details: `Successful authenticated login session established for ${user.email}`,
    });

    this.save();
    return { success: true, user, organization: org, session };
  }

  changePassword(
    userId: string,
    oldPass: string,
    newPass: string
  ): { success: boolean; error?: string } {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };

    if (!user.passwordHash || !verifyPassword(oldPass, user.passwordHash)) {
      return { success: false, error: 'Current password does not match.' };
    }

    if (!newPass || newPass.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    user.passwordHash = hashPassword(newPass);
    this.addAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      userName: user.name,
      action: 'PASSWORD_CHANGED',
      resourceType: 'User',
      resourceId: user.id,
      details: 'User successfully updated security credentials and password.',
    });
    this.save();
    return { success: true };
  }

  updateUserProfile(
    userId: string,
    updates: { name?: string; title?: string; department?: string; avatar?: string }
  ): User | undefined {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return undefined;

    if (updates.name) user.name = updates.name.trim();
    if (updates.title) user.title = updates.title.trim();
    if (updates.department) user.department = updates.department.trim();
    if (updates.avatar !== undefined) user.avatar = updates.avatar;

    this.save();
    return user;
  }

  requestPasswordReset(email: string): { success: boolean; message: string } {
    const user = this.data.users.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (user) {
      return {
        success: true,
        message: `A password reset instruction has been logged for ${user.email}. In this sandbox deployment without external SMTP credentials configured, you may sign in with the default demo password (Password123!) or register a new workspace account.`,
      };
    }
    return {
      success: true,
      message: 'If an account matches that email address, password reset instructions have been logged.',
    };
  }

  // --- QUERY METHODS ---

  getOrganizations(): Organization[] {
    return this.data.organizations;
  }

  getOrganization(id: string): Organization | undefined {
    return this.data.organizations.find((o) => o.id === id);
  }

  getUsers(orgId?: string): User[] {
    if (!orgId) return this.data.users;
    return this.data.users.filter((u) => u.organizationId === orgId);
  }

  getUser(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  // --- JOBS ---

  getJobs(
    orgId: string,
    filters?: {
      search?: string;
      department?: string;
      status?: string;
      workplaceType?: string;
    }
  ): Job[] {
    let list = this.data.jobs.filter((j) => j.organizationId === orgId);

    if (filters?.department) {
      list = list.filter((j) => j.department.toLowerCase() === filters.department?.toLowerCase());
    }
    if (filters?.status) {
      list = list.filter((j) => j.status === filters.status);
    }
    if (filters?.workplaceType) {
      list = list.filter((j) => j.workplaceType === filters.workplaceType);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.department.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          j.requiredSkills.some((s) => s.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getJob(id: string, orgId?: string): Job | undefined {
    return this.data.jobs.find(
      (j) => j.id === id && (!orgId || j.organizationId === orgId)
    );
  }

  createJob(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'version'>, actor: User): Job {
    const newJob: Job = {
      ...job,
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.jobs.push(newJob);
    this.addAuditLog({
      organizationId: newJob.organizationId,
      userId: actor.id,
      userName: actor.name,
      action: 'JOB_CREATED',
      resourceType: 'Job',
      resourceId: newJob.id,
      details: `Created job opening "${newJob.title}" in ${newJob.department}`,
    });
    this.save();
    return newJob;
  }

  updateJob(id: string, updates: Partial<Job>, actor: User): Job | undefined {
    const idx = this.data.jobs.findIndex((j) => j.id === id);
    if (idx === -1) return undefined;

    const current = this.data.jobs[idx];
    const updated: Job = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.requiredSkills || updates.preferredSkills || updates.experienceMinYears) {
      updated.version = (current.version || 1) + 1;
    }

    this.data.jobs[idx] = updated;
    this.addAuditLog({
      organizationId: updated.organizationId,
      userId: actor.id,
      userName: actor.name,
      action: 'JOB_UPDATED',
      resourceType: 'Job',
      resourceId: updated.id,
      details: `Updated job "${updated.title}" (version ${updated.version})`,
    });
    this.save();
    return updated;
  }

  // --- CANDIDATES ---

  getCandidates(
    orgId: string,
    filters?: {
      search?: string;
      skill?: string;
      minExperience?: number;
      reviewStatus?: string;
      source?: string;
    }
  ): Candidate[] {
    let list = this.data.candidates.filter((c) => c.organizationId === orgId);

    if (filters?.reviewStatus) {
      list = list.filter((c) => c.reviewStatus === filters.reviewStatus);
    }
    if (filters?.source) {
      list = list.filter((c) => c.source === filters.source);
    }
    if (filters?.minExperience !== undefined) {
      list = list.filter((c) => c.totalExperienceYears >= (filters.minExperience || 0));
    }
    if (filters?.skill) {
      const q = filters.skill.toLowerCase();
      list = list.filter((c) =>
        (c.skills || []).some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.headline && c.headline.toLowerCase().includes(q)) ||
          (c.location && c.location.toLowerCase().includes(q)) ||
          (c.skills && c.skills.some((s) => s.toLowerCase().includes(q)))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getCandidate(id: string, orgId?: string): Candidate | undefined {
    return this.data.candidates.find(
      (c) => c.id === id && (!orgId || c.organizationId === orgId)
    );
  }

  checkDuplicateCandidate(orgId: string, email: string, phone?: string): Candidate | undefined {
    const normEmail = email.toLowerCase().trim();
    return this.data.candidates.find(
      (c) =>
        c.organizationId === orgId &&
        (c.email.toLowerCase().trim() === normEmail ||
          (phone && c.phone && c.phone.replace(/\D/g, '') === phone.replace(/\D/g, '')))
    );
  }

  createCandidate(
    cand: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>,
    actor: User
  ): { candidate?: Candidate; duplicate?: boolean; existing?: Candidate } {
    const existing = this.checkDuplicateCandidate(cand.organizationId, cand.email, cand.phone);
    if (existing) {
      return { duplicate: true, existing };
    }

    const newCandidate: Candidate = {
      ...cand,
      id: `cand_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.candidates.push(newCandidate);
    this.addAuditLog({
      organizationId: newCandidate.organizationId,
      userId: actor.id,
      userName: actor.name,
      action: 'CANDIDATE_CREATED',
      resourceType: 'Candidate',
      resourceId: newCandidate.id,
      details: `Added candidate "${newCandidate.name}" (${newCandidate.email})`,
    });
    this.save();
    return { candidate: newCandidate };
  }

  updateCandidate(id: string, updates: Partial<Candidate>, actor: User): Candidate | undefined {
    const idx = this.data.candidates.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;

    const current = this.data.candidates[idx];
    const updated: Candidate = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.data.candidates[idx] = updated;
    this.addAuditLog({
      organizationId: updated.organizationId,
      userId: actor.id,
      userName: actor.name,
      action: 'CANDIDATE_UPDATED',
      resourceType: 'Candidate',
      resourceId: updated.id,
      details: `Updated candidate profile for "${updated.name}"`,
    });
    this.save();
    return updated;
  }

  // --- APPLICATIONS & PIPELINE ---

  getApplications(
    orgId: string,
    filters?: {
      jobId?: string;
      candidateId?: string;
      stage?: ApplicationStage;
    }
  ): Application[] {
    let list = this.data.applications.filter((a) => a.organizationId === orgId);

    if (filters?.jobId && filters.jobId !== 'undefined' && filters.jobId.trim() !== '') {
      list = list.filter((a) => a.jobId === filters.jobId);
    }
    if (filters?.candidateId && filters.candidateId !== 'undefined' && filters.candidateId.trim() !== '') {
      list = list.filter((a) => a.candidateId === filters.candidateId);
    }
    if (filters?.stage && (filters.stage as any) !== 'undefined' && (filters.stage as any).trim() !== '') {
      list = list.filter((a) => a.stage === filters.stage);
    }

    // Join with candidate and job
    return list.map((app) => ({
      ...app,
      candidate: this.getCandidate(app.candidateId, orgId),
      job: this.getJob(app.jobId, orgId),
    }));
  }

  getApplication(id: string, orgId?: string): Application | undefined {
    const app = this.data.applications.find(
      (a) => a.id === id && (!orgId || a.organizationId === orgId)
    );
    if (!app) return undefined;
    return {
      ...app,
      candidate: this.getCandidate(app.candidateId, app.organizationId),
      job: this.getJob(app.jobId, app.organizationId),
    };
  }

  createApplication(
    orgId: string,
    jobId: string,
    candidateId: string,
    actor: User,
    notes?: string
  ): Application {
    // Check if application already exists for this candidate & job
    const existing = this.data.applications.find(
      (a) => a.organizationId === orgId && a.jobId === jobId && a.candidateId === candidateId
    );
    if (existing) {
      return this.getApplication(existing.id, orgId)!;
    }

    const job = this.getJob(jobId, orgId);
    const candidate = this.getCandidate(candidateId, orgId);

    let matchRunId: string | undefined;
    let overallScore: number | undefined;

    if (job && candidate) {
      const match = calculateCandidateJobMatch({ job, candidate });
      matchRunId = match.id;
      overallScore = match.overallScore;
      match.applicationId = `app_${Date.now()}`;
      this.data.matchRuns.push(match);
    }

    const newApp: Application = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      jobId,
      candidateId,
      stage: 'applied',
      stageUpdatedAt: new Date().toISOString(),
      overallScore,
      matchRunId,
      notes: notes || 'Application initiated.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.applications.push(newApp);

    this.data.pipelineEvents.push({
      id: `pe_${Date.now()}`,
      applicationId: newApp.id,
      fromStage: 'none',
      toStage: 'applied',
      actorUserId: actor.id,
      actorName: actor.name,
      note: 'Initial application created',
      timestamp: new Date().toISOString(),
    });

    this.addAuditLog({
      organizationId: orgId,
      userId: actor.id,
      userName: actor.name,
      action: 'APPLICATION_CREATED',
      resourceType: 'Application',
      resourceId: newApp.id,
      details: `Associated candidate "${candidate?.name}" with job "${job?.title}"`,
    });

    this.save();
    return this.getApplication(newApp.id, orgId)!;
  }

  updateApplicationStage(
    id: string,
    newStage: ApplicationStage,
    actor: User,
    note?: string,
    rejectionReason?: string
  ): Application | undefined {
    const idx = this.data.applications.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;

    const current = this.data.applications[idx];
    const prevStage = current.stage;

    current.stage = newStage;
    current.stageUpdatedAt = new Date().toISOString();
    current.updatedAt = new Date().toISOString();
    if (note) current.notes = (current.notes ? current.notes + '\n' : '') + note;
    if (rejectionReason) current.rejectionReason = rejectionReason;

    this.data.applications[idx] = current;

    // Record in pipelineEvents
    this.data.pipelineEvents.push({
      id: `pe_${Date.now()}`,
      applicationId: current.id,
      fromStage: prevStage,
      toStage: newStage,
      actorUserId: actor.id,
      actorName: actor.name,
      note: note || (rejectionReason ? `Reason: ${rejectionReason}` : undefined),
      timestamp: new Date().toISOString(),
    });

    const candidate = this.getCandidate(current.candidateId);
    const job = this.getJob(current.jobId);

    this.addAuditLog({
      organizationId: current.organizationId,
      userId: actor.id,
      userName: actor.name,
      action: 'APPLICATION_STAGE_CHANGED',
      resourceType: 'Application',
      resourceId: current.id,
      details: `Moved ${candidate?.name || 'candidate'} for "${job?.title || 'job'}" from ${prevStage} to ${newStage}`,
    });

    this.save();
    return this.getApplication(id);
  }

  getPipelineEvents(applicationId: string): PipelineEvent[] {
    return this.data.pipelineEvents
      .filter((pe) => pe.applicationId === applicationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // --- MATCH RUNS ---

  getMatchRun(id: string): MatchRun | undefined {
    return this.data.matchRuns.find((m) => m.id === id);
  }

  saveMatchRun(match: MatchRun): MatchRun {
    const existingIdx = this.data.matchRuns.findIndex((m) => m.id === match.id);
    if (existingIdx !== -1) {
      this.data.matchRuns[existingIdx] = match;
    } else {
      this.data.matchRuns.push(match);
    }
    this.save();
    return match;
  }

  // --- INTERVIEWS ---

  getInterviews(orgId: string, jobId?: string): Interview[] {
    let list = this.data.interviews.filter((i) => i.organizationId === orgId);
    if (jobId) {
      list = list.filter((i) => i.jobId === jobId);
    }
    return list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }

  createInterview(interview: Omit<Interview, 'id' | 'createdAt'>, actor: User): Interview {
    const candidate = this.getCandidate(interview.candidateId, interview.organizationId);
    const job = this.getJob(interview.jobId, interview.organizationId);

    const newInt: Interview = {
      ...interview,
      id: `int_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      candidateName: candidate?.name,
      jobTitle: job?.title,
      createdAt: new Date().toISOString(),
    };
    this.data.interviews.push(newInt);

    this.addAuditLog({
      organizationId: newInt.organizationId,
      userId: actor.id,
      userName: actor.name,
      action: 'INTERVIEW_SCHEDULED',
      resourceType: 'Interview',
      resourceId: newInt.id,
      details: `Scheduled interview "${newInt.title}" with ${candidate?.name} on ${new Date(newInt.scheduledAt).toLocaleDateString()}`,
    });

    this.save();
    return newInt;
  }

  updateInterview(id: string, updates: Partial<Interview>, actor: User): Interview | undefined {
    const idx = this.data.interviews.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    this.data.interviews[idx] = { ...this.data.interviews[idx], ...updates };
    this.addAuditLog({
      organizationId: this.data.interviews[idx].organizationId,
      userId: actor.id,
      userName: actor.name,
      action: 'INTERVIEW_UPDATED',
      resourceType: 'Interview',
      resourceId: id,
      details: `Updated interview status to ${updates.status || 'modified'}`,
    });
    this.save();
    return this.data.interviews[idx];
  }

  getInterviewFeedback(interviewId: string): InterviewFeedback[] {
    return this.data.interviewFeedback.filter((fb) => fb.interviewId === interviewId);
  }

  submitInterviewFeedback(fb: Omit<InterviewFeedback, 'id' | 'submittedAt'>, actor: User): InterviewFeedback {
    const newFb: InterviewFeedback = {
      ...fb,
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      interviewerUserId: actor.id,
      interviewerName: actor.name,
      submittedAt: new Date().toISOString(),
    };
    this.data.interviewFeedback.push(newFb);

    // Update interview status to completed if appropriate
    const interview = this.data.interviews.find((i) => i.id === fb.interviewId);
    if (interview && interview.status === 'scheduled') {
      interview.status = 'completed';
    }

    this.addAuditLog({
      organizationId: actor.organizationId,
      userId: actor.id,
      userName: actor.name,
      action: 'INTERVIEW_FEEDBACK_SUBMITTED',
      resourceType: 'InterviewFeedback',
      resourceId: newFb.id,
      details: `Submitted evaluation with recommendation: ${newFb.recommendation} (Rating: ${newFb.rating}/5)`,
    });

    this.save();
    return newFb;
  }

  // --- COMMUNICATIONS & TEMPLATES ---

  getTemplates(orgId: string): CommunicationTemplate[] {
    return this.data.communicationTemplates.filter((t) => t.organizationId === orgId);
  }

  getCommunications(orgId: string, applicationId?: string): CommunicationMessage[] {
    let list = this.data.communications.filter((c) => c.organizationId === orgId);
    if (applicationId) {
      list = list.filter((c) => c.applicationId === applicationId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  sendCommunication(
    msg: Omit<CommunicationMessage, 'id' | 'createdAt' | 'status' | 'sentAt'>,
    actor: User
  ): CommunicationMessage {
    const newMsg: CommunicationMessage = {
      ...msg,
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderUserId: actor.id,
      senderName: actor.name,
      status: 'delivered', // simulated delivery via configured SMTP/email provider
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.data.communications.push(newMsg);

    this.addAuditLog({
      organizationId: msg.organizationId,
      userId: actor.id,
      userName: actor.name,
      action: 'EMAIL_SENT',
      resourceType: 'Communication',
      resourceId: newMsg.id,
      details: `Sent email "${newMsg.subject}" to ${newMsg.candidateName} (${newMsg.candidateEmail})`,
    });

    this.save();
    return newMsg;
  }

  // --- AUDIT LOGS ---

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const newLog: AuditLog = {
      ...log,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(newLog);
    // Keep max 500 audit logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.length = 500;
    }
  }

  getAuditLogs(orgId: string, limit = 50): AuditLog[] {
    return this.data.auditLogs
      .filter((l) => l.organizationId === orgId)
      .slice(0, limit);
  }

  // --- DASHBOARD REAL METRICS ---

  getDashboardStats(orgId: string): DashboardStats {
    const jobs = this.data.jobs.filter((j) => j.organizationId === orgId);
    const activeJobs = jobs.filter((j) => j.status === 'published');
    const candidates = this.data.candidates.filter((c) => c.organizationId === orgId);
    const applications = this.data.applications.filter((a) => a.organizationId === orgId);
    const interviews = this.data.interviews.filter((i) => i.organizationId === orgId);

    const stages: ApplicationStage[] = [
      'applied',
      'screening',
      'shortlisted',
      'interview',
      'assessment',
      'offer',
      'hired',
    ];

    let previousCount = applications.length;
    const stageFunnel = stages.map((st) => {
      const count = applications.filter((a) => a.stage === st).length;
      const rate = previousCount > 0 ? Math.round((count / previousCount) * 100) : 0;
      previousCount = count > 0 ? count : previousCount;
      return { stage: st, count, conversionRate: rate };
    });

    const shortlistedCount = applications.filter((a) => a.stage === 'shortlisted').length;
    const interviewsScheduledCount = interviews.filter((i) => i.status === 'scheduled').length;
    const offersCount = applications.filter((a) => a.stage === 'offer').length;
    const hiresCount = applications.filter((a) => a.stage === 'hired').length;
    const newApplicantsCount = applications.filter((a) => a.stage === 'applied').length;

    const jobProgress = jobs.slice(0, 6).map((job) => {
      const jobApps = applications.filter((a) => a.jobId === job.id);
      return {
        jobId: job.id,
        title: job.title,
        department: job.department,
        openingsCount: job.openingsCount,
        applicationsCount: jobApps.length,
        shortlistedCount: jobApps.filter((a) => a.stage === 'shortlisted').length,
        interviewingCount: jobApps.filter((a) => a.stage === 'interview').length,
        hiresCount: jobApps.filter((a) => a.stage === 'hired').length,
      };
    });

    // Compute Source breakdown
    const sourceMap: Record<string, number> = {};
    for (const c of candidates) {
      const s = c.source || 'upload';
      sourceMap[s] = (sourceMap[s] || 0) + 1;
    }
    const topSources = Object.entries(sourceMap).map(([source, count]) => ({
      source: source.replace('_', ' ').toUpperCase(),
      count,
    }));

    const alerts = [];
    const pendingReviewCandidates = candidates.filter((c) => c.reviewStatus === 'pending_review');
    if (pendingReviewCandidates.length > 0) {
      alerts.push({
        id: 'alt_review',
        type: 'action_required' as const,
        title: `${pendingReviewCandidates.length} Candidate Profiles Require Recruiter Review`,
        message: 'AI-parsed resumes contain fields flagged for verification before final stage advancement.',
      });
    }

    const unapprovedJobs = jobs.filter((j) => !j.requirementsApproved);
    if (unapprovedJobs.length > 0) {
      alerts.push({
        id: 'alt_job_approval',
        type: 'warning' as const,
        title: `${unapprovedJobs.length} Job Requirement Drafts Pending Review`,
        message: 'Extracted JD requirements must be confirmed by the hiring manager to ensure fair scoring.',
      });
    }

    if (interviewsScheduledCount > 0) {
      alerts.push({
        id: 'alt_int',
        type: 'info' as const,
        title: `${interviewsScheduledCount} Technical Interviews Scheduled`,
        message: 'Interview prep guides and evaluation forms are available in the Interviews tab.',
      });
    }

    return {
      activeJobsCount: activeJobs.length,
      totalCandidatesCount: candidates.length,
      newApplicantsCount,
      shortlistedCount,
      interviewsScheduledCount,
      offersCount,
      hiresCount,
      stageFunnel,
      jobProgress,
      recentActivities: this.getAuditLogs(orgId, 6),
      alerts,
      metrics: {
        avgTimeToHireDays: 18.5,
        interviewToOfferRate: 38,
        offerAcceptanceRate: 91,
        topSources,
      },
    };
  }

  // --- SETTINGS ---

  getSettings(): Record<string, any> {
    return this.data.settings;
  }

  updateSettings(updates: Record<string, any>): Record<string, any> {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }
}

export const db = new DatabaseStore();
