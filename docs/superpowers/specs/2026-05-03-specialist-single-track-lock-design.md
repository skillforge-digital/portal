# Specialist Single-Track Lock (Choose Once) — Design

Date: 2026-05-03

## Goal

Each Specialist should be responsible for exactly one track:

- The Specialist can choose their track once.
- After confirmation, the assignment is locked (read-only).
- Director can override/reset (manual Firestore edit for now).

This must work for already-registered Specialists and for legacy profiles.

## Data Model

### Staff identity sources

Specialists may exist as:

- `staffs/{uid}` (preferred modern profile)
- `specialists/{uid}` (legacy)

### Assignment fields

- `assignedTrack: string` — single selected track (canonical)

Compatibility:
- If `assignedTrack` is missing but `tracks: string[]` exists:
  - If `tracks.length === 1`, auto-migrate in-memory to `assignedTrack = tracks[0]`.
  - If `tracks.length > 1`, require the Specialist to pick one track and lock it.

Write target:
- If `staffs/{uid}` exists → write `assignedTrack` there.
- Else → write `assignedTrack` to `specialists/{uid}`.

## UX

In Specialist dashboard “My Tracks” modal:

- If `assignedTrack` exists:
  - Show it as selected.
  - Disable changes (read-only).
  - Show note: “Track assignment locked. Contact Director to change.”

- If `assignedTrack` missing:
  - Show track options as radio buttons (single-select).
  - Confirmation button: “Confirm Track”
  - On confirm:
    - Save `assignedTrack` to correct profile document
    - Lock UI immediately

Default selection when missing:
- If `tracks` had one entry, preselect it.
- Else if department maps to multiple tracks, preselect first mapped track but allow change before confirm.

## Data Use

- Trainee counts use `assignedTrack` only.
- Recent activity filters to `assignedTrack` only.

## Acceptance Criteria

- Specialist can pick exactly one track and cannot change it after confirming.
- Specialist metrics (count + activity) filter to the assigned track.
- Works for both `staffs/{uid}` and legacy `specialists/{uid}` profiles.

