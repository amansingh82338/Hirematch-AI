import test from 'node:test';
import assert from 'node:assert/strict';
import {
  areSkillsEquivalent,
  normalizeWeights,
  calculateCandidateJobMatch,
} from './matching';
import { Job, Candidate } from '../types';

test('areSkillsEquivalent correctly identifies synonyms and variations', () => {
  assert.equal(areSkillsEquivalent('react.js', 'React'), true);
  assert.equal(areSkillsEquivalent('TypeScript', 'ts'), true);
  assert.equal(areSkillsEquivalent('PostgreSQL', 'postgres'), true);
  assert.equal(areSkillsEquivalent('K8s', 'Kubernetes'), true);
  assert.equal(areSkillsEquivalent('Docker', 'Ruby'), false);
});

test('normalizeWeights scales non-100 sum proportionally to 100', () => {
  const custom = {
    requiredSkills: 50,
    experience: 50,
    education: 0,
    projects: 0,
    preferredSkills: 0,
  };
  const normalized = normalizeWeights(custom);
  assert.equal(
    normalized.requiredSkills +
      normalized.experience +
      normalized.education +
      normalized.projects +
      normalized.preferredSkills,
    100
  );
  assert.equal(normalized.requiredSkills, 50);
  assert.equal(normalized.experience, 50);
});

test('calculateCandidateJobMatch returns high score and explainable criteria for matched candidate', () => {
  const dummyJob: Job = {
    id: 'job-1',
    organizationId: 'org-1',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'San Francisco, CA',
    workplaceType: 'remote',
    employmentType: 'full_time',
    status: 'published',
    description: 'Looking for a Senior React/TypeScript engineer.',
    responsibilities: ['Build UI components', 'Optimize performance'],
    requiredSkills: ['React', 'TypeScript', 'Tailwind CSS'],
    preferredSkills: ['GraphQL', 'Next.js'],
    experienceMinYears: 4,
    educationLevel: "Bachelor's Degree",
    certifications: [],
    openingsCount: 1,
    hiringManagerId: 'u-1',
    recruiterId: 'u-2',
    scoringWeights: {
      requiredSkills: 40,
      experience: 25,
      education: 15,
      projects: 10,
      preferredSkills: 10,
    },
    requirementsApproved: true,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    salaryCurrency: 'USD',
  };

  const dummyCandidate: Candidate = {
    id: 'c-1',
    organizationId: 'org-1',
    name: 'Elena Rostova',
    email: 'elena@example.com',
    location: 'Remote, US',
    headline: 'Senior Frontend Architect',
    totalExperienceYears: 6,
    skills: ['React.js', 'ts', 'Tailwind CSS', 'GraphQL'],
    workHistory: [
      {
        title: 'Senior Frontend Engineer',
        company: 'Stripe',
        description: 'Engineered dashboard in React and TypeScript.',
        skillsUsed: ['React', 'TypeScript'],
      },
    ],
    education: [
      {
        degree: "Bachelor of Science in Computer Science",
        institution: 'UC Berkeley',
      },
    ],
    projects: [
      {
        title: 'Design System Library',
        description: 'Open source React components',
        technologies: ['React', 'Tailwind CSS'],
      },
    ],
    certifications: [],
    source: 'referral',
    reviewStatus: 'verified',
    missingFields: [],
    hasResume: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const match = calculateCandidateJobMatch({
    job: dummyJob,
    candidate: dummyCandidate,
  });

  assert.ok(match.overallScore >= 85, `Overall score should be high, got ${match.overallScore}`);
  assert.equal(match.skillGaps.length, 0, 'No required skill gaps should exist');
  assert.ok(match.strongMatches.includes('React'));
  assert.ok(match.strongMatches.includes('TypeScript'));
  assert.ok(match.disclaimer.includes('advisory indicator'));
  assert.equal(match.criteria.length, 5);
});

test('calculateCandidateJobMatch flags skill gaps when requirements are missing', () => {
  const dummyJob: Job = {
    id: 'job-2',
    organizationId: 'org-1',
    title: 'Data Engineer',
    department: 'Data',
    location: 'New York, NY',
    workplaceType: 'hybrid',
    employmentType: 'full_time',
    status: 'published',
    description: 'Python and Spark engineer.',
    responsibilities: ['Build ETL pipelines'],
    requiredSkills: ['Python', 'Apache Spark', 'Snowflake', 'Airflow'],
    preferredSkills: ['dbt'],
    experienceMinYears: 5,
    educationLevel: "Bachelor's",
    certifications: [],
    openingsCount: 1,
    hiringManagerId: 'u-1',
    recruiterId: 'u-2',
    scoringWeights: {
      requiredSkills: 40,
      experience: 25,
      education: 15,
      projects: 10,
      preferredSkills: 10,
    },
    requirementsApproved: true,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    salaryCurrency: 'USD',
  };

  const dummyJuniorCandidate: Candidate = {
    id: 'c-2',
    organizationId: 'org-1',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    totalExperienceYears: 2,
    skills: ['Python'],
    workHistory: [],
    education: [],
    projects: [],
    certifications: [],
    source: 'career_site',
    reviewStatus: 'pending_review',
    missingFields: ['phone', 'education'],
    hasResume: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const match = calculateCandidateJobMatch({
    job: dummyJob,
    candidate: dummyJuniorCandidate,
  });

  assert.ok(match.overallScore < 60, `Score should reflect gaps, got ${match.overallScore}`);
  assert.ok(match.skillGaps.includes('Apache Spark'));
  assert.ok(match.skillGaps.includes('Snowflake'));
  assert.ok(match.skillGaps.includes('Airflow'));
});
