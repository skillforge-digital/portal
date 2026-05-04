# Staff Dashboards + Academy Gate Stability — Design

Date: 2026-05-04

## Goal

Fix urgent staff-facing production breakages across:

1) Staff dashboards (Director/HOD/Specialist/Support) reliability and access flow.
2) Specialist visibility of trainees + access to the Shared Trainee Registry.
3) Main-site Academy gate enforcement + staff “global unlock” behavior.

This is a compatibility-first patch set: it should not require a Firestore data migration to restore basic function.

## Current Observations (Root Causes)

### 1) Staff dashboards crash early due to missing `auth` import

Multiple staff dashboard pages reference `auth.currentUser` without importing `auth` from `assets/firebase-config.js`, which causes a `ReferenceError: auth is not defined` during module evaluation and prevents the dashboard bootstrap from continuing.

Examples:

- `/staffs/hod/` uses `auth.currentUser` but imports only `db`  
  Target: [hod/index.html](file:///workspace/portal/staffs/hod/index.html#L206-L212) + usage at [hod/index.html](file:///workspace/portal/staffs/hod/index.html#L318-L323)
- `/staffs/support/` uses `auth.currentUser` but imports only `db`  
  Target: [support/index.html](file:///workspace/portal/staffs/support/index.html#L236-L242) + usage at [support/index.html](file:///workspace/portal/staffs/support/index.html#L301-L306)
- `/staffs/specialist/` uses `auth.currentUser` but imports only `db`  
  Target: [specialist/index.html](file:///workspace/portal/staffs/specialist/index.html#L273-L279)

### 2) HOD dashboard never initializes StaffCore (missing import)

`assets/staff-core.js` self-initializes `window.staffCore` only when the module is imported (it has a singleton boot at module bottom). The HOD dashboard does not import this module, so it can get stuck waiting for `window.staffCore`.

Target: [staff-core.js](file:///workspace/portal/assets/staff-core.js#L453-L459) and [hod/index.html](file:///workspace/portal/staffs/hod/index.html#L863-L881)

### 3) Role naming drift breaks routing/permissions for some staff

The ecosystem uses multiple variants for the same role, notably:

- `Support Team` (seen in staff registration role hierarchy) vs `Support Staff` (used by dashboards, role gateway, staff identity mapping, and Firestore rules intent).

This can lead to:

- Staff login routing to a generic page instead of the right dashboard.
- Firestore rules `isStaff()` mismatch, causing reads/writes to fail even when the user is a legitimate staff.

Targets:

- Registration role list: [staffs/registration/index.html](file:///workspace/portal/staffs/registration/index.html#L263-L272)
- Canonical mapping: [staff-identity.js](file:///workspace/portal/assets/staff-identity.js#L1-L7)

### 4) Main-site Academy gate script is truncated

`/academy/gate.js` is referenced across the main site’s academy pages, but the file ends mid-function, which will break parsing and prevent pages from executing.

Target: [academy/gate.js](file:///workspace/skillforge-website/academy/gate.js#L1-L47)

### 5) Staff global academy unlock is only partially modeled

The current academy gate implementation (in `gate.html`) allows a passcode with `track == 'Staff Access'` to pass any track gate. However:

- Staff registration currently writes `track_access/{assignedCode}` where `assignedCode` can be non-6-digit and may not match the academy’s “6 digit PIN” UI expectation.
- The main-site session verifier (`gate.js`) needs to respect “Staff Access” sessions too.

Targets:

- Staff registration track access: [staffs/registration/index.html](file:///workspace/portal/staffs/registration/index.html#L464-L481)
- Academy gate acceptance: [academy/gate.html](file:///workspace/skillforge-website/academy/gate.html#L222-L229)

## Proposed Approach (Robust Normalize)

### A) Portal: make staff dashboards boot reliably

1) Import `auth` everywhere it’s referenced in staff dashboards:
   - Replace `import { db } ...` with `import { db, auth } ...` in:
     - `/staffs/hod/index.html`
     - `/staffs/support/index.html`
     - `/staffs/specialist/index.html`

2) Ensure HOD dashboard imports StaffCore:
   - Add `import StaffCore from '../../assets/staff-core.js';` in `/staffs/hod/index.html`.
   - Keep the import even if `StaffCore` isn’t referenced, because the module bootstraps `window.staffCore`.

3) Prefer `window.staffCore.user` over `auth.currentUser` (stability hardening):
   - For control toggles and any “current uid” logic in staff dashboards, use:
     - `const uid = window.staffCore?.user?.uid || auth.currentUser?.uid || localStorage.getItem('skillforge_mock_uid');`
   - This reduces the chance a missing auth import or a stale auth state breaks the page.

### B) Portal: role normalization (compatibility-first)

1) Add a role normalization helper in a single shared location (preferred: `assets/rbac-config.js` or `assets/staff-identity.js`) that:
   - Maps legacy role aliases to canonical role names:
     - `Support Team` → `Support Staff`
     - (optionally) `Support Staff / Team` → `Support Staff`
   - Ensures `roles` is always an array.

2) Apply normalization at the boundaries:
   - `resolveStaffIdentity(...)` should return normalized `roles` and `primaryRole`.
   - Staff dashboard access maps should accept both canonical and legacy aliases while we transition.

### C) Portal: Specialist access to trainees + registry

1) Specialist dashboard navigation:
   - Replace placeholder “Trainee Registry” link with `/staffs/registry/`.

2) Shared Trainee Registry restrictions:
   - If `staffProfile.primaryRole === 'Specialist'`, default the track dropdown to their assigned track (or limit available track options).
   - If a specialist has no assigned track yet, show a clear “assigned track required” state and guide them to set/confirm track.

### D) Main site: fix academy gate enforcement

1) Repair `/academy/gate.js` so it fully implements:
   - `verifySession(trackId)`:
     - Reads cookie `sf_gate_session_${trackId}`
     - Validates timestamp TTL
     - Validates that session’s `trackId` matches current track OR that the associated `track_access` record has `track === 'Staff Access'`
   - If invalid/missing session:
     - Redirect to `/academy/gate.html?track=<trackId>`

2) Staff global unlock:
   - Treat `track_access.track === 'Staff Access'` as universal.
   - When redirecting to gate, keep the `track` query param consistent so the user returns to the correct track.

### E) Firestore rules alignment (minimal, safe)

Update `firestore.rules` to ensure `isStaff()` and staff role checks include the canonical + legacy roles needed for:

- Reading trainee docs for staff registry
- Reading/updating `password_resets` tickets for Director/Support
- Reading shared “system” config (if required by dashboards)

This should be implemented as:

- A single `isStaff()` helper that checks:
  - `exists(/databases/$(db)/documents/staffs/$(request.auth.uid))` OR legacy staff collections
  - and/or a role check that includes `Support Staff` + `Support Team` (alias)

## Acceptance Criteria

1) `/staffs/hod/` loads fully for an approved HOD account (no infinite loading, no console ReferenceError).
2) `/staffs/support/` and `/staffs/specialist/` load fully for approved accounts.
3) Specialist can open `/staffs/registry/` and see trainees for their assigned track.
4) Main-site academy pages that import `/academy/gate.js` no longer crash, and redirect to `gate.html` when session is missing.
5) A staff passcode associated with `track_access.track == 'Staff Access'` unlocks all academy tracks.
6) Portal test suite remains green (`npm test` in portal).

## Verification Plan

Portal (local):

- Run `npm test` in `/portal` (Vitest) to ensure no regressions.
- Run a quick static check that staff dashboard module scripts parse (node-based import smoke test).

Manual (staging/production):

- Log in with one approved account for each role: Director, HOD, Specialist, Support.
- Confirm:
  - dashboard loads without console errors
  - specialist registry filters correctly
  - reset tickets tab loads (Director + Support)
- On main site, visit an academy track page without a gate session:
  - verify redirect to gate page
  - enter passcode and ensure return to the track

