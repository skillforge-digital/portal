# Announcements Index Fix + Staff Activity Logs (Portal Only)

Date: 2026-04-28

## Objectives

- Fix Director “Global Announcements” failing with `The query requires an index` without requiring manual Firebase Console index creation.
- Create an auditable activity trail:
  - Global staff activity log (all units)
  - Per-unit activity logs (Director, HOD, Specialist, Marketing, Support)
- Log only data-changing events (no page views) to keep volume controlled.

## Problem: Announcement Query Requires Composite Index

Current Director announcements query orders by two fields:

- `priority desc`
- `timestamp desc`

Firestore requires a composite index for multi-field ordering, so it throws an error on environments where the index hasn’t been created.

### Design Decision

Avoid composite indexes entirely:

- Fetch announcements ordered only by `timestamp desc` with a reasonable limit (e.g., 50–200).
- Sort client-side by `(priority desc, timestamp desc)` for display.

Trade-off:

- Requires pulling a bounded set of recent documents, but avoids operational dependency on Firestore index setup.

## Staff Activity Logging

### Audience / Visibility

- Global log is visible to all staff dashboards (because we will also provide per-unit logs).
- Per-unit logs are visible to staff dashboards within each unit.

### What Counts as an “Activity”

Data changes only:

- Announcements create/update/delete
- Staff approvals / status changes
- Role assignments/removals
- System config toggles (maintenance, XP boost, etc.)
- Season lifecycle actions (create/archive/restore)
- Registry edits or destructive actions (e.g., wipes/restores)
- Customize “commit/save” events (theme changes)

Out of scope:

- Page views, tab opens, reads-only interactions

## Data Model

### Global Log

Collection: `staff_activity_global`

Document fields:

- `timestamp`: serverTimestamp
- `action`: string (e.g. `ANNOUNCEMENT_CREATE`, `ROLE_ASSIGN`)
- `scope`: string (`global | director | hod | specialist | marketing | support`)
- `details`: string (human readable)
- `actorUid`: string
- `actorName`: string
- `actorRole`: string (primaryRole when available)
- `targetUid`: string (optional)
- `targetType`: string (optional; `trainee | staff | system`)

Query pattern:

- `orderBy('timestamp', 'desc')`
- `limit(N)`

No composite index required.

### Per-Unit Logs

Subcollections:

- `staff_activity_units/director/entries`
- `staff_activity_units/hod/entries`
- `staff_activity_units/specialist/entries`
- `staff_activity_units/marketing/entries`
- `staff_activity_units/support/entries`

Each entry has the same field shape as global log.

Query pattern:

- `orderBy('timestamp', 'desc')`
- `limit(N)`

No composite index required.

## Write Strategy (Dual-Write)

On every staff activity:

1. Write to `staff_activity_global`
2. Write to the unit subcollection derived from `scope`

If scope is `global`, also write to a unit log:

- For global actions performed by a specific unit, use the actor’s primary role mapping.
- For truly global system actions, use `scope='global'` and write only to global log.

## Implementation Touchpoints

### Announcement System

- Keep existing `announcements` writes.
- Update dashboard “history” reads to avoid `orderBy(priority)` in Firestore query:
  - Query by `timestamp desc`
  - Sort client-side for display

### Logging API

Add a shared logging helper for staff actions (one importable module) that:

- Accepts `{ action, details, scope, targetUid?, targetType? }`
- Enriches with actor identity (uid/name/primaryRole)
- Dual-writes to global + unit logs
- Fails safely (never blocks core UI action if logging fails)

### UI Integration

- Director dashboard:
  - Add “Global Staff Log” tab (reads `staff_activity_global`)
  - Add “Unit Log” filter switch (reads `staff_activity_units/<unit>/entries`)
- Each unit dashboard:
  - Add “Unit Log” tab (reads its own unit collection)
  - Optional: link to Global log tab

## Security / Rules Considerations

- Reads:
  - Allow read for authenticated staff (consistent with current `audit_logs` posture).
- Writes:
  - Allow create for authenticated staff (or via existing permissive create rules, if used).
- No updates/deletes required (append-only logs).

## Acceptance Criteria

- Director announcements page never triggers “requires an index”.
- Global log shows all staff actions across units, ordered by timestamp.
- Unit logs show relevant actions scoped to that unit.
- Logging does not break primary workflows if Firestore is temporarily offline.

