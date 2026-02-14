import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { computeTotalPlanDays } from '@/utils/plan';

interface RenewSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (planDurationDays: number, extraDays: number, startDate: Date) => void;
  isLoading?: boolean;
}

export function RenewSubscriptionDialog({ open, onOpenChange, onConfirm, isLoading }: RenewSubscriptionDialogProps) {
  const [months, setMonths] = useState('1');
  const [extraDays, setExtraDays] = useState('0');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const handleConfirm = () => {
    // Validate months
    const monthCount = parseInt(months, 10);
    if (isNaN(monthCount) || monthCount < 1) {
      setError('Please select a valid number of months');
      return;
    }

    // Validate extra days
    const extra = parseInt(extraDays, 10);
    if (isNaN(extra) || extra < 0) {
      setError('Extra days must be a non-negative number');
      return;
    }

    // Validate start date
    if (!startDate) {
      setError('Please select a start date');
      return;
    }

    const selectedDate = new Date(startDate);
    if (isNaN(selectedDate.getTime())) {
      setError('Invalid date selected');
      return;
    }

    // Convert months to days using the shared utility (30 days per month)
    const planDurationDays = computeTotalPlanDays(monthCount, 0);

    setError('');
    onConfirm(planDurationDays, extra, selectedDate);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      setError('');
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Renew Subscription
          </DialogTitle>
          <DialogDescription>
            Create a new subscription for this client by selecting the plan duration and start date.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="months">
              Plan Duration (months) <span className="text-destructive">*</span>
            </Label>
            <Select
              value={months}
              onValueChange={(value) => {
                setMonths(value);
                setError('');
              }}
              disabled={isLoading}
            >
              <SelectTrigger id="months">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {month} {month === 1 ? 'month' : 'months'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Each month equals 30 days
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="extraDays">
              Extra Days
            </Label>
            <Input
              id="extraDays"
              type="number"
              min="0"
              value={extraDays}
              onChange={(e) => {
                setExtraDays(e.target.value);
                setError('');
              }}
              disabled={isLoading}
              placeholder="e.g., 0"
            />
            <p className="text-xs text-muted-foreground">
              Additional days beyond the selected months
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">
              Start Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setError('');
              }}
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !startDate || !months}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Creating...
              </>
            ) : (
              'Create Subscription'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
