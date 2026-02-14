import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ActionHint } from './ActionHint';

interface ConvertToFullOnboardingButtonProps {
  onConvert: () => void;
  isLoading: boolean;
  disabled?: boolean;
  disabledReason?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function ConvertToFullOnboardingButton({
  onConvert,
  isLoading,
  disabled = false,
  disabledReason,
  variant = 'default',
  size = 'default',
  className,
}: ConvertToFullOnboardingButtonProps) {
  if (disabled && disabledReason) {
    return (
      <div className={className}>
        <Button
          variant={variant}
          size={size}
          disabled={true}
          className="w-full"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Convert to Full Onboarding
        </Button>
        <div className="mt-2">
          <ActionHint message={disabledReason} />
        </div>
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onConvert}
      disabled={isLoading || disabled}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Converting...
        </>
      ) : (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Convert to Full Onboarding
        </>
      )}
    </Button>
  );
}
