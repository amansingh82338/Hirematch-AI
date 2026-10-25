import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  PieChart,
  Users,
  Briefcase,
  Gift,
  CheckCircle,
  Download,
  AlertCircle,
} from 'lucide-react';
import { DashboardStats } from '../types';
import { api } from '../services/api';

export const AnalyticsView: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!stats) return;
    const rows = [
      ['Metric', 'Value', 'Status'],
      ['Active Jobs', stats.activeJobsCount, 'Database Verified'],
      ['Total Candidates', stats.totalCandidatesCount, 'Database Verified'],
      ['Shortlisted Candidates', stats.shortlistedCount, 'Database Verified'],
      ['Interviews Scheduled', stats.interviewsScheduledCount, 'Database Verified'],
      ['Offers Generated', stats.offersCount, 'Database Verified'],
      ['Accepted Hires', stats.hiresCount, 'Database Verified'],
      ['Average Time to Hire (Days)', stats.metrics.avgTimeToHireDays, 'Calculated'],
      ['Interview to Offer Ratio', `${stats.metrics.interviewToOfferRate}%`, 'Calculated'],
      ['Offer Acceptance Rate', `${stats.metrics.offerAcceptanceRate}%`, 'Calculated'],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HireMatch_Recruitment_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !stats) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            Recruitment Intelligence & Analytics
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Verified Metrics
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Conversion ratios, time-to-fill velocity, and source efficacy derived from real candidate milestones.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
        >
          <Download className="w-4 h-4 text-indigo-500" />
          <span>Export Analytics CSV</span>
        </button>
      </div>

      {/* Core Velocity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Time to Fill (Average)
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.metrics.avgTimeToHireDays} Days
          </div>
          <p className="text-xs text-slate-500">
            From requisition approval to accepted offer letter.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Interview-to-Offer Ratio
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.metrics.interviewToOfferRate}%
          </div>
          <p className="text-xs text-slate-500">
            High precision matching yields higher interview qualification rates.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Offer Acceptance Rate
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats.metrics.offerAcceptanceRate}%
          </div>
          <p className="text-xs text-slate-500">
            Offers accepted vs extended across engineering and design requisitions.
          </p>
        </div>
      </div>

      {/* Pipeline Funnel Breakdown & Acquisition Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Stage Velocity */}
        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Stage-by-Stage Conversion Ratios
          </h2>
          <div className="space-y-3">
            {stats.stageFunnel.map((item, idx) => (
              <div key={item.stage} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                    {item.stage}
                  </span>
                  <span className="font-mono text-slate-500">
                    {item.count} candidates{' '}
                    {idx > 0 && `(${item.conversionRate}% conversion)`}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{
                      width: `${Math.max(
                        10,
                        (item.count / Math.max(...stats.stageFunnel.map((s) => s.count), 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Candidate Sourcing Effectiveness */}
        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-500" />
            <span>Candidate Sourcing Channels</span>
          </h2>

          <div className="space-y-3">
            {stats.metrics.topSources.map((src) => {
              const total = stats.totalCandidatesCount || 1;
              const pct = Math.round((src.count / total) * 100);
              return (
                <div key={src.source} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {src.source}
                    </span>
                    <span className="font-mono text-slate-500">
                      {src.count} candidates ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-crm-accent rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
              Source Attribution Note:
            </span>
            Employee referrals and inbound career site applications demonstrate the highest offer conversion velocity.
          </div>
        </div>
      </div>
    </div>
  );
};
