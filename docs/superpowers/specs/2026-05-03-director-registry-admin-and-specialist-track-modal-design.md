# Director Registry Admin + Specialist Track Modal UX — Design

Date: 2026-05-03

## Goals

1) Fix Specialist Assigned Track modal UX so the Confirm button is always reachable on small screens.
2) Add Director “god mode” (Registry Admin) to manage trainees + staff:
   - Edit (all profile fields) and delete trainees
   - Edit and delete staff
   - Generate reset tickets for any user
3) Add a dedicated “Registry Logs” view for admin actions.

## Scope Notes / Constraints

- This is a frontend-only portal; profile edits do not update Firebase Auth account email/password (Admin SDK would be required for that). The admin tools operate on Firestore docs and reset tickets.
- Existing Firestore rules already allow Director to delete trainees/staff; we will extend rules for new `registry_admin_logs`.

## Specialist Assigned Track Modal UX

Problem:
- Modal content may exceed viewport height, while body scroll is disabled. The footer buttons can be off-screen on mobile.

Solution:
- Make the modal card scrollable (`max-height: 90vh; overflow-y: auto`).
- Make the footer action bar sticky at the bottom of the modal card.
- Keep Confirm disabled until a radio is selected.

Acceptance:
- On mobile, user can always reach “Confirm Track”.

## Director Registry Admin

Add new Director dashboard tab: `Registry Admin`.

### A) Trainee Management

- List trainees (paged / limited)
- Search by: name, email, sfid, uid, phone
- Actions:
  - Edit (all profile fields in trainee doc)
  - Delete trainee (requires arm/double-confirm)
  - Create Reset Ticket (writes `password_resets` + audit log; optional WhatsApp link)

### B) Staff Management

- List staff
- Search by: name, email, uid, sfid
- Actions:
  - Edit staff profile fields
  - Update staff status/roles (Director only)
  - Delete staff (arm/double-confirm)
  - Create Reset Ticket

## Registry Logs

Create collection: `registry_admin_logs/{id}` with entries:

- `actor_uid`, `actor_name`, `actor_roles`
- `action` (e.g. `TRAINEE_UPDATE`, `TRAINEE_DELETE`, `STAFF_UPDATE`, `STAFF_DELETE`, `RESET_TICKET_CREATE`)
- `target_collection` (`trainees` | `staffs`)
- `target_id`
- `before` (subset snapshot) and `after` (subset snapshot) when applicable
- `timestamp`

Render in Director dashboard: `Registry Logs` tab with filters by action type and target collection.

## Firestore Rules Updates

- Add rules for `registry_admin_logs`:
  - `create`: staff
  - `read`: staff
  - `update/delete`: director only (or deny updates to keep logs immutable)

## Acceptance Criteria

- Specialist can confirm assigned track on mobile reliably.
- Director can edit/delete trainee and staff docs from a dedicated Registry Admin tab.
- Director can create reset tickets from the admin panel.
- All admin actions produce entries in `registry_admin_logs` and are visible in Registry Logs tab.

