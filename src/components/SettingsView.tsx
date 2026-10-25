import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Building,
  Users,
  Sliders,
  Sun,
  Moon,
  Laptop,
  Clock,
  CheckCircle,
  Database,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Globe,
  FileText,
  User as UserIcon,
} from 'lucide-react';
import { AuditLog, ScoringWeights } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface SettingsViewProps {
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const { user, organization, availableUsers, switchUser, changePassword, updateProfile } = useAuth();
  const { theme, effectiveTheme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'account' | 'general' | 'roles' | 'weights' | 'audit' | 'privacy'>('account');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Profile Edit
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileTitle, setProfileTitle] = useState(user?.title || '');
  const [profileDept, setProfileDept] = useState(user?.department || '');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Change Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Scoring Weights Defaults
  const [defaultWeights, setDefaultWeights] = useState<ScoringWeights>({
    requiredSkills: 40,
    experience: 25,
    education: 15,
    projects: 10,
    preferredSkills: 10,
  });
  const [weightsSuccess, setWeightsSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileTitle(user.title || '');
      setProfileDept(user.department || '');
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAudit();
    }
  }, [activeTab]);

  const loadAudit = async () => {
    setLoadingAudit(true);
    try {
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        name: profileName,
        title: profileTitle,
        department: profileDept,
      });
      setProfileSuccess('Profile details updated successfully.');
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match. Please re-enter to confirm.');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setPasswordSuccess('Security credentials successfully updated.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.message || 'Failed to change password. Verify your current password.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleSaveWeights = async () => {
    try {
      await api.updateSettings({ defaultWeights });
      setWeightsSuccess(true);
      setTimeout(() => setWeightsSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to update weights:', e);
    }
  };

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'hirematch.app';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto text-crm-text">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-crm-text flex items-center gap-2.5">
          Settings & Account Governance
          <span className="text-xs px-2.5 py-0.5 rounded-lg font-bold bg-crm-surface-secondary text-crm-text border border-crm-border">
            Tenant Isolated
          </span>
        </h1>
        <p className="text-xs text-crm-text-secondary mt-1">
          Manage recruiter profile, credentials, appearance, match scoring weights, custom domains, and immutable audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-crm-border gap-6 text-xs font-semibold overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'account'
              ? 'border-crm-accent text-crm-text font-bold'
              : 'border-transparent text-crm-text-secondary hover:text-crm-text'
          }`}
        >
          <UserIcon className="w-4 h-4 text-crm-accent" />
          <span>My Account & Security</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'general'
              ? 'border-crm-accent text-crm-text font-bold'
              : 'border-transparent text-crm-text-secondary hover:text-crm-text'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Workspace & Theme</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'roles'
              ? 'border-crm-accent text-crm-text font-bold'
              : 'border-transparent text-crm-text-secondary hover:text-crm-text'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Members (RBAC)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('weights')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'weights'
              ? 'border-crm-accent text-crm-text font-bold'
              : 'border-transparent text-crm-text-secondary hover:text-crm-text'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Match Weights</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'audit'
              ? 'border-crm-accent text-crm-text font-bold'
              : 'border-transparent text-crm-text-secondary hover:text-crm-text'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Audit Log Trail</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'privacy'
              ? 'border-crm-accent text-crm-text font-bold'
              : 'border-transparent text-crm-text-secondary hover:text-crm-text'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Privacy, Legal & Domain</span>
        </button>
      </div>

      {/* TAB: ACCOUNT & SECURITY */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="p-6 rounded-xl border border-crm-border bg-crm-surface shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-crm-text flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-crm-accent" />
              <span>Recruiter Profile Information</span>
            </h2>

            {profileSuccess && (
              <div className="p-3 rounded-lg bg-crm-surface-secondary border border-crm-border text-xs text-crm-text flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-crm-accent" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-crm-text font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-crm-border bg-crm-surface text-crm-text focus:outline-none focus:border-crm-accent"
                />
              </div>

              <div>
                <label className="block text-crm-text font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-crm-border bg-crm-surface-muted text-crm-text-secondary cursor-not-allowed"
                />
                <span className="text-[10px] text-crm-text-secondary mt-0.5 block">
                  Work email serves as your tenant login identifier.
                </span>
              </div>

              <div>
                <label className="block text-crm-text font-semibold mb-1">Job Title</label>
                <input
                  type="text"
                  value={profileTitle}
                  onChange={(e) => setProfileTitle(e.target.value)}
                  placeholder="e.g. Senior Technical Recruiter"
                  className="w-full px-3 py-2 rounded-lg border border-crm-border bg-crm-surface text-crm-text focus:outline-none focus:border-crm-accent"
                />
              </div>

              <div>
                <label className="block text-crm-text font-semibold mb-1">Department</label>
                <input
                  type="text"
                  value={profileDept}
                  onChange={(e) => setProfileDept(e.target.value)}
                  placeholder="e.g. Talent Acquisition"
                  className="w-full px-3 py-2 rounded-lg border border-crm-border bg-crm-surface text-crm-text focus:outline-none focus:border-crm-accent"
                />
              </div>

              <div className="md:col-span-2 pt-2 flex items-center justify-between">
                <div className="text-[11px] text-crm-text-secondary font-mono">
                  Internal User ID: {user?.id} &bull; Tenant: {user?.organizationId}
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-crm-accent text-crm-accent-fg hover:bg-crm-accent-hover font-semibold text-xs transition-colors cursor-pointer"
                >
                  Save Profile Details
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="p-6 rounded-xl border border-crm-border bg-crm-surface shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-crm-text flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-crm-accent" />
              <span>Change Security Password</span>
            </h2>
            <p className="text-xs text-crm-text-secondary">
              Update your account password. All passwords are encrypted with salted PBKDF2 hashing.
            </p>

            {passwordError && (
              <div className="p-3 rounded-lg bg-crm-surface-secondary border border-crm-accent/30 text-xs text-crm-text flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-crm-accent shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-lg bg-crm-surface-secondary border border-crm-border text-xs text-crm-text flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-crm-accent" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5 max-w-md text-xs">
              <div>
                <label className="block text-crm-text font-semibold mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-crm-border bg-crm-surface text-crm-text focus:outline-none focus:border-crm-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-crm-text-secondary hover:text-crm-text cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-crm-text font-semibold mb-1">
                  New Password <span className="text-crm-text-secondary font-normal">(Min 8 characters)</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 rounded-lg border border-crm-border bg-crm-surface text-crm-text focus:outline-none focus:border-crm-accent"
                />
              </div>

              <div>
                <label className="block text-crm-text font-semibold mb-1">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 rounded-lg border border-crm-border bg-crm-surface text-crm-text focus:outline-none focus:border-crm-accent"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPass}
                className="px-4 py-2 rounded-lg bg-crm-accent text-crm-accent-fg hover:bg-crm-accent-hover font-semibold text-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {isChangingPass ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: GENERAL & THEME */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-crm-border bg-crm-surface shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-crm-text flex items-center gap-2">
              <Sun className="w-4 h-4 text-crm-accent" />
              <span>Visual Theme Settings</span>
            </h2>
            <p className="text-xs text-crm-text-secondary">
              Theme choices are persisted across browser sessions and adapt automatically to system preferences.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                  theme === 'light'
                    ? 'border-crm-accent bg-crm-surface-secondary text-crm-text font-semibold'
                    : 'border-crm-border bg-crm-surface text-crm-text-secondary hover:bg-crm-surface-muted'
                }`}
              >
                <div className="p-2 rounded-lg bg-crm-surface-tertiary text-crm-text">
                  <Sun className="w-5 h-5 text-crm-accent" />
                </div>
                <div>
                  <div className="font-bold text-xs text-crm-text">Light Mode</div>
                  <div className="text-[11px] text-crm-text-secondary">Warm peach & cream palette</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'border-crm-accent bg-crm-surface-secondary text-crm-text font-semibold'
                    : 'border-crm-border bg-crm-surface text-crm-text-secondary hover:bg-crm-surface-muted'
                }`}
              >
                <div className="p-2 rounded-lg bg-crm-surface-tertiary text-crm-text">
                  <Moon className="w-5 h-5 text-crm-accent" />
                </div>
                <div>
                  <div className="font-bold text-xs text-crm-text">Dark Mode</div>
                  <div className="text-[11px] text-crm-text-secondary">Deep forest emerald palette</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                  theme === 'system'
                    ? 'border-crm-accent bg-crm-surface-secondary text-crm-text font-semibold'
                    : 'border-crm-border bg-crm-surface text-crm-text-secondary hover:bg-crm-surface-muted'
                }`}
              >
                <div className="p-2 rounded-lg bg-crm-surface-muted text-crm-text">
                  <Laptop className="w-5 h-5 text-crm-text-secondary" />
                </div>
                <div>
                  <div className="font-bold text-xs text-crm-text">System Sync</div>
                  <div className="text-[11px] text-crm-text-secondary">Match OS appearance</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ROLES & TEAM */}
      {activeTab === 'roles' && (
        <div className="p-6 rounded-xl border border-crm-border bg-crm-surface shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-crm-text flex items-center gap-2">
            <Users className="w-4 h-4 text-crm-accent" />
            <span>Workspace Team Members & Role Permissions</span>
          </h2>
          <p className="text-xs text-crm-text-secondary">
            Role-based access control (RBAC) separates administrative controls, recruiter pipeline management, and interviewer scorecards.
          </p>

          <div className="divide-y divide-crm-border text-xs">
            {availableUsers.map((member) => (
              <div key={member.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-crm-surface-secondary text-crm-text border border-crm-border flex items-center justify-center font-bold text-xs">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-crm-text">{member.name}</div>
                    <div className="text-crm-text-secondary text-[11px]">{member.email} &bull; {member.title}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase bg-crm-surface-muted text-crm-text border border-crm-border">
                    {member.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: WEIGHTS */}
      {activeTab === 'weights' && (
        <div className="p-6 rounded-xl border border-crm-border bg-crm-surface shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-crm-text flex items-center gap-2">
              <Sliders className="w-4 h-4 text-crm-accent" />
              <span>Default Job-Candidate Match Weights</span>
            </h2>
            {weightsSuccess && (
              <span className="text-xs text-crm-text font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-crm-accent" /> Saved
              </span>
            )}
          </div>
          <p className="text-xs text-crm-text-secondary">
            Weights dictate how alignment scores are calculated. Individual jobs can override these defaults.
          </p>

          <div className="space-y-4 text-xs pt-2">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Required Skills ({defaultWeights.requiredSkills}%)</span>
                <span className="text-crm-text-secondary">Primary technical/functional skills</span>
              </div>
              <input
                type="range"
                min={20}
                max={70}
                value={defaultWeights.requiredSkills}
                onChange={(e) => setDefaultWeights({ ...defaultWeights, requiredSkills: Number(e.target.value) })}
                className="w-full accent-crm-accent cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Total Experience ({defaultWeights.experience}%)</span>
                <span className="text-crm-text-secondary">Years of verified industry roles</span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                value={defaultWeights.experience}
                onChange={(e) => setDefaultWeights({ ...defaultWeights, experience: Number(e.target.value) })}
                className="w-full accent-crm-accent cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Education Background ({defaultWeights.education}%)</span>
                <span className="text-crm-text-secondary">Degrees & academic credentials</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={defaultWeights.education}
                onChange={(e) => setDefaultWeights({ ...defaultWeights, education: Number(e.target.value) })}
                className="w-full accent-crm-accent cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Projects & Practical Artifacts ({defaultWeights.projects}%)</span>
                <span className="text-crm-text-secondary">Applied open source or project work</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={defaultWeights.projects}
                onChange={(e) => setDefaultWeights({ ...defaultWeights, projects: Number(e.target.value) })}
                className="w-full accent-crm-accent cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Preferred Skills ({defaultWeights.preferredSkills}%)</span>
                <span className="text-crm-text-secondary">Bonus qualifications</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={defaultWeights.preferredSkills}
                onChange={(e) => setDefaultWeights({ ...defaultWeights, preferredSkills: Number(e.target.value) })}
                className="w-full accent-crm-accent cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveWeights}
                className="px-4 py-2 rounded-lg bg-crm-accent text-crm-accent-fg hover:bg-crm-accent-hover font-semibold text-xs transition-colors cursor-pointer"
              >
                Save Weight Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-xl border border-crm-border bg-crm-surface shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-crm-text flex items-center gap-2">
              <Clock className="w-4 h-4 text-crm-accent" />
              <span>Immutable Audit Trail</span>
            </h2>
            <button
              type="button"
              onClick={loadAudit}
              className="text-xs text-crm-accent hover:underline font-semibold cursor-pointer"
            >
              Refresh Logs
            </button>
          </div>

          <div className="divide-y divide-crm-border text-xs">
            {loadingAudit ? (
              <div className="py-8 text-center text-crm-text-secondary">Loading audit records...</div>
            ) : auditLogs.length === 0 ? (
              <div className="py-8 text-center text-crm-text-secondary italic">No audit records found.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-crm-text flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-crm-surface-muted text-crm-text border border-crm-border">
                        {log.action}
                      </span>
                      <span>{log.userName}</span>
                    </span>
                    <span className="text-[10px] font-mono text-crm-text-secondary">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-crm-text-secondary leading-snug">
                    {log.details}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: PRIVACY, LEGAL & DOMAIN */}
      {activeTab === 'privacy' && (
        <div className="space-y-6 text-xs leading-relaxed text-crm-text-secondary">
          {/* Custom Domain Info */}
          <div className="p-6 rounded-xl border border-crm-border bg-crm-surface shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-crm-text flex items-center gap-2">
              <Globe className="w-4 h-4 text-crm-accent" />
              <span>Custom Domain & Hosting Status</span>
            </h2>
            <p>
              HireMatch AI is deployed to a secure Cloud Run container instance with automatic TLS termination and SSL certificates.
            </p>
            <div className="p-3 rounded-lg bg-crm-surface-muted border border-crm-border space-y-1 font-mono text-[11px] text-crm-text">
              <div>Active Endpoint: <span className="font-semibold">{currentHost}</span></div>
              <div>Tenant Organization: <span className="font-semibold">{organization?.name} ({organization?.slug})</span></div>
              <div>Transport Security: <span className="font-semibold text-crm-accent">TLS 1.3 Active (Encrypted)</span></div>
            </div>
            <p className="text-[11px] text-crm-text-secondary">
              To point a custom apex or subdomain (e.g. <code className="text-crm-text font-mono">careers.yourcompany.com</code>), configure a CNAME record pointing to your assigned Cloud Run host in your domain registrar's DNS settings.
            </p>
          </div>

          {/* Legal Documents */}
          <div className="p-6 rounded-xl border border-crm-border bg-crm-surface shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-crm-text flex items-center gap-2">
              <FileText className="w-4 h-4 text-crm-accent" />
              <span>Legal Agreements & Compliance Documentation</span>
            </h2>
            <p>
              Review the complete production legal agreements and compliance frameworks governing this deployment:
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              {onOpenPrivacy && (
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="px-3.5 py-2 rounded-lg border border-crm-border bg-crm-surface-muted text-crm-text font-semibold hover:border-crm-accent transition-colors cursor-pointer"
                >
                  View Full Privacy Policy
                </button>
              )}
              {onOpenTerms && (
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="px-3.5 py-2 rounded-lg border border-crm-border bg-crm-surface-muted text-crm-text font-semibold hover:border-crm-accent transition-colors cursor-pointer"
                >
                  View Terms & Conditions
                </button>
              )}
            </div>
          </div>

          {/* AI Fairness */}
          <div className="p-6 rounded-xl border border-crm-border bg-crm-surface shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-crm-text flex items-center gap-2">
              <Shield className="w-4 h-4 text-crm-accent" />
              <span>AI Non-Discrimination Policy</span>
            </h2>
            <p>
              In accordance with EEOC, OFCCP, and algorithmic fairness standards, HireMatch AI explicitly ignores protected characteristics: age, race, religion, gender, disability, marital status, or nationality. Alignment scores represent structured evidence matching and never constitute autonomous employment decisions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
