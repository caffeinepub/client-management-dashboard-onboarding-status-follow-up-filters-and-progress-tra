import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle } from 'lucide-react';

interface FollowUpPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (done: boolean, notes: string) => void;
  isLoading: boolean;
  mode?: 'automatic' | 'manual';
}

export function FollowUpPromptDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  mode = 'automatic',
}: FollowUpPromptDialogProps) {
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  const isManualMode = mode === 'manual';

  const handleSubmit = (done: boolean) => {
    // Validate notes for manual mode when marking as done
    if (isManualMode && done && notes.trim() === '') {
      setValidationError('Please enter follow-up notes before marking as done');
      return;
    }

    onSubmit(done, notes);
    setNotes('');
    setValidationError('');
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    // Clear validation error when user starts typing
    if (validationError && value.trim() !== '') {
      setValidationError('');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNotes('');
      setValidationError('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isManualMode ? 'Mark Follow-up as Done' : 'Follow-up Check'}
          </DialogTitle>
          <DialogDescription>
            {isManualMode
              ? 'Please provide notes about the follow-up before marking it as done.'
              : 'Is the follow-up done for this client?'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="followup-notes">
              Follow-up notes {isManualMode && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="followup-notes"
              placeholder="What was discussed during the follow-up..."
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={4}
              disabled={isLoading}
              className={validationError ? 'border-destructive' : ''}
            />
            {validationError ? (
              <p className="text-xs text-destructive">{validationError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {isManualMode
                  ? 'Required: Add notes about what was discussed'
                  : 'Optional: Add notes about what was discussed'}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!isManualMode && (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  Recording...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Not done
                </>
              )}
            </Button>
          )}
          <Button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Recording...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {isManualMode ? 'Mark as Done' : 'Yes, mark as done'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
