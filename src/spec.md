# Specification

## Summary
**Goal:** Stabilize the Onboard Client flow so it won’t submit while the app is still initializing, and ensure users never see the raw “Actor not available” error.

**Planned changes:**
- Gate the Onboard Client “Create Client” submission so it stays disabled (including Enter key submission) until the backend connection is fully ready.
- Add a stable, non-flickering loading/disabled state on the onboarding page with clear English copy that avoids internal technical terms (e.g., “Connecting…” / “Preparing the app…”).
- Normalize onboarding errors so any occurrence of “Actor not available” is replaced with a friendly English message and never shown verbatim in toasts or inline errors.

**User-visible outcome:** The onboarding form remains clearly disabled while the app is connecting, becomes usable automatically once ready, and users won’t see “Actor not available” during onboarding (including edge cases).
