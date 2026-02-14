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

export function OnboardClientPage() {
  const { navigate } = useRouter();
  const createClient = useCreateClient();

  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    notes: '',
    onboardingState: OnboardingState.half,
  });

  const [createdClientCode, setCreatedClientCode] = useState<bigint | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter client name');
      return;
    }

    if (!formData.mobileNumber.trim()) {
      toast.error('Please enter mobile number');
      return;
    }

    try {
      const clientCode = await createClient.mutateAsync({
        name: formData.name.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        notes: formData.notes.trim(),
        onboardingState: formData.onboardingState,
      });

      setCreatedClientCode(clientCode);
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
    });
    setCreatedClientCode(null);
  };

  if (createdClientCode !== null) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6">
              <div className="h-16 w-16 rounded-full bg-green-600/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Client Onboarded Successfully!</h2>
                <p className="text-muted-foreground">
                  Client code: <span className="font-semibold">{formatClientCode(createdClientCode.toString())}</span>
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-4">
                <Button onClick={() => navigate(`client/${createdClientCode.toString()}`)}>
                  View Client Profile
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Onboard Another Client
                </Button>
                <Button variant="ghost" onClick={() => navigate('clients')}>
                  Back to Clients
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
        <p className="text-muted-foreground mt-1">Add a new client to your fitness program</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Client Information
            </CardTitle>
            <CardDescription>
              Enter the client's basic information and onboarding status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Client Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter client's full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={createClient.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">
                    Mobile Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    placeholder="Enter mobile number"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    disabled={createClient.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onboardingState">
                    Onboarding Status <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.onboardingState}
                    onValueChange={(value) =>
                      setFormData({ ...formData, onboardingState: value as OnboardingState })
                    }
                    disabled={createClient.isPending}
                  >
                    <SelectTrigger id="onboardingState">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {onboardingStates.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          <div>
                            <div className="font-medium">{state.label}</div>
                            <div className="text-xs text-muted-foreground">{state.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Note: Activation is required to set the follow-up day and start the plan
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes about the client..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={createClient.isPending}
                    rows={4}
                  />
                </div>
              </div>
            </ScrollArea>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={createClient.isPending || !formData.name.trim() || !formData.mobileNumber.trim()}
                className="flex-1"
              >
                {createClient.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  'Create Client'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('clients')}
                disabled={createClient.isPending}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
