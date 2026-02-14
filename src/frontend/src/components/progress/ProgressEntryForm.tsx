import { useState } from 'react';
import { useAddProgress } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ProgressEntryFormProps {
  clientCode: bigint;
}

export function ProgressEntryForm({ clientCode }: ProgressEntryFormProps) {
  const [weightKg, setWeightKg] = useState('');
  const [neckInch, setNeckInch] = useState('');
  const [chestInch, setChestInch] = useState('');
  const [waistInch, setWaistInch] = useState('');
  const [hipsInch, setHipsInch] = useState('');
  const [thighInch, setThighInch] = useState('');

  const addProgress = useAddProgress();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!weightKg || !neckInch || !chestInch || !waistInch || !hipsInch || !thighInch) {
      toast.error('Please fill in all measurements');
      return;
    }

    try {
      await addProgress.mutateAsync({
        clientCode,
        weightKg: parseFloat(weightKg),
        neckInch: parseFloat(neckInch),
        chestInch: parseFloat(chestInch),
        waistInch: parseFloat(waistInch),
        hipsInch: parseFloat(hipsInch),
        thighInch: parseFloat(thighInch),
      });

      toast.success('Progress recorded successfully!');
      
      // Reset form
      setWeightKg('');
      setNeckInch('');
      setChestInch('');
      setWaistInch('');
      setHipsInch('');
      setThighInch('');
    } catch (error) {
      toast.error('Failed to record progress. Please try again.');
      console.error('Progress entry error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="weight">
            Weight (kg) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            placeholder="e.g., 75.5"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            disabled={addProgress.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="neck">
            Neck (inches) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="neck"
            type="number"
            step="0.1"
            placeholder="e.g., 14.5"
            value={neckInch}
            onChange={(e) => setNeckInch(e.target.value)}
            disabled={addProgress.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="chest">
            Chest (inches) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="chest"
            type="number"
            step="0.1"
            placeholder="e.g., 38.0"
            value={chestInch}
            onChange={(e) => setChestInch(e.target.value)}
            disabled={addProgress.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="waist">
            Waist (inches) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="waist"
            type="number"
            step="0.1"
            placeholder="e.g., 32.0"
            value={waistInch}
            onChange={(e) => setWaistInch(e.target.value)}
            disabled={addProgress.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hips">
            Hips (inches) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="hips"
            type="number"
            step="0.1"
            placeholder="e.g., 36.0"
            value={hipsInch}
            onChange={(e) => setHipsInch(e.target.value)}
            disabled={addProgress.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="thigh">
            Thigh (inches) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="thigh"
            type="number"
            step="0.1"
            placeholder="e.g., 22.0"
            value={thighInch}
            onChange={(e) => setThighInch(e.target.value)}
            disabled={addProgress.isPending}
          />
        </div>
      </div>

      <Button type="submit" disabled={addProgress.isPending} className="w-full">
        {addProgress.isPending ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Recording Progress...
          </>
        ) : (
          'Record Progress'
        )}
      </Button>
    </form>
  );
}
