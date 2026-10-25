import React, { useState } from 'react';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Laptop,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  UserCheck,
  Building2,
  LogOut,
  Settings,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface TopNavProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onNavigateSettings?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onToggleSidebar,
  onOpenSearch,
  onNavigateSettings,
}) => {
  const { theme, effectiveTheme, setTheme } = useTheme();
  const { user, organization, availableUsers, switchUser, logout } = useAuth();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-16 border-b bg-crm-surface border-crm-border">
      {/* Left controls */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          className="p-2 rounded-lg text-crm-text-secondary hover:text-crm-text hover:bg-crm-surface-muted transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-crm-border bg-crm-surface-muted text-crm-text-secondary text-xs hover:border-crm-accent/40 transition-all w-48 sm:w-72 justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-crm-text-secondary" />
            <span className="truncate">Search jobs, candidates, skills...</span>
          </span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium rounded border border-crm-border bg-crm-surface text-crm-text-secondary">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Tenant Organization Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-crm-surface-secondary border border-crm-border text-crm-text text-xs font-medium">
          <Building2 className="w-3.5 h-3.5 text-crm-accent" />
          <span className="truncate max-w-[160px]">{organization?.name || 'Workspace'}</span>
        </div>

        {/* Theme Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowRoleMenu(false);
              setShowNotifications(false);
            }}
            aria-label="Toggle theme appearance"
            className="p-2 rounded-lg text-crm-text hover:bg-crm-surface-muted transition-colors cursor-pointer"
            title="Appearance settings"
          >
            {effectiveTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-crm-accent" />
            ) : (
              <Sun className="w-4 h-4 text-crm-accent" />
            )}
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-crm-border bg-crm-surface p-1.5 shadow-lg z-50 text-xs space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  theme === 'light'
                    ? 'bg-crm-surface-secondary text-crm-text font-semibold'
                    : 'text-crm-text-secondary hover:bg-crm-surface-muted hover:text-crm-text'
                }`}
              >
                <Sun className="w-4 h-4 text-crm-accent" />
                <span>Light Mode</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-crm-surface-secondary text-crm-text font-semibold'
                    : 'text-crm-text-secondary hover:bg-crm-surface-muted hover:text-crm-text'
                }`}
              >
                <Moon className="w-4 h-4 text-crm-accent" />
                <span>Dark Mode</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTheme('system');
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  theme === 'system'
                    ? 'bg-crm-surface-secondary text-crm-text font-semibold'
                    : 'text-crm-text-secondary hover:bg-crm-surface-muted hover:text-crm-text'
                }`}
              >
                <Laptop className="w-4 h-4 text-crm-text-secondary" />
                <span>System Default</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Alert Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowRoleMenu(false);
              setShowThemeMenu(false);
            }}
            aria-label="View recent alerts and tasks"
            className="p-2 relative rounded-lg text-crm-text hover:bg-crm-surface-muted transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-crm-accent" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-crm-border bg-crm-surface p-3 shadow-lg z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-crm-border font-semibold text-crm-text">
                <span>Recruiter Tasks & Alerts</span>
                <span className="text-[10px] font-normal text-crm-text-secondary">Action items</span>
              </div>
              <div className="divide-y divide-crm-border pt-1">
                <div className="py-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-crm-text">
                    <AlertTriangle className="w-3.5 h-3.5 text-crm-accent" />
                    <span>Candidate Profile Verification</span>
                  </div>
                  <p className="text-crm-text-secondary text-[11px] leading-relaxed">
                    Sophia Lindqvist's resume extraction contains fields marked for recruiter review.
                  </p>
                </div>
                <div className="py-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-crm-text">
                    <CheckCircle2 className="w-3.5 h-3.5 text-crm-accent" />
                    <span>Interview Scheduled</span>
                  </div>
                  <p className="text-crm-text-secondary text-[11px] leading-relaxed">
                    Senior AI Systems interview with Elena Rostova, Maria Santos, and Alex Wong.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Role & User Switcher / Account Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowThemeMenu(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-crm-border hover:bg-crm-surface-muted text-xs font-medium transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-crm-accent text-crm-accent-fg flex items-center justify-center font-bold text-[10px]">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-crm-text font-semibold leading-tight truncate max-w-[120px]">
                {user?.name}
              </span>
              <span className="text-[10px] text-crm-text-secondary capitalize">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-crm-text-secondary" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-crm-border bg-crm-surface p-2 shadow-xl z-50 text-xs">
              <div className="px-2 py-1.5 border-b border-crm-border mb-1">
                <span className="text-[11px] font-bold text-crm-text-secondary uppercase tracking-wider">
                  Active Account: {organization?.name}
                </span>
              </div>

              {availableUsers.length > 1 && (
                <div className="space-y-1 mb-2 pb-2 border-b border-crm-border">
                  <div className="px-2 text-[10px] text-crm-text-secondary uppercase font-semibold">
                    Switch Workspace Role
                  </div>
                  {availableUsers.map((u) => {
                    const isCurrent = u.id === user?.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          switchUser(u.id);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-crm-surface-secondary text-crm-text font-semibold'
                            : 'hover:bg-crm-surface-muted text-crm-text-secondary hover:text-crm-text'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-md bg-crm-surface-tertiary text-crm-text flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{u.name}</div>
                          <div className="text-[10px] text-crm-text-secondary capitalize">
                            {u.role.replace('_', ' ')} &bull; {u.title}
                          </div>
                        </div>
                        {isCurrent && <UserCheck className="w-4 h-4 text-crm-accent" />}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="space-y-1">
                {onNavigateSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateSettings();
                      setShowRoleMenu(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-crm-text-secondary hover:bg-crm-surface-muted hover:text-crm-text transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-crm-text-secondary" />
                    <span>Account Settings & Password</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    setShowRoleMenu(false);
                    await logout();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-crm-accent hover:bg-crm-surface-secondary transition-colors cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
