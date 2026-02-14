import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { UserCircle2, Shield, TrendingUp } from 'lucide-react';

export function LoginGate() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Client Manager</h1>
          <p className="text-lg text-muted-foreground">
            Track progress, manage plans, and grow your fitness business
          </p>
        </div>

        <div className="space-y-4 pt-8">
          <Button
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="w-full text-lg h-14"
          >
            {isLoggingIn ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Connecting...
              </>
            ) : (
              <>
                <UserCircle2 className="mr-2 h-5 w-5" />
                Login to Continue
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
            <Shield className="h-4 w-4" />
            <span>Secure authentication via Internet Identity</span>
          </div>
        </div>

        <div className="pt-12 space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <span>Client onboarding with auto-generated codes</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <span>Progress tracking with measurements & charts</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <span>Follow-up scheduling & status filters</span>
          </div>
        </div>
      </div>
    </div>
  );
}
