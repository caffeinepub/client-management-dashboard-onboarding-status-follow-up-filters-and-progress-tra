import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface PlanSubscriptionSectionProps {
  planDurationValue: number;
  planDurationUnit: 'days' | 'months';
  extraDays: number;
  onPlanDurationValueChange: (value: number) => void;
  onPlanDurationUnitChange: (unit: 'days' | 'months') => void;
  onExtraDaysChange: (value: number) => void;
  disabled?: boolean;
}

export function PlanSubscriptionSection({
  planDurationValue,
  planDurationUnit,
  extraDays,
  onPlanDurationValueChange,
  onPlanDurationUnitChange,
  onExtraDaysChange,
  disabled = false,
}: PlanSubscriptionSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-4">Plan Subscription Details</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Record the plan duration and any extra days included in the client's subscription.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="planDuration" className="font-semibold">
          Plan Duration <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-3">
          <Input
            id="planDuration"
            type="number"
            min="1"
            placeholder="Enter duration"
            value={planDurationValue || ''}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onPlanDurationValueChange(isNaN(val) ? 0 : Math.max(1, val));
            }}
            disabled={disabled}
            className="flex-1"
          />
          <Select
            value={planDurationUnit}
            onValueChange={(value) => onPlanDurationUnitChange(value as 'days' | 'months')}
            disabled={disabled}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="months">Months</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          {planDurationUnit === 'months' 
            ? 'Each month equals 30 days' 
            : 'Enter the total number of days'}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="extraDays" className="font-semibold">
          Extra Days (Optional)
        </Label>
        <Input
          id="extraDays"
          type="number"
          min="0"
          placeholder="0"
          value={extraDays || ''}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            onExtraDaysChange(isNaN(val) ? 0 : Math.max(0, val));
          }}
          disabled={disabled}
        />
        <p className="text-sm text-muted-foreground">
          Additional days added to the plan (e.g., promotional bonus days)
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          These details will be recorded with the client and can be viewed before activation. 
          The actual subscription will be created when you activate the client.
        </AlertDescription>
      </Alert>
    </div>
  );
}
