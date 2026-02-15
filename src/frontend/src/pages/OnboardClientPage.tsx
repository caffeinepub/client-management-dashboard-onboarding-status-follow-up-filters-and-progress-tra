import { useState } from 'react';
import { useCreateClient } from '../hooks/useQueries';
import { useRouter } from '../hooks/useRouter';
import { useStableActorConnection } from '../hooks/useStableActorConnection';
import { OnboardingState } from '../backend';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { formatClientCode } from '../utils/clientCode';
import { normalizeError } from '../utils/errors';
import { normalizeMobileNumber, isValidMobileNumber, getMobileNumberError } from '../utils/mobileNumber';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { onboardingStatusOptions, OnboardingStatusHelp } from '../components/onboarding/OnboardingStatusHelp';
import { PlanSubscriptionSection } from '../components/onboarding/PlanSubscriptionSection';

const wizardSteps = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Enter the client\'s name and contact details',
  },
  {
    id: 'plan-subscription',
    title: 'Plan Subscription',
    description: 'Record the plan duration and extra days',
  },
  {
    id: 'status-notes',
    title: 'Onboarding Status & Notes',
    description: 'Set the onboarding status and add any additional notes',
  },
  {
    id: 'review',
    title: 'Review & Confirm',
    description: 'Review the information before creating the client',
  },
];

export function OnboardClientPage() {
  const { navigate } = useRouter();
  const createClient = useCreateClient();
  const { isConnecting, isReady } = useStableActorConnection();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    notes: '',
    onboardingState: OnboardingState.half,
    planDurationValue: 1,
    planDurationUnit: 'months' as 'days' | 'months',
    extraDays: 0,
  });

  const [fieldErrors, setFieldErrors] = useState({
    name: null as string | null,
    mobileNumber: null as string | null,
    planDuration: null as string | null,
  });

  const [createdClientCode, setCreatedClientCode] = useState<bigint | null>(null);
  const [createdClientPlanDetails, setCreatedClientPlanDetails] = useState<{
    planDurationDays: number;
    extraDays: number;
  } | null>(null);

  // Determine if the form can be interacted with
  const canInteract = isReady && !createClient.isPending;

  // Calculate total plan days
  const getTotalPlanDays = () => {
    const baseDays = formData.planDurationUnit === 'months' 
      ? formData.planDurationValue * 30 
      : formData.planDurationValue;
    return baseDays;
  };

  // Validation for each step
  const validateStep = (step: number): boolean => {
    if (step === 0) {
      // Basic info step
      const nameError = formData.name.trim() ? null : 'Client name is required';
      const mobileError = getMobileNumberError(formData.mobileNumber);
      
      setFieldErrors({
        ...fieldErrors,
        name: nameError,
        mobileNumber: mobileError,
      });

      return !nameError && !mobileError;
    }
    
    if (step === 1) {
      // Plan subscription step
      const planError = formData.planDurationValue > 0 ? null : 'Plan duration must be at least 1';
      
      setFieldErrors({
        ...fieldErrors,
        planDuration: planError,
      });

      return !planError;
    }
    
    // Other steps don't have required validation
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, wizardSteps.length - 1));
    }
  };

  const handleBack = () => {
    // Clear errors when going back
    setFieldErrors({ name: null, mobileNumber: null, planDuration: null });
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    // Guard: prevent submission if not ready
    if (!canInteract) {
      return;
    }

    // Final validation
    if (!validateStep(0) || !validateStep(1)) {
      toast.error('Please complete all required fields');
      setCurrentStep(0);
      return;
    }

    try {
      const planDurationDays = getTotalPlanDays();
      
      const clientCode = await createClient.mutateAsync({
        name: formData.name.trim(),
        mobileNumber: normalizeMobileNumber(formData.mobileNumber),
        notes: formData.notes.trim(),
        onboardingState: formData.onboardingState,
        planDurationDays: BigInt(planDurationDays),
        extraDays: BigInt(formData.extraDays),
      });

      setCreatedClientCode(clientCode);
      setCreatedClientPlanDetails({
        planDurationDays,
        extraDays: formData.extraDays,
      });
      toast.success('Client onboarded successfully!');
    } catch (error) {
      toast.error(normalizeError(error));
      console.error('Onboarding error:', error);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      mobileNumber: '',
      notes: '',
      onboardingState: OnboardingState.half,
      planDurationValue: 1,
      planDurationUnit: 'months',
      extraDays: 0,
    });
    setFieldErrors({ name: null, mobileNumber: null, planDuration: null });
    setCreatedClientCode(null);
    setCreatedClientPlanDetails(null);
    setCurrentStep(0);
  };

  const handleCopyClientCode = async () => {
    if (createdClientCode === null) return;
    
    try {
      await navigator.clipboard.writeText(formatClientCode(createdClientCode.toString()));
      toast.success('Client code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy client code');
      console.error('Copy error:', error);
    }
  };

  // Success screen
  if (createdClientCode !== null) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-2">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-3">Client Onboarded Successfully!</h2>
                <p className="text-muted-foreground text-lg">
                  Client code: <span className="font-bold text-foreground">{formatClientCode(createdClientCode.toString())}</span>
                </p>
              </div>
              
              {createdClientPlanDetails && (
                <div className="rounded-lg border-2 bg-card p-6 text-left max-w-md mx-auto">
                  <h3 className="font-bold text-lg mb-4">Plan Details Recorded</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan Duration:</span>
                      <span className="font-semibold">{createdClientPlanDetails.planDurationDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Extra Days:</span>
                      <span className="font-semibold">{createdClientPlanDetails.extraDays} days</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Total Duration:</span>
                      <span className="font-bold">{createdClientPlanDetails.planDurationDays + createdClientPlanDetails.extraDays} days</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button onClick={handleCopyClientCode} variant="outline" className="gap-2 font-semibold">
                  <Copy className="h-4 w-4" />
                  Copy Client Code
                </Button>
                <Button onClick={() => navigate(`client/${createdClientCode.toString()}`)} className="font-semibold">
                  View Client Profile
                </Button>
                <Button variant="outline" onClick={handleReset} className="font-semibold">
                  Onboard Another Client
                </Button>
                <Button variant="ghost" onClick={() => navigate('clients')} className="font-semibold">
                  Back to Clients
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show connecting state while backend is initializing
  if (isConnecting) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-2">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <div>
                <h2 className="text-xl font-bold mb-2">Connecting...</h2>
                <p className="text-muted-foreground">
                  Preparing the app, please wait a moment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine if we can proceed to next step
  const canGoNext = currentStep === 0 
    ? formData.name.trim() !== '' && isValidMobileNumber(formData.mobileNumber)
    : currentStep === 1
    ? formData.planDurationValue > 0
    : true;

  const canGoBack = currentStep > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1>Onboard New Client</h1>
        <p className="text-muted-foreground mt-2">Add a new client to your fitness program</p>
      </div>

      <OnboardingWizard
        steps={wizardSteps}
        currentStep={currentStep}
        onNext={handleNext}
        onBack={handleBack}
        onSubmit={handleSubmit}
        canGoNext={canGoNext}
        canGoBack={canGoBack}
        isSubmitting={createClient.isPending}
        isDisabled={!canInteract}
      >
        {/* Step 1: Basic Information */}
        {currentStep === 0 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="name" className="font-semibold">
                Client Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter client's full name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (fieldErrors.name) {
                    setFieldErrors({ ...fieldErrors, name: null });
                  }
                }}
                disabled={!canInteract}
                className={fieldErrors.name ? 'border-destructive' : ''}
              />
              {fieldErrors.name && (
                <p className="text-sm text-destructive font-medium">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNumber" className="font-semibold">
                Mobile Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mobileNumber"
                type="tel"
                placeholder="e.g., +1 234 567 8900 or 1234567890"
                value={formData.mobileNumber}
                onChange={(e) => {
                  setFormData({ ...formData, mobileNumber: e.target.value });
                  if (fieldErrors.mobileNumber) {
                    setFieldErrors({ ...fieldErrors, mobileNumber: null });
                  }
                }}
                disabled={!canInteract}
                className={fieldErrors.mobileNumber ? 'border-destructive' : ''}
              />
              {fieldErrors.mobileNumber ? (
                <p className="text-sm text-destructive font-medium">{fieldErrors.mobileNumber}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Enter the client's mobile number in any format
                </p>
              )}
            </div>
          </>
        )}

        {/* Step 2: Plan Subscription */}
        {currentStep === 1 && (
          <PlanSubscriptionSection
            planDurationValue={formData.planDurationValue}
            planDurationUnit={formData.planDurationUnit}
            extraDays={formData.extraDays}
            onPlanDurationValueChange={(value) => {
              setFormData({ ...formData, planDurationValue: value });
              if (fieldErrors.planDuration) {
                setFieldErrors({ ...fieldErrors, planDuration: null });
              }
            }}
            onPlanDurationUnitChange={(unit) => setFormData({ ...formData, planDurationUnit: unit })}
            onExtraDaysChange={(value) => setFormData({ ...formData, extraDays: value })}
            disabled={!canInteract}
          />
        )}

        {/* Step 3: Status & Notes */}
        {currentStep === 2 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="onboardingState" className="font-semibold">
                Onboarding Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.onboardingState}
                onValueChange={(value) =>
                  setFormData({ ...formData, onboardingState: value as OnboardingState })
                }
                disabled={!canInteract}
              >
                <SelectTrigger id="onboardingState">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {onboardingStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="py-1">
                        <div className="font-semibold">{option.label}</div>
                        <div className="text-xs text-muted-foreground max-w-xs">
                          {option.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <OnboardingStatusHelp />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="font-semibold">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about the client..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={!canInteract}
                rows={6}
              />
              <p className="text-sm text-muted-foreground">
                Include any relevant information about the client's goals, preferences, or special considerations
              </p>
            </div>
          </>
        )}

        {/* Step 4: Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="rounded-lg border-2 bg-card p-6 space-y-4">
              <h3 className="font-bold text-xl">Review Client Information</h3>
              
              <div className="grid gap-4">
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Client Name</p>
                  <p className="font-semibold text-lg">{formData.name}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Mobile Number</p>
                  <p className="font-semibold text-lg">{formData.mobileNumber}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Plan Duration</p>
                  <p className="font-semibold text-lg">
                    {getTotalPlanDays()} days
                    {formData.planDurationUnit === 'months' && (
                      <span className="text-sm text-muted-foreground font-normal ml-2">
                        ({formData.planDurationValue} {formData.planDurationValue === 1 ? 'month' : 'months'})
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Extra Days</p>
                  <p className="font-semibold text-lg">{formData.extraDays} days</p>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground font-semibold">Total Plan Duration</p>
                  <p className="font-bold text-xl text-primary">{getTotalPlanDays() + formData.extraDays} days</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Onboarding Status</p>
                  <p className="font-semibold text-lg">
                    {onboardingStatusOptions.find((o) => o.value === formData.onboardingState)?.label}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {onboardingStatusOptions.find((o) => o.value === formData.onboardingState)?.description}
                  </p>
                </div>

                {formData.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold">Notes</p>
                    <p className="font-medium whitespace-pre-wrap">{formData.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-medium">
                <strong>Next steps:</strong> After creating this client, you can activate them to set a follow-up day and start their plan. 
                {formData.onboardingState === OnboardingState.half && (
                  <span className="text-muted-foreground"> Note: This client will need to complete full onboarding before activation.</span>
                )}
              </p>
            </div>
          </div>
        )}
      </OnboardingWizard>

      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={() => navigate('clients')}
          disabled={!canInteract}
          className="font-semibold"
        >
          Cancel & Return to Clients
        </Button>
      </div>
    </div>
  );
}
