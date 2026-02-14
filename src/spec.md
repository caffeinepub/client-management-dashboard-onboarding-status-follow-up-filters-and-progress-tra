# Specification

## Summary
**Goal:** Add a user-toggleable dark mode and refresh the app’s visual theme with bolder colors, clearer typography hierarchy, and a more cohesive modern layout.

**Planned changes:**
- Add a theme toggle (Light / Dark / System) in the authenticated app UI and wire it to the existing class-based theme switching so it applies across all main pages and persists across refresh.
- Update global theme color tokens for both light and dark modes to a more vivid, high-contrast palette (including primary/secondary/accent/muted/border/ring and chart colors) and ensure components use semantic tokens rather than hard-coded colors.
- Establish consistent heading styles (page titles and section headings) via shared/global typography defaults, and apply improved spacing/alignment rhythm across key screens and layout elements.
- Apply one coherent, professional “bold” visual direction across navigation, surfaces (background/card/popover), and interactive states (hover/active/focus) without changing app functionality.

**User-visible outcome:** Users can switch between Light, Dark, and System themes at runtime (with their choice remembered), and the app UI appears more modern and bold with clearer headings, improved spacing, and consistent styling across pages.
