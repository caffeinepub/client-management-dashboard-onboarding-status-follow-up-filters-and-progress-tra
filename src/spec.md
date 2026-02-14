# Specification

## Summary
**Goal:** Reduce the first-screen load time by identifying startup bottlenecks, preventing redundant refetching, improving time-to-first-render, and minimizing initial round trips.

**Planned changes:**
- Add timestamped instrumentation for initial-load steps (actor creation, access-control init, profile fetch, first client summaries fetch) surfaced in the browser console, with an optional hidden debug panel/toggle.
- Adjust startup invalidation/refetch behavior so actor availability does not trigger redundant query refetch storms (profile and summaries run at most once on initial authenticated load).
- Update authenticated app gating so the app shell renders quickly and shows an in-content English loading state while profile loads, plus a non-technical error + Retry action on failure.
- Add a backend query method that returns the minimal first-screen payload in one call (e.g., caller profile + needed dashboard client summaries) and update the frontend initial dashboard load to use it.
- Tune React Query caching (`staleTime`/`gcTime`) for profile and summaries to avoid unnecessary refetching during the first minute unless identity changes or explicit invalidation occurs.

**User-visible outcome:** After authentication, the app layout appears quickly with clear English loading/error states, and the initial dashboard data loads with fewer calls and fewer redundant refetches, improving first-screen responsiveness.
