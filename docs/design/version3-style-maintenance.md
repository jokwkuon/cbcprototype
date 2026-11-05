# Version 3 style and component maintenance — REQ-001/002/005/008

The root layout loads `globals.css` (base/layout/forms), `relationships.css` (relationship workspace) and `visual-system.css` (final CBC theme/component treatment), in that order. Keep this order explicit. Add shared tokens in the final theme and domain workspace behavior in its module sheet. Status colors use explicit domain maps; no regex-based financial/status guessing.

This increment removes 86 earlier unconditional declarations only where a later unconditional rule has the identical selector/property and equal or stronger importance. It does not rewrite conditional rules, custom properties, compound-selector matching, typography choices or semantic maps. This reduces overrides while preserving the existing cascade. Unnecessary global `!important` rules and shorthand/longhand conflicts require a separate reviewed cleanup; they were not blindly stripped.

Shared `HistorySectionFeed` and `FollowUpList` now serve both full record and split workspaces. The database helper owns scoped sorting/counts/keyset rules; the client owns pagination/loading/retry and explicit live-count wording. Record form validation links a summary to field IDs and associates inline errors with all input types. Workspace search checks cancellation after decoding before changing results.

Verification must include existing contrast tests, full synthetic and real browser workflows, desktop/mobile captures, keyboard navigation and overflow. Screenshots remain private fictional artifacts. Remote form selectors, all-report SQL aggregation and narrower invalidation remain follow-on work; this increment does not claim those scale limits are solved.
