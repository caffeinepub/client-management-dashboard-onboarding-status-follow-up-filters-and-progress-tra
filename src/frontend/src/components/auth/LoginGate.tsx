import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { UserCircle2, Shield, TrendingUp, CheckCircle2 } from 'lucide-react';

export function LoginGate() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-10 text-center">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <TrendingUp className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-5xl font-bold tracking-tight mb-3">Client Manager</h1>
            <p className="text-xl text-muted-foreground font-medium">
              Track progress, manage plans, and grow your fitness business
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <Button
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="w-full text-lg h-16 font-bold shadow-lg"
          >
            {isLoggingIn ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Connecting...
              </>
            ) : (
              <>
                <UserCircle2 className="mr-2 h-6 w-6" />
                Login to Continue
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center font-medium">
            <Shield className="h-4 w-4" />
            <span>Secure authentication via Internet Identity</span>
          </div>
        </div>

        <div className="pt-8 space-y-4 text-left max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground font-medium">Client onboarding with auto-generated codes</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground font-medium">Progress tracking with measurements & charts</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground font-medium">Follow-up scheduling & status filters</span>
          </div>
        </div>
      </div>
    </div>
  );
}
