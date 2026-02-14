# Specification

## Summary
**Goal:** Reduce initial app load time by fetching only lightweight client data for initial screens and deferring full client details until needed.

**Planned changes:**
- Add a backend client-summary type and a new query that returns all client summaries for the current user, excluding heavy fields like progress/history arrays while keeping existing client endpoints unchanged.
- Update the frontend React Query layer to fetch/cache client summaries for initial rendering on Dashboard and Clients list, and fetch full client details only when navigating to an individual Client Profile.
- Remove or narrowly scope any startup-wide “refetch all queries” behavior tied to actor/identity initialization so queries run only when the relevant pages/hooks mount.
- Keep client export working from the filtered Clients list; if export needs fields beyond summaries, trigger an explicit on-demand fetch of full client data for export with an English loading state.

**User-visible outcome:** Dashboard and Clients list load faster with minimal client data first, client profiles still show full details when opened, and exporting the filtered client list continues to work (with a clear loading state if extra data must be fetched).
