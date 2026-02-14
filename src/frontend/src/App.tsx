import { Suspense, lazy } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { LoginGate } from './components/auth/LoginGate';
import { ProfileSetupDialog } from './components/auth/ProfileSetupDialog';
import { AppLayout } from './components/layout/AppLayout';
import { RouteLoadingFallback } from './components/layout/RouteLoadingFallback';
import { useRouter } from './hooks/useRouter';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

// Lazy load page components for code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ClientsListPage = lazy(() => import('./pages/ClientsListPage').then(m => ({ default: m.ClientsListPage })));
const OnboardClientPage = lazy(() => import('./pages/OnboardClientPage').then(m => ({ default: m.OnboardClientPage })));
const ClientProfilePage = lazy(() => import('./pages/ClientProfilePage').then(m => ({ default: m.ClientProfilePage })));

function App() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { currentRoute } = useRouter();

  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return <LoginGate />;
  }

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (showProfileSetup) {
    return <ProfileSetupDialog />;
  }

  if (profileLoading || !isFetched) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppLayout>
        <Suspense fallback={<RouteLoadingFallback />}>
          {currentRoute === 'dashboard' && <DashboardPage />}
          {currentRoute === 'clients' && <ClientsListPage />}
          {currentRoute === 'onboard' && <OnboardClientPage />}
          {currentRoute.startsWith('client/') && <ClientProfilePage />}
        </Suspense>
      </AppLayout>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
