# Specification

## Summary
**Goal:** Capture and display plan subscription details during client onboarding, and ensure all client data is isolated per logged-in Internet Identity user.

**Planned changes:**
- Add a “Plan subscription” section to the client onboarding flow to record plan duration and extra days with clear English labels.
- Show the recorded plan duration and extra days on the onboarding Review & Confirm step and after client creation (e.g., success screen / initial client profile view for non-activated clients).
- Extend the backend client data model to persist onboarding-time plan duration and extra days, and return these fields in APIs used by onboarding client lists and client detail views (without changing activated subscription history behavior).
- Fix backend storage and queries to scope all client and related data to the authenticated principal, preventing cross-user access and avoiding client-code collisions across users.
- Update relevant frontend list/detail views (including onboarding client list dialogs and client profile views) to display onboarding plan duration and extra days for non-activated clients, with clear English empty states when missing.

**User-visible outcome:** Coaches can record a client’s purchased plan duration and extra days during onboarding and see those details in review, in onboarding client lists, and in the client view before activation; different logins only see their own clients and cannot access others’ data.
