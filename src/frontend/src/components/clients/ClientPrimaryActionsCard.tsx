import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Pause, Play } from 'lucide-react';
import { ConvertToFullOnboardingButton } from './ConvertToFullOnboardingButton';
import { ActionHint } from './ActionHint';
import type { ExtendedClient } from '../../backend';
import { isClientActivated } from '../../utils/status';

interface ClientPrimaryActionsCardProps {
  client: ExtendedClient;
  onActivate: () => void;
  onPause: () => void;
  onResume: () => void;
  onRenew: () => void;
  onExpire: () => void;
  onConvertToFull: () => void;
  isActivating?: boolean;
  isPausing?: boolean;
  isResuming?: boolean;
  isRenewing?: boolean;
  isExpiring?: boolean;
  isConverting?: boolean;
}

export function ClientPrimaryActionsCard({
  client,
  onActivate,
  onPause,
  onResume,
  onRenew,
  onExpire,
  onConvertToFull,
  isActivating = false,
  isPausing = false,
  isResuming = false,
  isRenewing = false,
  isExpiring = false,
  isConverting = false,
}: ClientPrimaryActionsCardProps) {
  const activated = isClientActivated(client);
  const isHalfOnboarding = client.onboardingState === 'half';
  const isFullOnboarding = client.onboardingState === 'full';
  const isPaused = client.status === 'paused';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Convert to Full Onboarding - Always visible for consistency */}
        {!activated && (
          <ConvertToFullOnboardingButton
            onConvert={onConvertToFull}
            isLoading={isConverting}
            disabled={isFullOnboarding}
            disabledReason={
              isFullOnboarding
                ? 'Client is already in full onboarding status'
                : undefined
            }
            variant="outline"
            className="w-full"
          />
        )}

        {/* Activate Client */}
        {!activated && (
          <>
            <Button
              onClick={onActivate}
              disabled={isHalfOnboarding || isActivating}
              className="w-full"
            >
              {isActivating ? 'Activating...' : 'Activate Client'}
            </Button>
            {isHalfOnboarding && (
              <ActionHint message="Client must complete full onboarding before activation" />
            )}
          </>
        )}

        {/* Pause/Resume Client */}
        {activated && (
          <>
            {isPaused ? (
              <Button
                onClick={onResume}
                disabled={isResuming}
                variant="outline"
                className="w-full"
              >
                {isResuming ? (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Resuming...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Resume Client
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={onPause}
                disabled={isPausing}
                variant="outline"
                className="w-full"
              >
                {isPausing ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pausing...
                  </>
                ) : (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause Client
                  </>
                )}
              </Button>
            )}
          </>
        )}

        {/* Renew Subscription */}
        {activated && (
          <Button
            onClick={onRenew}
            disabled={isRenewing}
            variant="default"
            className="w-full"
          >
            {isRenewing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Renewing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Renew Subscription
              </>
            )}
          </Button>
        )}

        {/* Expire Membership */}
        {activated && (
          <Button
            onClick={onExpire}
            disabled={isExpiring}
            variant="destructive"
            className="w-full"
          >
            {isExpiring ? (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Expiring...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Expire Membership
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
