import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Kanban,
  GitCompare,
  CalendarCheck,
  Mail,
  BarChart3,
  BotMessageSquare,
  Sparkles,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'jobs'
  | 'candidates'
  | 'pipeline'
  | 'matching'
  | 'interviews'
  | 'communications'
  | 'analytics'
  | 'copilot'
  | 'brand_studio'
  | 'settings'
  | 'privacy'
  | 'terms';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  collapsed,
}) => {
  const { user, organization } = useAuth();

  const navItems: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'jobs', label: 'Job Openings', icon: Briefcase },
    { id: 'candidates', label: 'Candidate CRM', icon: Users },
    { id: 'pipeline', label: 'Visual Pipeline', icon: Kanban },
    { id: 'matching', label: 'Match & Compare', icon: GitCompare, badge: 'AI' },
    { id: 'interviews', label: 'Interviews & Prep', icon: CalendarCheck },
    { id: 'communications', label: 'Candidate Outreach', icon: Mail },
    { id: 'analytics', label: 'Hiring Analytics', icon: BarChart3 },
    { id: 'copilot', label: 'AI Talent Copilot', icon: BotMessageSquare, badge: 'GenAI' },
    { id: 'brand_studio', label: 'Employer Brand Studio', icon: Sparkles, badge: 'Media' },
    { id: 'settings', label: 'Settings & Account', icon: Settings },
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col border-r transition-all duration-200 bg-crm-surface border-crm-border shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-crm-border h-16 bg-crm-surface">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-crm-accent text-crm-accent-fg font-black text-base shadow-xs shrink-0">
          <Briefcase className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-sm tracking-tight text-crm-text flex items-center gap-1.5 leading-tight">
              HireMatch <span className="text-[10px] px-1 py-0.5 rounded font-mono font-semibold bg-crm-surface-secondary text-crm-text border border-crm-border">AI</span>
            </span>
            <span className="text-[11px] text-crm-text-secondary truncate mt-0.5">
              {organization?.name || 'Recruitment Workspace'}
            </span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div id="tour-sidebar-nav" className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-crm-surface-secondary text-crm-text border border-crm-border font-semibold shadow-xs'
                  : 'text-crm-text-secondary hover:bg-crm-surface-muted hover:text-crm-text'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-crm-accent' : 'text-crm-text-secondary'}`} />
              {!collapsed && (
                <span className="flex-1 text-left truncate flex items-center justify-between">
                  {item.label}
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-crm-surface-tertiary text-crm-text border border-crm-border">
                      {item.badge}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tenant & Active User Footer */}
      <div className="p-3 border-t border-crm-border bg-crm-surface">
        <div
          onClick={() => onTabChange('settings')}
          className={`flex items-center gap-2.5 p-2 rounded-lg bg-crm-surface-muted border border-crm-border hover:border-crm-accent/40 transition-colors cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          title="Account & Workspace Settings"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-lg object-cover shrink-0 border border-crm-border" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-crm-surface-secondary text-crm-text border border-crm-border flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-crm-text truncate">
                {user?.name || 'Recruiter'}
              </div>
              <div className="text-[10px] text-crm-text-secondary capitalize truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-crm-accent" />
                {user?.role?.replace('_', ' ') || 'Admin'}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
