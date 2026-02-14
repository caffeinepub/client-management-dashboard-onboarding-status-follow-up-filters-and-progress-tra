import { Suspense, lazy } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetAppInitData } from './hooks/useQueries';
import { useStableActorConnection } from './hooks/useStableActorConnection';
import { LoginGate } from './components/auth/LoginGate';
import { ProfileSetupDialog } from './components/auth/ProfileSetupDialog';
import { AppLayout } from './components/layout/AppLayout';
import { RouteLoadingFallback } from './components/layout/RouteLoadingFallback';
import { useRouter } from './hooks/useRouter';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { InitialLoadDebugPanel } from './components/debug/InitialLoadDebugPanel';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { normalizeError } from './utils/errors';

// Lazy load page components for code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ClientsListPage = lazy(() => import('./pages/ClientsListPage').then(m => ({ default: m.ClientsListPage })));
const OnboardClientPage = lazy(() => import('./pages/OnboardClientPage').then(m => ({ default: m.OnboardClientPage })));
const ClientProfilePage = lazy(() => import('./pages/ClientProfilePage').then(m => ({ default: m.ClientProfilePage })));

function App() {
  const { identity } = useInternetIdentity();
  const { isConnecting, isReady: connectionReady } = useStableActorConnection();
  const { data: initData, isLoading: initLoading, isError, error, refetch } = useGetAppInitData();
  const { currentRoute } = useRouter();

  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return <LoginGate />;
  }

  // Show connecting state until backend is confirmed ready
  if (isConnecting || !connectionReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-lg font-medium text-foreground">Connecting...</p>
          <p className="text-sm text-muted-foreground mt-2">Establishing connection to backend</p>
        </div>
      </div>
    );
  }

  // Show profile setup if user has no profile
  const showProfileSetup = !initLoading && initData && initData.userProfile === null;

  if (showProfileSetup) {
    return <ProfileSetupDialog />;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppLayout>
        {initLoading ? (
          <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-muted-foreground">Loading your data...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
            <div className="text-center max-w-md space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-xl font-semibold">Unable to Load Data</h2>
              <p className="text-muted-foreground">
                We encountered an issue loading your data. Please try again.
              </p>
              {error && (
                <p className="text-sm text-muted-foreground">
                  {normalizeError(error)}
                </p>
              )}
              <Button onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <Suspense fallback={<RouteLoadingFallback />}>
            {currentRoute === 'dashboard' && <DashboardPage />}
            {currentRoute === 'clients' && <ClientsListPage />}
            {currentRoute === 'onboard' && <OnboardClientPage />}
            {currentRoute.startsWith('client/') && <ClientProfilePage />}
          </Suspense>
        )}
      </AppLayout>
      <Toaster />
      <InitialLoadDebugPanel />
    </ThemeProvider>
  );
}

export default App;
