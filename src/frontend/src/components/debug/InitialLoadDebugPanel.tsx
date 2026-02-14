import { useEffect, useState } from 'react';
import { timings } from '@/utils/initialLoadTimings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimingEvent {
  label: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

export function InitialLoadDebugPanel() {
  const [visible, setVisible] = useState(false);
  const [events, setEvents] = useState<TimingEvent[]>([]);

  useEffect(() => {
    // Only show if debug flag is present
    if (!timings.isDebugEnabled()) return;

    setVisible(true);

    // Poll for timing updates
    const interval = setInterval(() => {
      setEvents(timings.getEvents());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  const completedEvents = events.filter(e => e.duration !== undefined);
  const totalDuration = completedEvents.reduce((sum, e) => sum + (e.duration || 0), 0);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Load Performance</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{totalDuration.toFixed(0)}ms</span>
            </div>
            <div className="space-y-1">
              {completedEvents.map((event, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{event.label}</span>
                  <span className="font-mono">{event.duration?.toFixed(0)}ms</span>
                </div>
              ))}
              {events.filter(e => !e.duration).map((event, idx) => (
                <div key={`pending-${idx}`} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{event.label}</span>
                  <span className="font-mono text-yellow-600">pending...</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
