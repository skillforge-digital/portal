# Staff Dashboards + Academy Gate Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore staff dashboard reliability, specialist trainee access, and main-site academy gate enforcement, including staff “global unlock”.

**Architecture:** Keep the existing static MPA + Firebase CDN SDK approach. Fix crashes by correcting module imports and centralizing role normalization in one shared helper. Repair the main-site academy `gate.js` as a standalone session verifier that redirects to `gate.html` when needed.

**Tech Stack:** Vanilla HTML + ES Modules, Firebase Auth + Firestore (CDN SDK), Vitest (portal tests).

---

## File Map (what changes and why)

Portal repo (`/workspace/portal`):

- Modify: `staffs/hod/index.html` — import `auth` and `staff-core` to prevent boot crash + ensure `window.staffCore` initializes.
- Modify: `staffs/support/index.html` — import `auth` to prevent boot crash.
- Modify: `staffs/specialist/index.html` — import `auth` to prevent boot crash; fix registry link.
- Modify: `assets/staff-identity.js` — normalize role aliases (e.g., `Support Team` → `Support Staff`) so routing/permissions don’t break.
- Modify: `staffs/registry/index.html` — specialist default/lock track filtering (assigned track).
- Modify: `firestore.rules` — align `isStaff()` to accept legacy role aliases where needed.
- Create: `tests/staff-dashboard-imports.test.js` — prevents regressions (ensures required imports exist).

Main site repo (`/workspace/skillforge-website`):

- Replace/Modify: `academy/gate.js` — implement full session verification + redirect logic; respect “Staff Access” universal unlock.

---

### Task 1: Add a regression test for staff dashboard module imports (TDD)

**Files:**
- Create: `tests/staff-dashboard-imports.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/staff-dashboard-imports.test.js`:

```js
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

function read(relPath) {
  return readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
}

describe('staff dashboards bootstrap imports', () => {
  test('HOD dashboard imports staff-core and auth', () => {
    const html = read('staffs/hod/index.html');
    expect(html).toMatch(/import\s+StaffCore\s+from\s+['"]\.\.\/\.\.\/assets\/staff-core\.js['"]/);
    expect(html).toMatch(/import\s+\{\s*db\s*,\s*auth\s*\}\s+from\s+['"]\.\.\/\.\.\/assets\/firebase-config\.js['"]/);
  });

  test('Support dashboard imports auth', () => {
    const html = read('staffs/support/index.html');
    expect(html).toMatch(/import\s+\{\s*db\s*,\s*auth\s*\}\s+from\s+['"]\.\.\/\.\.\/assets\/firebase-config\.js['"]/);
  });

  test('Specialist dashboard imports auth', () => {
    const html = read('staffs/specialist/index.html');
    expect(html).toMatch(/import\s+\{\s*db\s*,\s*auth\s*\}\s+from\s+['"]\.\.\/\.\.\/assets\/firebase-config\.js['"]/);
  });
});
```

- [ ] **Step 2: Run tests to confirm failure**

Run:

```bash
cd /workspace/portal
npm test
```

Expected: FAIL (at least the HOD/Support/Specialist tests), because those files currently don’t import `auth`, and HOD doesn’t import `staff-core`.

---

### Task 2: Fix staff dashboard boot crashes (portal)

**Files:**
- Modify: `staffs/hod/index.html`
- Modify: `staffs/support/index.html`
- Modify: `staffs/specialist/index.html`

- [ ] **Step 1: Fix HOD imports**

In `staffs/hod/index.html` module script:

1) Add StaffCore import:

```js
import StaffCore from '../../assets/staff-core.js';
```

2) Import `auth` alongside `db`:

```js
import { db, auth } from '../../assets/firebase-config.js';
```

- [ ] **Step 2: Fix Support imports**

In `staffs/support/index.html` module script:

Replace:

```js
import { db } from '../../assets/firebase-config.js';
```

With:

```js
import { db, auth } from '../../assets/firebase-config.js';
```

- [ ] **Step 3: Fix Specialist imports**

In `staffs/specialist/index.html` module script:

Replace:

```js
import { db } from '../../assets/firebase-config.js';
```

With:

```js
import { db, auth } from '../../assets/firebase-config.js';
```

- [ ] **Step 4: Run portal tests**

Run:

```bash
cd /workspace/portal
npm test
```

Expected: PASS.

---

### Task 3: Normalize staff role aliases at identity boundary (portal)

**Files:**
- Modify: `assets/staff-identity.js`
- Test: `tests/staff-role-gateway.test.js` (existing) and/or add assertions in a new test file if needed.

- [ ] **Step 1: Add a role-normalization helper**

In `assets/staff-identity.js`, add:

```js
const ROLE_ALIASES = {
  'Support Team': 'Support Staff',
  'Support Staff / Team': 'Support Staff'
};

function normalizeRole(role) {
  const raw = String(role || '').trim();
  return ROLE_ALIASES[raw] || raw;
}

function normalizeRoles(rolesRaw) {
  const roles = Array.isArray(rolesRaw) ? rolesRaw : [rolesRaw].filter(Boolean);
  return roles.map(normalizeRole).filter(Boolean);
}
```

- [ ] **Step 2: Apply normalization in `resolveStaffIdentity` return**

Update the computed roles/primaryRole to normalized variants:

```js
const rolesRaw = data.roles ?? (data.primaryRole ? [data.primaryRole] : (data.role ? [data.role] : (legacyRole ? [legacyRole] : [])));
const roles = normalizeRoles(rolesRaw);

const primaryRoleRaw = data.primaryRole || data.role || legacyRole || roles[0] || 'Staff';
const primaryRole = normalizeRole(primaryRoleRaw) || roles[0] || 'Staff';
```

Return `roles` and `primaryRole` from the normalized values.

- [ ] **Step 3: Run portal tests**

Run:

```bash
cd /workspace/portal
npm test
```

Expected: PASS.

---

### Task 4: Specialist access to Shared Trainee Registry (portal)

**Files:**
- Modify: `staffs/specialist/index.html`
- Modify: `staffs/registry/index.html`

- [ ] **Step 1: Fix Specialist nav link to registry**

In `staffs/specialist/index.html`, replace the placeholder “Trainee Registry” href (`#`) with:

```html
<a href="/staffs/registry/" class="nav-link ...">...</a>
```

- [ ] **Step 2: Auto-select or lock track for specialists in shared registry**

In `staffs/registry/index.html`:

1) After `staffProfile` is loaded, if `primaryRole === 'Specialist'`:
   - Determine assigned track (field candidates commonly used in portal):
     - `staffProfile.assignedTrack`
     - (fallback) `staffProfile.track`
   - If present:
     - set `track-select` to that track
     - disable changing the track (optional but recommended)
     - auto-load trainees for that track
   - If missing:
     - show a blocking status message and do not allow loading.

- [ ] **Step 3: Run portal tests**

Run:

```bash
cd /workspace/portal
npm test
```

Expected: PASS.

---

### Task 5: Fix main-site academy gate enforcement (skillforge-website)

**Files:**
- Modify: `academy/gate.js`

- [ ] **Step 1: Replace truncated `academy/gate.js` with a complete implementation**

Implement:

- `verifySession(trackId)`:
  - reads cookie `sf_gate_session_${trackId}`
  - validates decoded `timestamp` is within `SESSION_DURATION_MS`
  - if session is valid: return `{ ok: true }`
  - else return `{ ok: false }`

- `verifyPasscodeIsUniversal(uid)`:
  - best-effort check: query `track_access` for a record with `uid == <uid>` and `track == 'Staff Access'`
  - if present: treat as universal gate pass for any track

- Boot:
  - compute `trackId = getTrackIdFromPath()`
  - if no trackId: no-op (academy landing pages can render)
  - else:
    - if `verifySession(trackId)` ok: stop
    - else, if `sf_gate_uid` cookie exists and is universal: set a fresh per-track session cookie and stop
    - else redirect to `/academy/gate.html?track=<trackId>`

- [ ] **Step 2: Syntax-check the module**

Run:

```bash
node --check /workspace/skillforge-website/academy/gate.js
```

Expected: Exit code 0.

---

### Task 6: Firestore rules alignment (portal)

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Update `isStaff()` / role checks to include role aliases**

Update role checks so `Support Team` behaves like `Support Staff` for authorization decisions that are role-name-based.

- [ ] **Step 2: Dry-run local rules deploy (optional)**

If Firebase CLI is available and configured:

```bash
cd /workspace/portal
npm run rules:deploy
```

Expected: Successful rules deploy.

---

### Task 7: Verification pass

**Files:**
- N/A (verification only)

- [ ] **Step 1: Portal unit tests**

```bash
cd /workspace/portal
npm test
```

- [ ] **Step 2: Sanity import check for staff dashboards (optional)**

```bash
node --check /workspace/portal/staffs/hod/index.html
```

Note: HTML won’t parse in node; this step is optional. Prefer browser console checks in staging for runtime validation.

- [ ] **Step 3: Main-site gate script syntax**

```bash
node --check /workspace/skillforge-website/academy/gate.js
```

---

## Plan Self-Review (Spec Coverage)

- Staff dashboards reliability: Tasks 1–2
- Specialist trainee visibility + registry access: Task 4
- Academy gate enforcement + staff global unlock: Task 5
- Rules alignment: Task 6
- Regression prevention: Task 1

