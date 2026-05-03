# Specialist Tracks & Trainee Activity (No Re-registration) — Design

Date: 2026-05-03

## Goal

1) Specialists can see the number of trainees they are responsible for.
2) Specialists can track recent trainee activity for their assigned tracks.
3) Works for already-registered staff (no staff re-registration required).

## Constraints

- Firestore rules require staff status to be `active` to list trainees.
- No backend required; all reads are via Firestore client SDK.
- Presence/telemetry collections are currently publicly readable/writable (existing rule).

## Data Model

### Staff document (`staffs/{uid}`)

Add an optional field for Specialists:

- `tracks: string[]` — track names exactly matching trainee `track` field values.

Compatibility behavior:
- If `tracks` is missing or empty for a Specialist:
  - Auto-fill tracks from the staff `department` using StaffCore’s `DEPARTARTMENTS[department].tracks`.
  - Show a setup UI prompting the Specialist to confirm/edit and save.

### Trainee document (`trainees/{uid}`)

Existing fields used:
- `track: string`
- `name: string`
- `email: string` (optional)
- `sfid: string` (optional)

### Presence document (`presence/{uid}`)

Enhance the existing write to include:
- `track: string` — trainee track name (copied from registryState).
- `name: string` — trainee name (copied from registryState).

This enables staff dashboards to filter activity by track without requiring extra joins.

## UX Changes

### Specialist dashboard

- Add a “My Tracks” control (modal or inline panel):
  - Multi-select checklist of the 10 official tracks
  - Default selection auto-populated from unit tracks when missing
  - Save writes `tracks` to `staffs/{uid}` (only for Specialist accounts)

- Update “Assigned Path Trainees”:
  - Count trainees only where `track in profile.tracks`

- Update “Recent Path Activity”:
  - Query presence entries filtered by `track in profile.tracks`, ordered by `lastSeen` desc.
  - Render list showing: trainee name, track, lastSeen timestamp, engagementScore.

## Acceptance Criteria

- A Specialist with `tracks` sees non-zero trainee counts when trainees exist for those tracks.
- If a Specialist has no saved tracks, the dashboard auto-populates from unit tracks and prompts to save.
- “Recent Path Activity” shows active trainees for Specialist tracks (based on presence writes).
- No changes required to existing staff registration records.

