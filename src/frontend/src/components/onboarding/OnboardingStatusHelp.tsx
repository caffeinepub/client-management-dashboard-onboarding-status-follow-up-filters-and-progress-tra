import { OnboardingState } from '../../backend';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface OnboardingStatusOption {
  value: OnboardingState;
  label: string;
  description: string;
}

export const onboardingStatusOptions: OnboardingStatusOption[] = [
  {
    value: OnboardingState.half,
    label: 'Half Onboarded',
    description: 'Client has provided basic information and is ready to start. Ideal for clients who need to begin quickly.',
  },
  {
    value: OnboardingState.full,
    label: 'Full Onboarded',
    description: 'Client has completed all onboarding steps including measurements and assessments. Ready for immediate activation.',
  },
];

export function OnboardingStatusHelp() {
  return (
    <Alert className="mt-4">
      <Info className="h-4 w-4" />
      <AlertDescription className="text-sm">
        <strong>Important:</strong> Activation is required to set the follow-up day and start the plan. 
        Full onboarding must be completed before a client can be activated.
      </AlertDescription>
    </Alert>
  );
}
