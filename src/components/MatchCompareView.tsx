import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  Sparkles,
  Sliders,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Check,
  ChevronDown,
  Info,
  Calendar,
} from 'lucide-react';
import { Job, Candidate, MatchRun, ScoringWeights } from '../types';
import { api } from '../services/api';
import { NavTab } from './Sidebar';

interface MatchCompareViewProps {
  onNavigate: (tab: NavTab, meta?: any) => void;
  initialJobId?: string;
  initialCandidateId?: string;
}

export const MatchCompareView: React.FC<MatchCompareViewProps> = ({
  onNavigate,
  initialJobId,
  initialCandidateId,
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || '');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(initialCandidateId || '');

  // Comparison mode: 'single' (deep explainable criteria) | 'multi' (side-by-side 2-4 candidates)
  const [viewMode, setViewMode] = useState<'single' | 'multi'>('single');
  const [comparisonCandidateIds, setComparisonCandidateIds] = useState<string[]>([]);

  const [matchRun, setMatchRun] = useState<MatchRun | null>(null);
  const [multiComparisonData, setMultiComparisonData] = useState<{
    job: Job;
    comparisons: Array<{ candidate: Candidate; match: MatchRun }>;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [customWeights, setCustomWeights] = useState<ScoringWeights>({
    requiredSkills: 40,
    experience: 25,
    education: 15,
    projects: 10,
    preferredSkills: 10,
  });
  const [showWeightSliders, setShowWeightSliders] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [jobsData, candidatesData] = await Promise.all([
        api.getJobs({ status: 'published' }),
        api.getCandidates(),
      ]);
      setJobs(jobsData);
      setCandidates(candidatesData);

      const targetJobId = selectedJobId || (jobsData.length > 0 ? jobsData[0].id : '');
      const targetCandidateId = selectedCandidateId || (candidatesData.length > 0 ? candidatesData[0].id : '');

      setSelectedJobId(targetJobId);
      setSelectedCandidateId(targetCandidateId);

      // Pre-populate comparison candidates with top candidates
      const initialMultiIds = candidatesData.slice(0, 3).map((c) => c.id);
      setComparisonCandidateIds(initialMultiIds);

      if (targetJobId && targetCandidateId) {
        runSingleMatch(targetJobId, targetCandidateId, customWeights);
      }
    } catch (e) {
      console.error('Failed to load matching data:', e);
    }
  };

  const runSingleMatch = async (jId: string, cId: string, weights?: ScoringWeights) => {
    if (!jId || !cId) return;
    setLoading(true);
    try {
      const match = await api.runMatch(jId, cId, weights);
      setMatchRun(match);
    } catch (e) {
      console.error('Match calculation error:', e);
    } finally {
      setLoading(false);
    }
  };

  const runMultiComparison = async (jId: string, cIds: string[]) => {
    if (!jId || cIds.length === 0) return;
    setLoading(true);
    try {
      const res = await api.compareCandidates(jId, cIds);
      setMultiComparisonData(res);
    } catch (e) {
      console.error('Comparison error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelect = (jId: string) => {
    setSelectedJobId(jId);
    const j = jobs.find((x) => x.id === jId);
    if (j?.scoringWeights) {
      setCustomWeights(j.scoringWeights);
    }
    if (viewMode === 'single') {
      runSingleMatch(jId, selectedCandidateId, j?.scoringWeights);
    } else {
      runMultiComparison(jId, comparisonCandidateIds);
    }
  };

  const handleCandidateSelect = (cId: string) => {
    setSelectedCandidateId(cId);
    runSingleMatch(selectedJobId, cId, customWeights);
  };

  const handleWeightChange = (key: keyof ScoringWeights, val: number) => {
    const updated = { ...customWeights, [key]: val };
    setCustomWeights(updated);
    if (viewMode === 'single') {
      runSingleMatch(selectedJobId, selectedCandidateId, updated);
    }
  };

  const toggleComparisonCandidate = (cId: string) => {
    let next: string[];
    if (comparisonCandidateIds.includes(cId)) {
      if (comparisonCandidateIds.length <= 1) return; // Keep at least one
      next = comparisonCandidateIds.filter((id) => id !== cId);
    } else {
      if (comparisonCandidateIds.length >= 4) return; // Max 4 side-by-side
      next = [...comparisonCandidateIds, cId];
    }
    setComparisonCandidateIds(next);
    runMultiComparison(selectedJobId, next);
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId);
  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            Candidate–Job Matching Engine
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Explainable AI v{selectedJob?.version || 1}
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Produce configurable, evidence-grounded alignment scores across required skills, experience, and projects.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              setViewMode('single');
              runSingleMatch(selectedJobId, selectedCandidateId, customWeights);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'single'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Explainable Breakdown
          </button>
          <button
            onClick={() => {
              setViewMode('multi');
              runMultiComparison(selectedJobId, comparisonCandidateIds);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'multi'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Side-by-Side Comparison ({comparisonCandidateIds.length})
          </button>
        </div>
      </div>

      {/* Mandatory Fairness & Non-Autonomous Decision Disclaimer Banner */}
      <div className="p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/30 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
          <span className="font-bold">Algorithmic Accountability Policy:</span> Alignment scores serve solely as advisory indicators based on verified job criteria. They do <strong>NOT</strong> represent probability of job success and are never used for autonomous decisions. Protected demographic traits are strictly excluded from calculations.
        </div>
      </div>

      {/* Controls Bar: Job Selection & Weight Configuration Toggle */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center flex-wrap gap-3 flex-1">
          <div className="min-w-[260px]">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Active Job Requisition
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => handleJobSelect(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>

          {viewMode === 'single' && (
            <div className="min-w-[260px]">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Candidate Profile
              </label>
              <select
                value={selectedCandidateId}
                onChange={(e) => handleCandidateSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.totalExperienceYears} yrs exp • {c.skills.slice(0, 3).join(', ')})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowWeightSliders(!showWeightSliders)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-500" />
          <span>{showWeightSliders ? 'Hide Scoring Weights' : 'Adjust Weights (Live Simulator)'}</span>
        </button>
      </div>

      {/* Live Weight Sliders Drawer */}
      {showWeightSliders && (
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 animate-in fade-in-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Scoring Model Weights (Normalized to 100%)
            </span>
            <button
              onClick={() => {
                const defaults = selectedJob?.scoringWeights || {
                  requiredSkills: 40,
                  experience: 25,
                  education: 15,
                  projects: 10,
                  preferredSkills: 10,
                };
                setCustomWeights(defaults);
                if (viewMode === 'single') runSingleMatch(selectedJobId, selectedCandidateId, defaults);
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              Reset to Job Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                <span>Required Skills</span>
                <span className="font-bold">{customWeights.requiredSkills}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={70}
                value={customWeights.requiredSkills}
                onChange={(e) => handleWeightChange('requiredSkills', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                <span>Experience</span>
                <span className="font-bold">{customWeights.experience}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                value={customWeights.experience}
                onChange={(e) => handleWeightChange('experience', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                <span>Education</span>
                <span className="font-bold">{customWeights.education}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={customWeights.education}
                onChange={(e) => handleWeightChange('education', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                <span>Projects</span>
                <span className="font-bold">{customWeights.projects}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={customWeights.projects}
                onChange={(e) => handleWeightChange('projects', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                <span>Bonus Skills</span>
                <span className="font-bold">{customWeights.preferredSkills}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={customWeights.preferredSkills}
                onChange={(e) => handleWeightChange('preferredSkills', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: SINGLE EXPLAINABLE BREAKDOWN */}
      {viewMode === 'single' && (
        <div className="space-y-6">
          {matchRun && selectedCandidate && selectedJob && (
            <>
              {/* Overall Match Score Summary Card */}
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Alignment Evaluation
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Scoring Config Version {matchRun.scoringConfigVersion}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedCandidate.name} ↔ {selectedJob.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {matchRun.summaryExplanation}
                  </p>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-center">
                    <div
                      className={`text-4xl font-black tracking-tight ${
                        matchRun.overallScore >= 80
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : matchRun.overallScore >= 60
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {matchRun.overallScore}%
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                      Overall Match
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => onNavigate('pipeline', { jobId: selectedJob.id })}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20"
                    >
                      Advance in Pipeline
                    </button>
                    <button
                      onClick={() => onNavigate('interviews', { candidateId: selectedCandidate.id, jobId: selectedJob.id })}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Schedule Interview
                    </button>
                  </div>
                </div>
              </div>

              {/* Criterion Level Breakdown Cards */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Criterion-by-Criterion Explainable Evidence
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchRun.criteria.map((crit) => (
                    <div
                      key={crit.criterion}
                      className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {crit.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Assigned Weight: {crit.weight}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-black text-slate-900 dark:text-white">
                            {crit.score}/100
                          </div>
                          <div className="text-[10px] text-slate-400">
                            +{crit.weightedScore} pts weighted
                          </div>
                        </div>
                      </div>

                      {/* Supporting Evidence */}
                      {crit.evidence.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Supporting Evidence Documented:</span>
                          </span>
                          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                            {crit.evidence.map((ev, i) => (
                              <li key={i} className="leading-snug">{ev}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Missing Evidence / Skill Gaps */}
                      {crit.missingEvidence.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Unmet Requirements / Gaps:</span>
                          </span>
                          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                            {crit.missingEvidence.map((me, i) => (
                              <li key={i} className="leading-snug">{me}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Unknown Info */}
                      {crit.unknownInfo.length > 0 && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg">
                          <strong>Marked Unknown:</strong> {crit.unknownInfo.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* VIEW MODE 2: SIDE-BY-SIDE CANDIDATE COMPARISON */}
      {viewMode === 'multi' && (
        <div className="space-y-6">
          {/* Candidate Multi-Select Checkboxes */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Select Candidates to Compare Side-by-Side (2 to 4 candidates)
            </span>
            <div className="flex flex-wrap gap-2">
              {candidates.map((c) => {
                const isSelected = comparisonCandidateIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleComparisonCandidate(c.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{c.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comparison Matrix Table */}
          {multiComparisonData && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                    <th className="p-4 font-bold text-slate-500 uppercase tracking-wider w-48">
                      Comparison Criteria
                    </th>
                    {multiComparisonData.comparisons.map(({ candidate, match }) => (
                      <th key={candidate.id} className="p-4 font-bold text-slate-900 dark:text-white min-w-[240px]">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{candidate.name}</span>
                          <span
                            className={`text-base font-black ${
                              match.overallScore >= 80 ? 'text-emerald-600' : 'text-indigo-600'
                            }`}
                          >
                            {match.overallScore}%
                          </span>
                        </div>
                        <div className="text-[11px] font-normal text-slate-500 truncate mt-0.5">
                          {candidate.headline}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Experience Row */}
                  <tr>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-50/40 dark:bg-slate-800/20">
                      Total Experience
                    </td>
                    {multiComparisonData.comparisons.map(({ candidate }) => (
                      <td key={candidate.id} className="p-4 text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-sm">{candidate.totalExperienceYears} yrs</span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Latest: {candidate.workHistory[0]?.title} at {candidate.workHistory[0]?.company}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Required Skills Match */}
                  <tr>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-50/40 dark:bg-slate-800/20">
                      Required Skills Match
                    </td>
                    {multiComparisonData.comparisons.map(({ match }) => {
                      const reqCrit = match.criteria.find((c) => c.criterion === 'requiredSkills');
                      return (
                        <td key={match.candidateId} className="p-4">
                          <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                            {reqCrit?.score}% matched
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {match.strongMatches.map((m) => (
                              <span
                                key={m}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center gap-1"
                              >
                                <Check className="w-2.5 h-2.5" />
                                <span>{m}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Skill Gaps */}
                  <tr>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-50/40 dark:bg-slate-800/20">
                      Missing Skills / Gaps
                    </td>
                    {multiComparisonData.comparisons.map(({ match }) => (
                      <td key={match.candidateId} className="p-4">
                        {match.skillGaps.length === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            None (All required skills met)
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {match.skillGaps.map((g) => (
                              <span
                                key={g}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 inline-flex items-center gap-1"
                              >
                                <XCircle className="w-2.5 h-2.5" />
                                <span>{g}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Education */}
                  <tr>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-50/40 dark:bg-slate-800/20">
                      Education Level
                    </td>
                    {multiComparisonData.comparisons.map(({ candidate }) => (
                      <td key={candidate.id} className="p-4 text-slate-600 dark:text-slate-300">
                        {candidate.education[0]?.degree || 'None recorded'}
                        <div className="text-[10px] text-slate-400">
                          {candidate.education[0]?.institution}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Human-in-the-loop Action Row */}
                  <tr>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-50/40 dark:bg-slate-800/20">
                      Recruiter Decision
                    </td>
                    {multiComparisonData.comparisons.map(({ candidate, match }) => (
                      <td key={candidate.id} className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onNavigate('pipeline', { jobId: selectedJobId })}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                          >
                            Shortlist Candidate
                          </button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
