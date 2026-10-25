import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Briefcase,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSwitchToRegister,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const { login } = useAuth();
  const { effectiveTheme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await login(demoEmail, 'Password123!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      setForgotMessage(data.message || 'Reset instructions logged.');
    } catch (e) {
      setForgotMessage('Could not process request. Please try again.');
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

      {/* Main Login Form Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-crm-surface border border-crm-border rounded-xl shadow-xs p-7">
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-crm-text">
              Sign In to Your Workspace
            </h1>
            <p className="text-xs text-crm-text-secondary mt-1">
              Enter your credentials to access your talent pipelines and candidate records.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-crm-surface-secondary border border-crm-accent/30 text-crm-text flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-crm-accent shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-crm-text mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-crm-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-crm-border bg-crm-surface text-crm-text placeholder:text-crm-text-secondary/60 focus:outline-none focus:border-crm-accent focus:ring-1 focus:ring-crm-accent"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-crm-text">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotOpen(true);
                    setForgotEmail(email);
                    setForgotMessage(null);
                  }}
                  className="text-[11px] font-medium text-crm-accent hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-crm-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  required
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-crm-accent text-crm-accent-fg hover:bg-crm-accent-hover transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Accounts for Testing */}
          <div className="mt-6 pt-5 border-t border-crm-border">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-crm-text-secondary uppercase tracking-wider">
                Demo Workspace Accounts
              </span>
              <span className="text-[10px] text-crm-text-secondary flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-crm-accent" />
                Pre-seeded
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('sarah.jenkins@acme.ai')}
                className="text-left p-2.5 rounded-lg border border-crm-border bg-crm-surface-secondary/40 hover:bg-crm-surface-secondary transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-semibold text-crm-text truncate">
                  Sarah Jenkins
                </div>
                <div className="text-[10px] text-crm-text-secondary truncate">
                  VP Talent (Admin)
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('david.chen@acme.ai')}
                className="text-left p-2.5 rounded-lg border border-crm-border bg-crm-surface-secondary/40 hover:bg-crm-surface-secondary transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-semibold text-crm-text truncate">
                  David Chen
                </div>
                <div className="text-[10px] text-crm-text-secondary truncate">
                  Lead Recruiter
                </div>
              </button>
            </div>
          </div>

          {/* Switch to Register */}
          <div className="mt-5 text-center text-xs text-crm-text-secondary">
            Don't have a recruitment account yet?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-semibold text-crm-accent hover:underline cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-crm-surface border border-crm-border rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-crm-text">
                <HelpCircle className="w-4 h-4 text-crm-accent" />
                <span>Password Recovery Assistance</span>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="text-xs text-crm-text-secondary hover:text-crm-text cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-crm-text-secondary leading-relaxed mb-4">
              Enter your registered email address below to receive password recovery instructions.
            </p>

            {forgotMessage ? (
              <div className="p-3 rounded-lg bg-crm-surface-secondary border border-crm-border text-xs text-crm-text leading-relaxed mb-4">
                <div className="flex items-center gap-2 font-semibold text-crm-text mb-1">
                  <CheckCircle2 className="w-4 h-4 text-crm-accent" />
                  <span>Notification Logged</span>
                </div>
                {forgotMessage}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-crm-text mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-crm-border bg-crm-surface text-crm-text focus:outline-none focus:border-crm-accent"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 text-xs font-semibold rounded-lg bg-crm-accent text-crm-accent-fg hover:bg-crm-accent-hover transition-colors cursor-pointer"
                >
                  Send Recovery Link
                </button>
              </form>
            )}

            <div className="mt-4 pt-3 border-t border-crm-border text-[11px] text-crm-text-secondary">
              Note: Demo accounts use the default credentials password{' '}
              <code className="px-1 py-0.5 rounded bg-crm-surface-muted font-mono font-medium text-crm-text">
                Password123!
              </code>
            </div>
          </div>
        </div>
      )}

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
