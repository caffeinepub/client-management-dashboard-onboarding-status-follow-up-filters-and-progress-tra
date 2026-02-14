import { useState } from 'react';
import { useSaveCallerUserProfile } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function ProfileSetupDialog() {
  const [name, setName] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      toast.success('Profile created successfully!');
    } catch (error) {
      toast.error('Failed to create profile. Please try again.');
      console.error('Profile creation error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Welcome!</h2>
          <p className="text-muted-foreground">
            Let's set up your profile to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saveProfile.isPending}
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={saveProfile.isPending || !name.trim()}
          >
            {saveProfile.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Creating Profile...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
