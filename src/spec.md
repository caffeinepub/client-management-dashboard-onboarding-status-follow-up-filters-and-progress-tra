# Specification

## Summary
**Goal:** Let users manually mark a client follow-up as done from the Client Profile’s Follow-up Status card.

**Planned changes:**
- Add a clear “Mark follow-up done” action button to the Follow-up Status UI on the Client Profile page (for activated clients with a configured follow-up day).
- On click, trigger the existing follow-up recording flow to create a follow-up entry with status = done, then update the Follow-up Status UI to reflect Done.
- Ensure the new “done” entry appears at the top of the Follow-up History table with the current timestamp and correct follow-up day.
- Add a disabled + loading state while the follow-up record mutation is in progress, and show a user-facing error toast on failure using existing error/toast patterns.

**User-visible outcome:** From a client’s profile, the user can click a button to immediately mark the follow-up as done and see the status and history update right away.
