# Specialist Single-Track Lock (Choose Once) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Specialist multi-track selection with a single locked `assignedTrack` field (choose once), and make trainee counts/activity use only that track while supporting legacy Specialist profiles.

**Architecture:** Read assignment from `profile.assignedTrack` first. If missing, migrate from `profile.tracks` when safe (single value) or prompt user to choose a single track using radio inputs. Persist to `staffs/{uid}` when present, else to legacy `specialists/{uid}`. Update dashboard counters and activity feed to filter by `assignedTrack`.

**Tech Stack:** Static HTML + Tailwind utilities, Firebase client SDK (Auth + Firestore), Vitest tests.

---

## File Map

- Modify: `/workspace/portal/staffs/specialist/index.html`
- Test: `/workspace/portal/tests/specialist-assigned-track.test.js`

---

### Task 1: Add `getAssignedTrack(profile)` helper (TDD)

**Files:**
- Modify: `/workspace/portal/staffs/specialist/index.html`
- Test: `/workspace/portal/tests/specialist-assigned-track.test.js`

- [ ] **Step 1: Add failing test**

Create `/workspace/portal/tests/specialist-assigned-track.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { getAssignedTrack } from '../staffs/specialist/specialist-assigned-track.js';

describe('getAssignedTrack', () => {
  it('prefers assignedTrack', () => {
    expect(getAssignedTrack({ assignedTrack: 'Web Development', tracks: ['Graphic Design'] })).toBe('Web Development');
  });

  it('falls back to tracks when it is exactly one', () => {
    expect(getAssignedTrack({ tracks: ['Graphic Design'] })).toBe('Graphic Design');
  });

  it('returns empty when ambiguous', () => {
    expect(getAssignedTrack({ tracks: ['Graphic Design', 'Web Development'] })).toBe('');
  });
});
```

- [ ] **Step 2: Run tests and confirm failure**

```bash
cd /workspace/portal
npm test
```

Expected: FAIL because file doesn’t exist.

- [ ] **Step 3: Implement helper module**

Create `/workspace/portal/staffs/specialist/specialist-assigned-track.js`:

```js
export function getAssignedTrack(profile) {
  const a = profile?.assignedTrack ? String(profile.assignedTrack).trim() : '';
  if (a) return a;
  const tracks = Array.isArray(profile?.tracks) ? profile.tracks.map((t) => String(t || '').trim()).filter(Boolean) : [];
  if (tracks.length === 1) return tracks[0];
  return '';
}
```

- [ ] **Step 4: Re-run tests**

```bash
cd /workspace/portal
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /workspace/portal
git add tests/specialist-assigned-track.test.js staffs/specialist/specialist-assigned-track.js
git commit -m "feat(specialist): add assigned track helper"
```

---

### Task 2: Update Specialist modal to single-select + lock after confirm

**Files:**
- Modify: `/workspace/portal/staffs/specialist/index.html`

- [ ] **Step 1: Replace checklist with radio list**

Update the modal renderer to create radio inputs named `assignedTrack` (single selection).

- [ ] **Step 2: Lock behavior**

If `assignedTrack` exists:
- Disable all radios.
- Replace Save button label with “Locked”.
- Show a note that Director must change it.

If missing:
- Allow selection.
- Button label “Confirm Track”.

- [ ] **Step 3: Persist to correct collection**

On confirm:
- If `staffs/{uid}` exists: `updateDoc(staffRef, { assignedTrack })`
- Else: `updateDoc(doc(db,'specialists',uid), { assignedTrack })`
- Also clear `tracks` optionally (leave as-is for compatibility; do not delete to avoid rules issues).

- [ ] **Step 4: Commit**

```bash
cd /workspace/portal
git add staffs/specialist/index.html
git commit -m "feat(specialist): lock single assigned track"
```

---

### Task 3: Update trainee counts + activity feed to use assignedTrack only

**Files:**
- Modify: `/workspace/portal/staffs/specialist/index.html`

- [ ] **Step 1: Count trainees by assigned track**

Replace the multi-track loop with a single query:
- `where('track','==',assignedTrack)`
- Update both counter elements.

- [ ] **Step 2: Filter presence by assignedTrack**

Replace `trackSet` filtering with a single `assignedTrack` string comparison.

- [ ] **Step 3: Commit**

```bash
cd /workspace/portal
git add staffs/specialist/index.html
git commit -m "fix(specialist): filter metrics by assigned track"
```

---

### Task 4: Verification + Push

- [ ] **Step 1: Run audit + tests**

```bash
cd /workspace/portal
node scripts/audit-html-assets.js .
npm test
```

Expected: PASS.

- [ ] **Step 2: Push**

```bash
cd /workspace/portal
git push origin main
```

