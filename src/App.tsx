import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { ToastProvider } from '@/contexts/ToastContext';
import ToastContainer from '@/components/ToastContainer';
import LandingPage from '@/components/LandingPage';
import LoginPage from '@/components/LoginPage';
import SignupPage from '@/components/SignupPage';
import DashboardPage from '@/components/DashboardPage';
import ProjectPage from '@/components/ProjectPage';
import type { ViewType } from '@/types';

const AppContent = () => {
  const { currentUser, logout, loading } = useAuth();
  const [view, setView] = useState<ViewType>('landing');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Automatically redirect to dashboard if user is logged in and on landing/login/signup
  React.useEffect(() => {
    if (currentUser) {
      if (view === 'landing' || view === 'login' || view === 'signup') {
        setView('dashboard');
      }
    } else {
      if (view === 'dashboard' || view === 'project') {
        setView('landing');
      }
    }
  }, [currentUser, view]);

  const handleLogout = async () => {
    await logout();
    setView('landing');
    setSelectedProjectId(null);
  };

  const handleOpenProject = (id: string) => {
    setSelectedProjectId(id);
    setView('project');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-craft-green border-t-transparent rounded-full animate-spin" />
          <span className="text-craft-green font-pixel text-xs animate-pulse">LOADING CRAFTCHAIN...</span>
        </div>
      </div>
    );
  }

  // Routing Logic
  if (currentUser) {
    if (view === 'project' && selectedProjectId) {
      return <ProjectPage projectId={selectedProjectId} onBack={() => setView('dashboard')} />;
    }
    return <DashboardPage onOpenProject={handleOpenProject} onLogout={handleLogout} />;
  }

  // Guest Logic
  if (view === 'login') {
    return <LoginPage onSuccess={() => setView('dashboard')} onSignup={() => setView('signup')} onBack={() => setView('landing')} />;
  }
  if (view === 'signup') {
    return <SignupPage onSuccess={() => setView('dashboard')} onLogin={() => setView('login')} onBack={() => setView('landing')} />;
  }

  return <LandingPage onStartCrafting={() => setView('login')} onJoinProject={() => setView('login')} />;
};

const App = () => (
  <AuthProvider>
    <AppProvider>
      <ToastProvider>
        <AppContent />
        <ToastContainer />
      </ToastProvider>
    </AppProvider>
  </AuthProvider>
);

export default App;
