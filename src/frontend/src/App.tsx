import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { LoginGate } from './components/auth/LoginGate';
import { ProfileSetupDialog } from './components/auth/ProfileSetupDialog';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsListPage } from './pages/ClientsListPage';
import { OnboardClientPage } from './pages/OnboardClientPage';
import { ClientProfilePage } from './pages/ClientProfilePage';
import { useRouter } from './hooks/useRouter';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

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
        {currentRoute === 'dashboard' && <DashboardPage />}
        {currentRoute === 'clients' && <ClientsListPage />}
        {currentRoute === 'onboard' && <OnboardClientPage />}
        {currentRoute.startsWith('client/') && <ClientProfilePage />}
      </AppLayout>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
