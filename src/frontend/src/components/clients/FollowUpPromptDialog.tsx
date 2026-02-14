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
}

export function FollowUpPromptDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: FollowUpPromptDialogProps) {
  const [notes, setNotes] = useState('');

  const handleSubmit = (done: boolean) => {
    onSubmit(done, notes);
    setNotes(''); // Reset notes after submission
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Follow-up Check</DialogTitle>
          <DialogDescription>
            Is the follow-up done for this client?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="followup-notes">Follow-up notes</Label>
            <Textarea
              id="followup-notes"
              placeholder="What was discussed during the follow-up..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Optional: Add notes about what was discussed
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
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
                Yes, mark as done
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
