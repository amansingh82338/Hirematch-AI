import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Briefcase,
  Lock,
  Mail,
  User as UserIcon,
  Building2,
  Eye,
  EyeOff,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Shield,
} from 'lucide-react';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSwitchToLogin,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const { register } = useAuth();
  const { effectiveTheme, toggleTheme } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter to confirm.');
      return;
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password, company.trim() || undefined);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-crm-bg text-crm-text selection:bg-crm-accent selection:text-crm-accent-fg">
      {/* Top Bar with Brand & Theme Toggle */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-crm-border bg-crm-surface">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-crm-accent flex items-center justify-center text-crm-accent-fg shadow-xs">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-crm-text block leading-tight">
              HireMatch AI
            </span>
            <span className="text-[11px] text-crm-text-secondary block">
              Enterprise Recruitment CRM
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-crm-border bg-crm-surface text-crm-text hover:bg-crm-surface-muted transition-colors cursor-pointer"
          >
            {effectiveTheme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-crm-accent" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-crm-accent" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Registration Form Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-crm-surface border border-crm-border rounded-xl shadow-xs p-7">
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-crm-text">
              Create Recruiter Account
            </h1>
            <p className="text-xs text-crm-text-secondary mt-1">
              Start managing jobs, candidate pipelines, and structured interview rubrics.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-crm-surface-secondary border border-crm-accent/30 text-crm-text flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-crm-accent shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-crm-text mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-crm-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jessica Taylor"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-crm-border bg-crm-surface text-crm-text placeholder:text-crm-text-secondary/60 focus:outline-none focus:border-crm-accent focus:ring-1 focus:ring-crm-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-crm-text mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-crm-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jessica@company.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-crm-border bg-crm-surface text-crm-text placeholder:text-crm-text-secondary/60 focus:outline-none focus:border-crm-accent focus:ring-1 focus:ring-crm-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-crm-text mb-1">
                Organization / Company Name <span className="text-crm-text-secondary font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-crm-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Innovations Inc."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-crm-border bg-crm-surface text-crm-text placeholder:text-crm-text-secondary/60 focus:outline-none focus:border-crm-accent focus:ring-1 focus:ring-crm-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-crm-text mb-1">
                Password <span className="text-crm-text-secondary font-normal">(Min 8 characters)</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-crm-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-crm-border bg-crm-surface text-crm-text placeholder:text-crm-text-secondary/60 focus:outline-none focus:border-crm-accent focus:ring-1 focus:ring-crm-accent"
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
              <label className="block text-xs font-semibold text-crm-text mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-crm-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password to verify"
                  required
                  minLength={8}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-crm-border bg-crm-surface text-crm-text placeholder:text-crm-text-secondary/60 focus:outline-none focus:border-crm-accent focus:ring-1 focus:ring-crm-accent"
                />
              </div>
            </div>

            {/* Privacy & Tenant Security Notice */}
            <div className="p-3 rounded-lg bg-crm-surface-secondary/40 border border-crm-border flex items-start gap-2.5 text-[11px] text-crm-text-secondary">
              <Shield className="w-4 h-4 text-crm-accent shrink-0 mt-0.5" />
              <span>
                Each registered account automatically provisions a private tenant organization. Your jobs, applicants, and resumes remain isolated from other companies.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-crm-accent text-crm-accent-fg hover:bg-crm-accent-hover transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span>Provisioning Workspace...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-5 text-center text-xs text-crm-text-secondary">
            Already have an active account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold text-crm-accent hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </main>

      {/* Footer Legal Links */}
      <footer className="px-6 py-4 border-t border-crm-border bg-crm-surface text-center flex flex-wrap items-center justify-between gap-4 text-xs text-crm-text-secondary">
        <div>
          HireMatch AI Recruitment CRM &copy; {new Date().getFullYear()}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="hover:text-crm-text hover:underline cursor-pointer"
          >
            Privacy Policy
          </button>
          <span className="text-crm-border">&bull;</span>
          <button
            type="button"
            onClick={onOpenTerms}
            className="hover:text-crm-text hover:underline cursor-pointer"
          >
            Terms & Conditions
          </button>
        </div>
      </footer>
    </div>
  );
};
