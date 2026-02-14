import { useState } from 'react';
import { useCreateClient } from '../hooks/useQueries';
import { useRouter } from '../hooks/useRouter';
import { OnboardingState } from '../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { computeTotalPlanDays } from '../utils/plan';
import { formatClientCode } from '../utils/clientCode';
import { normalizeError } from '../utils/errors';

const onboardingStates: { value: OnboardingState; label: string; description: string }[] = [
  { 
    value: OnboardingState.half, 
    label: 'Half Onboarded',
    description: 'Client has partially completed onboarding'
  },
  { 
    value: OnboardingState.full, 
    label: 'Full Onboarded',
    description: 'Client has completed the entire onboarding process'
  },
];

const monthPresets = [1, 2, 3, 6, 9, 12];

export function OnboardClientPage() {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [additionalDays, setAdditionalDays] = useState('0');
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(OnboardingState.half);
  const [notes, setNotes] = useState('');
  const [createdClientCode, setCreatedClientCode] = useState<string | null>(null);

  const createClient = useCreateClient();
  const { navigate } = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter client name');
      return;
    }
    if (!mobileNumber.trim()) {
      toast.error('Please enter mobile number');
      return;
    }

    const additionalDaysNum = parseInt(additionalDays) || 0;
    if (additionalDaysNum < 0) {
      toast.error('Additional days cannot be negative');
      return;
    }

    try {
      const totalDays = computeTotalPlanDays(selectedMonths, additionalDaysNum);
      
      const clientCode = await createClient.mutateAsync({
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        planDurationDays: BigInt(totalDays),
        notes: notes.trim(),
        initialOnboardingState: onboardingState,
      });

      setCreatedClientCode(clientCode.toString());
      toast.success('Client onboarded successfully!');
    } catch (error) {
      toast.error(normalizeError(error));
      console.error('Client creation error:', error);
    }
  };

  const handleReset = () => {
    setName('');
    setMobileNumber('');
    setSelectedMonths(1);
    setAdditionalDays('0');
    setOnboardingState(OnboardingState.half);
    setNotes('');
    setCreatedClientCode(null);
  };

  const totalDays = computeTotalPlanDays(selectedMonths, parseInt(additionalDays) || 0);

  if (createdClientCode) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-primary/20">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Client Onboarded Successfully!</h2>
                <p className="text-muted-foreground">
                  The client has been added to your system with the following code:
                </p>
              </div>
              <div className="bg-accent/50 rounded-lg p-6 border-2 border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Client Code</p>
                <p className="text-4xl font-bold text-primary">{formatClientCode(createdClientCode)}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
                <p className="text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> You'll need to activate this client and set their follow-up day before they appear in the dashboard.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-4">
                <Button onClick={() => navigate(`client/${createdClientCode}`)}>
                  View Client Profile
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Add Another Client
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Onboard New Client</h1>
        <p className="text-muted-foreground mt-1">Add a new client to your management system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Client Information
          </CardTitle>
          <CardDescription>
            Fill in the details below. A unique client code will be generated automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Client Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={createClient.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">
                  Mobile Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  disabled={createClient.isPending}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="onboardingState">
                  Onboarding Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={onboardingState}
                  onValueChange={(value) => setOnboardingState(value as OnboardingState)}
                  disabled={createClient.isPending}
                >
                  <SelectTrigger id="onboardingState">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {onboardingStates.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{state.label}</span>
                          <span className="text-xs text-muted-foreground">{state.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Note: Onboarded clients are not counted as Active until you activate their plan
                </p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>
                  Plan Duration <span className="text-destructive">*</span>
                </Label>
                <ScrollArea className="w-full">
                  <div className="flex gap-2 pb-2">
                    {monthPresets.map((months) => (
                      <Button
                        key={months}
                        type="button"
                        variant={selectedMonths === months ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedMonths(months)}
                        disabled={createClient.isPending}
                        className="whitespace-nowrap"
                      >
                        {months} {months === 1 ? 'Month' : 'Months'}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalDays">Additional Days</Label>
                <Input
                  id="additionalDays"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={additionalDays}
                  onChange={(e) => setAdditionalDays(e.target.value)}
                  disabled={createClient.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label>Total Duration</Label>
                <Input
                  type="text"
                  value={`${totalDays} days`}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about the client..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={createClient.isPending}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createClient.isPending} className="flex-1">
                {createClient.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating Client...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Onboard Client
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={createClient.isPending}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
