import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pause } from 'lucide-react';

interface PauseClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (durationDays: number, reason: string) => void;
  isLoading?: boolean;
}

export function PauseClientDialog({ open, onOpenChange, onConfirm, isLoading }: PauseClientDialogProps) {
  const [durationDays, setDurationDays] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ duration?: string; reason?: string }>({});

  const handleConfirm = () => {
    const newErrors: { duration?: string; reason?: string } = {};

    if (!durationDays || durationDays.trim() === '') {
      newErrors.duration = 'Pause duration is required';
    } else {
      const days = parseInt(durationDays, 10);
      if (isNaN(days) || days < 1) {
        newErrors.duration = 'Duration must be at least 1 day';
      }
    }

    if (!reason || reason.trim() === '') {
      newErrors.reason = 'Reason for pause is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onConfirm(parseInt(durationDays, 10), reason.trim());
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      setErrors({});
      if (!newOpen) {
        setDurationDays('');
        setReason('');
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pause className="h-5 w-5 text-primary" />
            Pause Client Plan
          </DialogTitle>
          <DialogDescription>
            Specify how long you want to pause this client's plan and provide a reason. The plan end date will be extended accordingly when resumed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="durationDays">
              Pause Duration (days) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="durationDays"
              type="number"
              min="1"
              placeholder="e.g., 7"
              value={durationDays}
              onChange={(e) => {
                setDurationDays(e.target.value);
                setErrors((prev) => ({ ...prev, duration: undefined }));
              }}
              disabled={isLoading}
            />
            {errors.duration && <p className="text-sm text-destructive">{errors.duration}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Pause <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g., Medical leave, vacation, etc."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrors((prev) => ({ ...prev, reason: undefined }));
              }}
              disabled={isLoading}
              rows={3}
            />
            {errors.reason && <p className="text-sm text-destructive">{errors.reason}</p>}
          </div>
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
            disabled={isLoading || !durationDays || !reason}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Pausing...
              </>
            ) : (
              'Pause Client'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
