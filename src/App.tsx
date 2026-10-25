import React, { useState, lazy, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { LoadingScreen } from './components/LoadingScreen';

// Lazy Loaded CRM Views
const DashboardView = lazy(() =>
  import('./components/DashboardView').then((m) => ({ default: m.DashboardView }))
);
const JobsView = lazy(() =>
  import('./components/JobsView').then((m) => ({ default: m.JobsView }))
);
const CandidatesView = lazy(() =>
  import('./components/CandidatesView').then((m) => ({ default: m.CandidatesView }))
);
const PipelineView = lazy(() =>
  import('./components/PipelineView').then((m) => ({ default: m.PipelineView }))
);
const MatchCompareView = lazy(() =>
  import('./components/MatchCompareView').then((m) => ({ default: m.MatchCompareView }))
);
const InterviewsView = lazy(() =>
  import('./components/InterviewsView').then((m) => ({ default: m.InterviewsView }))
);
const CommunicationsView = lazy(() =>
  import('./components/CommunicationsView').then((m) => ({ default: m.CommunicationsView }))
);
const AnalyticsView = lazy(() =>
  import('./components/AnalyticsView').then((m) => ({ default: m.AnalyticsView }))
);
const AiCopilotView = lazy(() =>
  import('./components/AiCopilotView').then((m) => ({ default: m.AiCopilotView }))
);
const BrandStudioView = lazy(() =>
  import('./components/BrandStudioView').then((m) => ({ default: m.BrandStudioView }))
);
const SettingsView = lazy(() =>
  import('./components/SettingsView').then((m) => ({ default: m.SettingsView }))
);
const PrivacyPolicyView = lazy(() =>
  import('./components/PrivacyPolicyView').then((m) => ({ default: m.PrivacyPolicyView }))
);
const TermsView = lazy(() =>
  import('./components/TermsView').then((m) => ({ default: m.TermsView }))
);

// Lazy Loaded Authentication Views
const LoginPage = lazy(() =>
  import('./components/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./components/auth/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);

function AppContent() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register' | 'privacy' | 'terms'>('login');
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [navMeta, setNavMeta] = useState<any>(null);

  const handleNavigate = (tab: NavTab, meta?: any) => {
    setCurrentTab(tab);
    setNavMeta(meta || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectJobFromSearch = (jobId: string) => {
    handleNavigate('jobs', { jobId });
  };

  const handleSelectCandidateFromSearch = (candidateId: string) => {
    handleNavigate('candidates', { candidateId });
  };

  // 1. Initial Authentication Loading State
  if (loading) {
    return <LoadingScreen message="Establishing secure connection to recruitment database..." />;
  }

  // 2. Unauthenticated User Experience (Login / Registration / Legal)
  if (!user) {
    return (
      <Suspense fallback={<LoadingScreen message="Loading security credentials..." />}>
        {authView === 'login' && (
          <LoginPage
            onSwitchToRegister={() => setAuthView('register')}
            onOpenPrivacy={() => setAuthView('privacy')}
            onOpenTerms={() => setAuthView('terms')}
          />
        )}
        {authView === 'register' && (
          <RegisterPage
            onSwitchToLogin={() => setAuthView('login')}
            onOpenPrivacy={() => setAuthView('privacy')}
            onOpenTerms={() => setAuthView('terms')}
          />
        )}
        {authView === 'privacy' && (
          <div className="min-h-screen bg-crm-bg p-6">
            <PrivacyPolicyView onBack={() => setAuthView('login')} />
          </div>
        )}
        {authView === 'terms' && (
          <div className="min-h-screen bg-crm-bg p-6">
            <TermsView onBack={() => setAuthView('login')} />
          </div>
        )}
      </Suspense>
    );
  }

  // 3. Authenticated CRM Workspace Experience
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-crm-bg text-crm-text">
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => handleNavigate(tab)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <TopNav
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onNavigateSettings={() => handleNavigate('settings')}
        />

        {/* Viewport Router with Suspense */}
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<LoadingScreen message="Loading recruitment workspace view..." />}>
            {currentTab === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
            {currentTab === 'jobs' && (
              <JobsView
                onNavigate={handleNavigate}
                openCreateImmediately={Boolean(navMeta?.openCreateModal)}
              />
            )}
            {currentTab === 'candidates' && (
              <CandidatesView
                onNavigate={handleNavigate}
                openBulkImmediately={Boolean(navMeta?.openBulkModal)}
              />
            )}
            {currentTab === 'pipeline' && (
              <PipelineView onNavigate={handleNavigate} initialJobId={navMeta?.jobId} />
            )}
            {currentTab === 'matching' && (
              <MatchCompareView
                onNavigate={handleNavigate}
                initialJobId={navMeta?.jobId}
                initialCandidateId={navMeta?.candidateId}
              />
            )}
            {currentTab === 'interviews' && (
              <InterviewsView
                onNavigate={handleNavigate}
                initialCandidateId={navMeta?.candidateId}
                initialJobId={navMeta?.jobId}
              />
            )}
            {currentTab === 'communications' && (
              <CommunicationsView onNavigate={handleNavigate} />
            )}
            {currentTab === 'analytics' && <AnalyticsView />}
            {currentTab === 'copilot' && <AiCopilotView />}
            {currentTab === 'brand_studio' && <BrandStudioView />}
            {currentTab === 'settings' && (
              <SettingsView
                onOpenPrivacy={() => handleNavigate('privacy')}
                onOpenTerms={() => handleNavigate('terms')}
              />
            )}
            {currentTab === 'privacy' && (
              <PrivacyPolicyView onBack={() => handleNavigate('settings')} />
            )}
            {currentTab === 'terms' && (
              <TermsView onBack={() => handleNavigate('settings')} />
            )}
          </Suspense>
        </main>
      </div>

      {/* Global Quick Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectJob={handleSelectJobFromSearch}
        onSelectCandidate={handleSelectCandidateFromSearch}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
