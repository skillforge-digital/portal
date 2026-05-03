# Reset Tickets + WhatsApp Support + Rules Hardening — Design

Date: 2026-05-03

## Goal

Improve missing credential handling for both trainees and staff by adding a Reset Ticket workflow that:

1) Keeps the existing Firebase Auth email reset (self-serve).
2) Creates a Firestore Reset Ticket with a 6-digit code and WhatsApp automation.
3) Shows a Reset Tickets inbox for Director and Support.
4) Records lifecycle events in audit logs, including “ticket created”, “handled”, and “password reset success”.
5) Updates Firestore rules to allow smooth operation while preventing privilege escalation.

## Non-Goals

- Replacing Firebase Auth reset flow with a “WhatsApp-only password reset”. Firebase requires an Auth reset link (`oobCode`) unless an Admin backend exists.
- Sending WhatsApp messages directly from the portal (no server). The portal generates `wa.me` links + copyable message text.

## Data Model

### Collection: `password_resets/{ticketId}`

Fields:

- `ticketCode: string` (6 digits)
- `email: string` (lowercased)
- `phone: string` (WhatsApp number, normalized digits)
- `accountType: 'trainee' | 'staff'`
- `status: 'requested' | 'handled' | 'closed'`
- `created_at: timestamp`
- `handled_at?: timestamp`
- `handled_by?: string` (uid of staff who handled)
- `handled_note?: string`

Derivatives (not stored, computed in UI):
- `waLink`: wa.me link to the user phone with prefilled text
- `messageText`: copyable WhatsApp text containing ticketCode + reset instructions

## User Flows

### A) Trainee forgot password

Page: `/trainee-login/forgot-password.html`

1) User enters email + WhatsApp number.
2) Page calls `sendPasswordResetEmail(...)` (existing).
3) Page creates `password_resets` ticket with 6-digit `ticketCode`.
4) Page shows:
   - Ticket code
   - “Open WhatsApp Support” link (support number) with message including ticketCode + email
   - “Copy Ticket Code” button
5) Page writes `audit_logs` entry: `PASSWORD_RESET_TICKET_REQUESTED`.

### B) Staff forgot password

Page: `/staffs/login/forgot-password.html`

Same flow as trainee, with `accountType: 'staff'`.

### C) Ticket inbox for Director + Support

Pages:
- `/staffs/director/` new tab: Reset Tickets
- `/staffs/support/` new tab: Reset Tickets

Capabilities:
- View `password_resets` list (default filter `status == 'requested'`)
- Copy ticket code
- Open WhatsApp to the user phone (auto message)
- Mark ticket as `handled` / `closed` (writes handled metadata)
- Optional: Search by email / ticketCode

### D) “Token used” (Password reset completed)

Existing reset pages already write:
- `PASSWORD_RESET_TOKEN_VERIFIED`
- `PASSWORD_RESET_SUCCESS`
- `PASSWORD_RESET_FAILURE`

Ticket inbox shows “Completed” when a `PASSWORD_RESET_SUCCESS` exists for same email after ticket creation time.

## Firestore Rules

### `password_resets`

- Create: allowed to unauthenticated users (forgot password), but restrict shape:
  - must set `status == 'requested'`
  - `ticketCode` must be string length 6
  - require `email`, `phone`, `accountType`
- Read/Update/Delete: staff only (`isStaff()`), to allow Director/Support inbox.

### Role naming alignment

Update `isStaff()` role list to include the actual roles used in the app (notably `Support Staff` and `Support Team`) so staff can read tickets and audit logs consistently.

## Acceptance Criteria

- Trainee and staff forgot-password pages create a reset ticket with a visible 6-digit code and WhatsApp link.
- Director + Support can see and manage reset tickets.
- Ticket handling actions are written to audit logs.
- Firestore rules allow the workflow without letting users escalate roles/status.

