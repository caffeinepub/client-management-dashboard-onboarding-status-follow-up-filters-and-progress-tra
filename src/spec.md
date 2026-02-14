# Specification

## Summary
**Goal:** Add follow-up status prompting and follow-up notes/history tracking to each client profile.

**Planned changes:**
- Extend the backend client data model to persist per-client follow-up history entries (date/timestamp, done flag, notes) and include these fields in client fetch responses.
- Add an authorized backend API method to record a follow-up outcome (done vs not done) with optional notes, with clear errors for missing client codes or unauthorized callers, and a safe migration for existing data.
- Update the Client Profile page to include a new “Follow-up” section showing the latest follow-up status with clear color styling (green “Done”, red “Not done”) plus a history/table that includes a “Notes” column.
- Add an automatic modal prompt on profile open when a follow-up is due (and the client has a follow-up day configured) to ask “Is the follow-up done?” and allow entering/saving follow-up notes; update UI immediately after submission via appropriate React Query invalidation/refetch.

**User-visible outcome:** When viewing a client profile, users see a Follow-up section with current status and a notes/history table; if a follow-up is due, an automatic prompt appears to mark it done or not done and save notes, and the status/notes update right away.
