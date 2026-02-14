import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { FollowUpDay } from '../../backend';

interface ActivateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (startDate: Date, followUpDay: FollowUpDay) => void;
  isLoading?: boolean;
}

const followUpDays: { value: FollowUpDay; label: string }[] = [
  { value: FollowUpDay.monday, label: 'Monday' },
  { value: FollowUpDay.tuesday, label: 'Tuesday' },
  { value: FollowUpDay.wednesday, label: 'Wednesday' },
  { value: FollowUpDay.thursday, label: 'Thursday' },
  { value: FollowUpDay.friday, label: 'Friday' },
  { value: FollowUpDay.saturday, label: 'Saturday' },
  { value: FollowUpDay.sunday, label: 'Sunday' },
];

export function ActivateClientDialog({ open, onOpenChange, onConfirm, isLoading }: ActivateClientDialogProps) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpDay, setFollowUpDay] = useState<FollowUpDay>(FollowUpDay.monday);
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!startDate) {
      setError('Please select a start date');
      return;
    }

    const selectedDate = new Date(startDate);
    if (isNaN(selectedDate.getTime())) {
      setError('Invalid date selected');
      return;
    }

    if (!followUpDay) {
      setError('Please select a follow-up day');
      return;
    }

    setError('');
    onConfirm(selectedDate, followUpDay);
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
            Activate Client Plan
          </DialogTitle>
          <DialogDescription>
            Select the start date and follow-up day for this client's plan. The end date will be calculated automatically based on the plan duration.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">
              Plan Start Date <span className="text-destructive">*</span>
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
          <div className="space-y-2">
            <Label htmlFor="followUpDay">
              Follow-up Day <span className="text-destructive">*</span>
            </Label>
            <Select
              value={followUpDay}
              onValueChange={(value) => {
                setFollowUpDay(value as FollowUpDay);
                setError('');
              }}
              disabled={isLoading}
            >
              <SelectTrigger id="followUpDay">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {followUpDays.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This client will appear in the dashboard on the selected day
            </p>
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
            disabled={isLoading || !startDate || !followUpDay}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Activating...
              </>
            ) : (
              'Activate Client'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
