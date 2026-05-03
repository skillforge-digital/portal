# Specialist Tracks & Trainee Activity (No Re-registration) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Specialists set/confirm their assigned tracks, see trainee counts for those tracks, and view recent trainee activity filtered by track using presence telemetry.

**Architecture:** Store Specialist’s assigned track list in `staffs/{uid}.tracks`. If missing, auto-derive from `department` using StaffCore’s unit→tracks mapping. For activity, enrich `presence/{uid}` writes with trainee `track` + `name`, then query presence docs and filter by Specialist tracks in the dashboard UI.

**Tech Stack:** Static HTML + Tailwind utilities, Firebase client SDK (Auth + Firestore), Vitest tests.

---

## File Map

- Modify: `/workspace/portal/assets/sf-core.js`
- Modify: `/workspace/portal/staffs/specialist/index.html`
- Create: `/workspace/portal/tests/specialist-tracks.test.js`

---

### Task 1: Enrich Presence Writes with Trainee Track + Name (TDD)

**Files:**
- Modify: `/workspace/portal/assets/sf-core.js`
- Test: `/workspace/portal/tests/specialist-tracks.test.js`

- [ ] **Step 1: Write failing unit test for presence payload helper**

Create `/workspace/portal/tests/specialist-tracks.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { buildPresencePatch } from '../assets/sf-core.js';

describe('presence tracking', () => {
  it('includes track and name when available', () => {
    const patch = buildPresencePatch({
      registryState: { track: 'Web Development', name: 'Ada' },
      engagementScore: 0.5,
      durationSeconds: 120
    });
    expect(patch.track).toBe('Web Development');
    expect(patch.name).toBe('Ada');
  });
});
```

Expected initial failure because `buildPresencePatch` is not exported.

- [ ] **Step 2: Run tests to confirm failure**

```bash
cd /workspace/portal
npm test
```

- [ ] **Step 3: Implement `buildPresencePatch` and use it in presence writes**

Modify `/workspace/portal/assets/sf-core.js`:

1) Add a named export:

```js
export function buildPresencePatch({ registryState, engagementScore, durationSeconds }) {
  const track = registryState?.track ? String(registryState.track).trim() : '';
  const name = registryState?.name ? String(registryState.name).trim() : '';
  return {
    lastSeen: serverTimestamp(),
    engagementScore: engagementScore,
    totalActiveSeconds: increment(durationSeconds),
    ...(track ? { track } : {}),
    ...(name ? { name } : {})
  };
}
```

2) In both places where presence is written (`metricsRef` and `presenceRef` writes), replace the literal object with:

```js
await setDoc(metricsRef, buildPresencePatch({
  registryState: this.registryState,
  engagementScore: score,
  durationSeconds: duration
}), { merge: true });
```

and similarly for batched writes.

- [ ] **Step 4: Re-run tests**

```bash
cd /workspace/portal
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /workspace/portal
git add assets/sf-core.js tests/specialist-tracks.test.js
git commit -m "feat(presence): include trainee track and name"
```

---

### Task 2: Specialist Track Assignment UI (Auto from Unit)

**Files:**
- Modify: `/workspace/portal/staffs/specialist/index.html`

- [ ] **Step 1: Add “My Tracks” panel**

In `/workspace/portal/staffs/specialist/index.html`:
- Add a button near the header: “My Tracks”
- Clicking opens a modal with:
  - checklist of the 10 official tracks (same values as `registry-utils.js`)
  - Save button

- [ ] **Step 2: Auto-fill tracks on first load**

When Specialist profile loads:
- Read `window.staffCore.profile.tracks`
- If missing/empty:
  - Derive default tracks from `window.staffCore.getTrackSpecialists(window.staffCore.profile.department)`
  - Pre-check those in the modal
  - Show a banner “Tracks auto-selected from your unit — click Save to confirm.”

- [ ] **Step 3: Save tracks to Firestore**

On Save:
- `updateDoc(doc(db,'staffs',uid), { tracks: selectedTracks })`
- Do not modify roles/status.

- [ ] **Step 4: Commit**

```bash
cd /workspace/portal
git add staffs/specialist/index.html
git commit -m "feat(specialist): add my tracks selector"
```

---

### Task 3: Specialist Trainee Count Filtered by Assigned Tracks

**Files:**
- Modify: `/workspace/portal/staffs/specialist/index.html`

- [ ] **Step 1: Replace global trainees snapshot with per-track queries**

Because Firestore doesn’t support `in` with `orderBy(created_at)` easily and the dashboard needs only counts:
- For each track in selected tracks:
  - Query `collection(db,'trainees')` with `where('track','==',track)`
  - `getDocs` and sum sizes

Update both counters used by the page (`trainee-count` and `trainee-count-sub`) if present.

- [ ] **Step 2: Commit**

```bash
cd /workspace/portal
git add staffs/specialist/index.html
git commit -m "fix(specialist): count trainees by assigned tracks"
```

---

### Task 4: Specialist Recent Activity (Presence filtered by tracks)

**Files:**
- Modify: `/workspace/portal/staffs/specialist/index.html`

- [ ] **Step 1: Query presence and render activity list**

Implementation approach:
- Query `presence` ordered by `lastSeen desc` limit 200.
- Filter client-side to only entries where `doc.data().track` is in Specialist tracks.
- Render top 30 entries.

Display fields:
- name (fallback: uid prefix)
- track
- lastSeen locale string
- engagementScore (optional)

- [ ] **Step 2: Commit**

```bash
cd /workspace/portal
git add staffs/specialist/index.html
git commit -m "feat(specialist): show recent trainee activity by track"
```

---

### Task 5: Verification + Push

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

