/**
 * Lightweight timing utility for tracking initial load performance.
 * Captures labeled start/end timestamps and emits a consolidated console report.
 * Gated by debug URL parameter to minimize overhead in production.
 */

interface TimingEvent {
  label: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class InitialLoadTimings {
  private events: TimingEvent[] = [];
  private hasReported = false;
  private debugEnabled = false;

  constructor() {
    // Check for debug flag in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      this.debugEnabled = params.has('debug') || params.get('debug') === 'true';
    }
  }

  start(label: string) {
    if (!this.debugEnabled) return;
    
    const existing = this.events.find(e => e.label === label && !e.endTime);
    if (existing) return; // Already started
    
    this.events.push({
      label,
      startTime: performance.now(),
    });
  }

  end(label: string) {
    if (!this.debugEnabled) return;
    
    const event = this.events.find(e => e.label === label && !e.endTime);
    if (!event) return;
    
    event.endTime = performance.now();
    event.duration = event.endTime - event.startTime;
  }

  report() {
    if (!this.debugEnabled) return;
    if (this.hasReported) return;
    this.hasReported = true;

    const completedEvents = this.events.filter(e => e.duration !== undefined);
    if (completedEvents.length === 0) return;

    const totalDuration = completedEvents.reduce((sum, e) => sum + (e.duration || 0), 0);

    console.group('🚀 Initial Load Performance Report');
    console.log(`Total time: ${totalDuration.toFixed(2)}ms`);
    console.table(
      completedEvents.map(e => ({
        Step: e.label,
        'Duration (ms)': e.duration?.toFixed(2),
        'Start (ms)': e.startTime.toFixed(2),
      }))
    );
    console.groupEnd();
  }

  getEvents() {
    return [...this.events];
  }

  isDebugEnabled() {
    return this.debugEnabled;
  }
}

export const timings = new InitialLoadTimings();
