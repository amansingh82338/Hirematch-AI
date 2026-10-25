import { Candidate, Job, MatchRun, ScoringWeights, CriterionMatch } from '../types';

// Common tech and professional skill synonyms for reliable, deterministic matching
const SYNONYM_MAP: Record<string, string[]> = {
  react: ['react.js', 'reactjs'],
  typescript: ['ts'],
  javascript: ['js', 'ecmascript'],
  nodejs: ['node.js', 'node'],
  python: ['python3', 'py'],
  postgresql: ['postgres', 'psql'],
  mongodb: ['mongo'],
  kubernetes: ['k8s'],
  docker: ['containerization', 'containers'],
  aws: ['amazon web services', 'amazon aws'],
  gcp: ['google cloud platform', 'google cloud'],
  azure: ['microsoft azure'],
  graphql: ['graph-ql', 'gql'],
  rest: ['restful', 'rest api', 'restful api'],
  tailwind: ['tailwindcss', 'tailwind css'],
  css: ['css3', 'cascading style sheets'],
  html: ['html5'],
  sql: ['relational database', 'rdbms'],
  ci_cd: ['ci/cd', 'continuous integration', 'continuous delivery', 'github actions', 'jenkins', 'gitlab ci'],
  agile: ['scrum', 'kanban', 'sprint'],
  testing: ['unit testing', 'jest', 'vitest', 'cypress', 'playwright', 'tdd']
};

function normalizeSkill(str: string): string {
  const clean = str.toLowerCase().trim().replace(/[^a-z0-9+#./\s-]/g, '');
  for (const [canonical, aliases] of Object.entries(SYNONYM_MAP)) {
    if (clean === canonical || aliases.includes(clean)) {
      return canonical;
    }
  }
  return clean;
}

export function areSkillsEquivalent(skillA: string, skillB: string): boolean {
  const normA = normalizeSkill(skillA);
  const normB = normalizeSkill(skillB);
  if (normA === normB) return true;
  // Substring or includes match for compound phrases
  if (normA.includes(normB) || normB.includes(normA)) {
    return true;
  }
  return false;
}

export interface CalculateMatchOptions {
  job: Job;
  candidate: Candidate;
  customWeights?: Partial<ScoringWeights>;
  scoringVersion?: number;
}

export function normalizeWeights(weights: ScoringWeights): ScoringWeights {
  const sum =
    weights.requiredSkills +
    weights.experience +
    weights.education +
    weights.projects +
    weights.preferredSkills;

  if (sum === 100) return weights;
  if (sum <= 0) {
    return {
      requiredSkills: 40,
      experience: 25,
      education: 15,
      projects: 10,
      preferredSkills: 10,
    };
  }

  // Normalize proportionally to 100
  const factor = 100 / sum;
  return {
    requiredSkills: Math.round(weights.requiredSkills * factor),
    experience: Math.round(weights.experience * factor),
    education: Math.round(weights.education * factor),
    projects: Math.round(weights.projects * factor),
    preferredSkills: Math.round(weights.preferredSkills * factor),
  };
}

export function calculateCandidateJobMatch({
  job,
  candidate,
  customWeights,
  scoringVersion = 1,
}: CalculateMatchOptions): MatchRun {
  const rawWeights: ScoringWeights = {
    ...job.scoringWeights,
    ...(customWeights || {}),
  };
  const weights = normalizeWeights(rawWeights);

  const candidateSkills = (candidate.skills || []).map(normalizeSkill);
  const candidateWorkSkills = (candidate.workHistory || []).flatMap((w) =>
    (w.skillsUsed || []).map(normalizeSkill)
  );
  const allCandidateSkills = Array.from(
    new Set([...candidateSkills, ...candidateWorkSkills])
  );

  // 1. Required Skills Criterion
  const matchedRequired: string[] = [];
  const missingRequired: string[] = [];
  const requiredEvidence: string[] = [];

  for (const req of job.requiredSkills || []) {
    const hasSkill = allCandidateSkills.some((s) => areSkillsEquivalent(s, req));
    if (hasSkill) {
      matchedRequired.push(req);
      // Find supporting evidence from work or profile
      const matchingWork = (candidate.workHistory || []).find(
        (w) =>
          (w.description && w.description.toLowerCase().includes(req.toLowerCase())) ||
          (w.skillsUsed && w.skillsUsed.some((s) => areSkillsEquivalent(s, req)))
      );
      if (matchingWork) {
        requiredEvidence.push(`Demonstrated ${req} at ${matchingWork.company} as ${matchingWork.title}`);
      } else {
        requiredEvidence.push(`Listed ${req} under candidate skills profile`);
      }
    } else {
      missingRequired.push(req);
    }
  }

  const reqSkillScore =
    job.requiredSkills.length === 0
      ? 100
      : Math.round((matchedRequired.length / job.requiredSkills.length) * 100);

  const reqSkillsCriterion: CriterionMatch = {
    criterion: 'requiredSkills',
    name: 'Required Skills',
    weight: weights.requiredSkills,
    score: reqSkillScore,
    weightedScore: Math.round((reqSkillScore * weights.requiredSkills) / 100),
    evidence: requiredEvidence,
    missingEvidence: missingRequired.map((s) => `Missing mandatory requirement: ${s}`),
    unknownInfo: candidate.missingFields.filter((f) => f.includes('skill')),
    confidence: candidate.reviewStatus === 'verified' ? 0.95 : 0.8,
  };

  // 2. Experience Criterion
  const minYears = job.experienceMinYears || 0;
  const candidateYears = candidate.totalExperienceYears || 0;
  let expScore = 100;
  const expEvidence: string[] = [];
  const missingExpEvidence: string[] = [];

  if (minYears > 0) {
    if (candidateYears >= minYears) {
      expScore = 100;
      expEvidence.push(
        `Candidate possesses ${candidateYears} years of verified experience (meets/exceeds required minimum of ${minYears} years)`
      );
    } else {
      expScore = Math.max(20, Math.round((candidateYears / minYears) * 80));
      missingExpEvidence.push(
        `Possesses ${candidateYears} years of experience vs required minimum of ${minYears} years (${minYears - candidateYears} yr gap)`
      );
    }
  } else {
    expEvidence.push(`No strict minimum years specified; candidate has ${candidateYears} years of experience.`);
  }

  if (candidate.workHistory && candidate.workHistory.length > 0) {
    expEvidence.push(
      `Latest role: ${candidate.workHistory[0].title} at ${candidate.workHistory[0].company}`
    );
  }

  const expCriterion: CriterionMatch = {
    criterion: 'experience',
    name: 'Relevant Experience',
    weight: weights.experience,
    score: expScore,
    weightedScore: Math.round((expScore * weights.experience) / 100),
    evidence: expEvidence,
    missingEvidence: missingExpEvidence,
    unknownInfo: candidate.totalExperienceYears === undefined ? ['Total years of experience unverified'] : [],
    confidence: candidate.reviewStatus === 'verified' ? 0.95 : 0.85,
  };

  // 3. Education Criterion
  const targetEdu = (job.educationLevel || '').toLowerCase();
  let eduScore = 80;
  const eduEvidence: string[] = [];
  const missingEduEvidence: string[] = [];

  if (!targetEdu || targetEdu === 'none' || targetEdu.includes('any')) {
    eduScore = 100;
    eduEvidence.push('No specific degree requirement specified for this role');
  } else {
    const hasDegree = (candidate.education || []).some((edu) => {
      const deg = edu.degree.toLowerCase();
      if (targetEdu.includes('bachelor') && (deg.includes('bachelor') || deg.includes('bs') || deg.includes('ba') || deg.includes('b.tech') || deg.includes('master') || deg.includes('phd'))) {
        return true;
      }
      if (targetEdu.includes('master') && (deg.includes('master') || deg.includes('ms') || deg.includes('mba') || deg.includes('phd'))) {
        return true;
      }
      return deg.includes(targetEdu);
    });

    if (hasDegree) {
      eduScore = 100;
      const topEdu = candidate.education[0];
      eduEvidence.push(`Meets requirement with ${topEdu.degree} from ${topEdu.institution}`);
    } else if (candidate.education && candidate.education.length > 0) {
      eduScore = 70;
      eduEvidence.push(`Candidate holds ${candidate.education[0].degree} from ${candidate.education[0].institution}`);
      missingEduEvidence.push(`Preferred education is "${job.educationLevel}"`);
    } else {
      eduScore = 40;
      missingEduEvidence.push(`Candidate profile has no recorded degree; requires "${job.educationLevel}"`);
    }
  }

  const eduCriterion: CriterionMatch = {
    criterion: 'education',
    name: 'Education & Academic Background',
    weight: weights.education,
    score: eduScore,
    weightedScore: Math.round((eduScore * weights.education) / 100),
    evidence: eduEvidence,
    missingEvidence: missingEduEvidence,
    unknownInfo: candidate.education.length === 0 ? ['Education background marked unknown'] : [],
    confidence: 0.9,
  };

  // 4. Projects & Portfolio Criterion
  let projScore = 60;
  const projEvidence: string[] = [];
  const missingProjEvidence: string[] = [];

  if (candidate.projects && candidate.projects.length > 0) {
    projScore = Math.min(100, 70 + candidate.projects.length * 10);
    for (const proj of candidate.projects.slice(0, 3)) {
      projEvidence.push(
        `Project "${proj.title}" using ${(proj.technologies || []).join(', ') || 'relevant tools'}`
      );
    }
  } else {
    projScore = 50;
    missingProjEvidence.push('No standalone side projects or portfolio entries listed (evaluating via work history)');
  }

  const projCriterion: CriterionMatch = {
    criterion: 'projects',
    name: 'Projects & Practical Portfolio',
    weight: weights.projects,
    score: projScore,
    weightedScore: Math.round((projScore * weights.projects) / 100),
    evidence: projEvidence,
    missingEvidence: missingProjEvidence,
    unknownInfo: candidate.projects.length === 0 ? ['Project artifacts not provided'] : [],
    confidence: 0.85,
  };

  // 5. Preferred Skills Criterion
  const matchedPreferred: string[] = [];
  const missingPreferred: string[] = [];
  const prefEvidence: string[] = [];

  if (!job.preferredSkills || job.preferredSkills.length === 0) {
    prefEvidence.push('No optional/preferred skills configured for this position');
  } else {
    for (const pref of job.preferredSkills) {
      const hasPref = allCandidateSkills.some((s) => areSkillsEquivalent(s, pref));
      if (hasPref) {
        matchedPreferred.push(pref);
        prefEvidence.push(`Bonus qualification matched: ${pref}`);
      } else {
        missingPreferred.push(pref);
      }
    }
  }

  const prefScore =
    !job.preferredSkills || job.preferredSkills.length === 0
      ? 100
      : Math.round((matchedPreferred.length / job.preferredSkills.length) * 100);

  const prefCriterion: CriterionMatch = {
    criterion: 'preferredSkills',
    name: 'Preferred / Bonus Qualifications',
    weight: weights.preferredSkills,
    score: prefScore,
    weightedScore: Math.round((prefScore * weights.preferredSkills) / 100),
    evidence: prefEvidence,
    missingEvidence: missingPreferred.map((p) => `Bonus skill not found: ${p}`),
    unknownInfo: [],
    confidence: 0.85,
  };

  const criteria = [
    reqSkillsCriterion,
    expCriterion,
    eduCriterion,
    projCriterion,
    prefCriterion,
  ];

  // Overall aggregate score (0 to 100)
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      criteria.reduce((acc, curr) => acc + curr.weightedScore, 0)
    )
  );

  const strongMatches = [
    ...matchedRequired,
    ...matchedPreferred,
  ];

  const skillGaps = missingRequired;

  const summaryExplanation =
    overallScore >= 80
      ? `High alignment (${overallScore}%): Candidate meets ${matchedRequired.length}/${job.requiredSkills.length} required skills and has strong background alignment.`
      : overallScore >= 60
      ? `Moderate alignment (${overallScore}%): Candidate satisfies core requirements (${matchedRequired.length}/${job.requiredSkills.length}) with notable gaps in: ${missingRequired.slice(0, 2).join(', ') || 'preferred qualifications'}.`
      : `Low alignment (${overallScore}%): Candidate lacks ${missingRequired.length} key required skill(s) [${missingRequired.slice(0, 3).join(', ')}] or has an experience gap.`;

  const disclaimer =
    'This match score is an advisory indicator based solely on extracted job-related qualifications and approved criteria weights. It does NOT predict probability of job success and must never be used for automated rejection or autonomous hiring decisions.';

  return {
    id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    applicationId: '',
    jobId: job.id,
    candidateId: candidate.id,
    scoringConfigVersion: scoringVersion,
    weights,
    overallScore,
    criteria,
    skillGaps,
    strongMatches,
    summaryExplanation,
    disclaimer,
    generatedAt: new Date().toISOString(),
  };
}
