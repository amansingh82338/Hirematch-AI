import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  UserCheck,
  Calendar,
  Gift,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  Plus,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { DashboardStats } from '../types';
import { api } from '../services/api';
import { NavTab } from './Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavTab, meta?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  const kpis = [
    {
      title: 'Active Job Openings',
      value: stats.activeJobsCount,
      change: '+2 this month',
      icon: Briefcase,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/50',
      action: () => onNavigate('jobs'),
    },
    {
      title: 'Total Candidates CRM',
      value: stats.totalCandidatesCount,
      change: '+5 new applicants',
      icon: Users,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/50',
      action: () => onNavigate('candidates'),
    },
    {
      title: 'Interviews Scheduled',
      value: stats.interviewsScheduledCount,
      change: '2 this week',
      icon: Calendar,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      action: () => onNavigate('interviews'),
    },
    {
      title: 'Hired & Offers Out',
      value: `${stats.offersCount} offer / ${stats.hiresCount} hired`,
      change: `${stats.metrics.offerAcceptanceRate}% acceptance`,
      icon: Gift,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      action: () => onNavigate('pipeline'),
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div id="tour-command-center" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            Recruitment Command Center
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Live Database
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time pipeline metrics, AI match alignment monitoring, and candidate workflows.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            id="tour-create-job-btn"
            onClick={() => onNavigate('jobs', { openCreateModal: true })}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Job Opening</span>
          </button>
          <button
            id="tour-bulk-parse-btn"
            onClick={() => onNavigate('candidates', { openBulkModal: true })}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Bulk Resume AI Parse</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div id="tour-dashboard-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={kpi.action}
              className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {kpi.value}
                </span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {kpi.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recruitment Funnel & Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Pipeline Funnel */}
        <div id="tour-recruitment-funnel" className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                End-to-End Recruitment Funnel
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Conversion rates across pipeline milestones computed from live candidate records.
              </p>
            </div>
            <button
              onClick={() => onNavigate('pipeline')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View Pipeline Kanban <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {stats.stageFunnel.map((item, idx) => {
              const maxCount = Math.max(...stats.stageFunnel.map((s) => s.count), 1);
              const widthPct = Math.max(12, Math.round((item.count / maxCount) * 100));
              return (
                <div key={item.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold capitalize text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      {item.stage}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {item.count} candidates{' '}
                      {idx > 0 && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold ml-1">
                          ({item.conversionRate}% conv.)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-crm-accent rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Avg. Time to Hire</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.metrics.avgTimeToHireDays} days
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Interview-to-Offer</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.metrics.interviewToOfferRate}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Offer Acceptance</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.metrics.offerAcceptanceRate}%
              </div>
            </div>
          </div>
        </div>

        {/* Important Recruiter Alerts */}
        <div id="tour-priority-alerts" className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Priority Alerts</span>
            </h2>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {stats.alerts.length} action items
            </span>
          </div>

          <div className="space-y-3">
            {stats.alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1.5"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  {alert.type === 'action_required' ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  ) : alert.type === 'warning' ? (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  )}
                  <span>{alert.title}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {alert.message}
                </p>
              </div>
            ))}
          </div>

          {/* Quick AI Talent Copilot Banner */}
          <div className="p-4 rounded-xl bg-crm-surface-secondary border border-crm-border space-y-2 mt-4">
            <div className="flex items-center gap-2 text-xs font-bold text-crm-text">
              <Sparkles className="w-3.5 h-3.5 text-crm-accent" />
              <span>AI Talent Copilot Ready</span>
            </div>
            <p className="text-xs text-crm-text-secondary">
              Ask our specialized AI agent to generate boolean search queries, draft rubrics, or summarize candidates.
            </p>
            <button
              onClick={() => onNavigate('copilot')}
              className="text-xs font-semibold text-crm-accent hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
            >
              Open Talent Copilot <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Job-wise Hiring Progress & Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job-wise Progress */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Job-Wise Hiring Velocity
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track candidate pipeline stages per requisition.
              </p>
            </div>
            <button
              onClick={() => onNavigate('jobs')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Manage All Jobs
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.jobProgress.map((j) => (
              <div key={j.jobId} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {j.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{j.department}</span>
                    <span>•</span>
                    <span>{j.openingsCount} target opening{j.openingsCount > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {j.applicationsCount} applicants
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-medium">
                    {j.interviewingCount} interviewing
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                    {j.hiresCount} hired
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Activities */}
        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Audit Trail Activity</span>
            </h2>
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              All Logs
            </button>
          </div>

          <div className="space-y-3">
            {stats.recentActivities.slice(0, 5).map((log) => (
              <div key={log.id} className="text-xs space-y-1 pb-2 border-b border-slate-100 dark:border-slate-800/80 last:border-none">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {log.userName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-snug">
                  {log.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
