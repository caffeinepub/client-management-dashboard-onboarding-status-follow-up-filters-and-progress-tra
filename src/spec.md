# Specification

## Summary
**Goal:** Fix persistent “Connecting… / Establishing connection to backend” slowness by stabilizing backend readiness polling, reducing unnecessary React Query refetch storms, and adding debug-only performance instrumentation to diagnose connection setup time.

**Planned changes:**
- Update frontend backend-readiness polling so it uses bounded exponential backoff, does not reset retry state due to rerenders/state changes, and correctly cleans up timers to prevent multiple concurrent polling loops.
- Ensure readiness polling stops after readiness is confirmed and does not restart on subsequent renders/navigation unless the authenticated identity/actor truly changes.
- Reduce unnecessary query invalidation/refetch storms related to actor creation/changes so backend calls are driven by enabled/active queries rather than unconditional global refetching.
- Add debug-flag-gated client-side timing instrumentation for actor creation, time-to-first successful readiness (isReady), and initial app data fetch, surfaced via the existing debug panel and/or console.

**User-visible outcome:** After signing in, the app reliably reaches the dashboard without getting stuck on the connecting screen, and normal navigation does not repeatedly feel like it is reconnecting; when the debug flag is enabled, the browser shows timing details for connection setup to help diagnose slowness.
