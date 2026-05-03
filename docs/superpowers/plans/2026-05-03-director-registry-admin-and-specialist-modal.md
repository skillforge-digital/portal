# Director Registry Admin + Specialist Track Modal UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Specialist Assigned Track modal so “Confirm Track” is always reachable on mobile, and add a Director “Registry Admin” + “Registry Logs” capability to edit/delete trainees and staff, and create reset tickets with full logging.

**Architecture:** Use simple UI additions inside `staffs/specialist/index.html` and `staffs/director/index.html`. Persist admin actions to an append-only `registry_admin_logs` collection and reuse existing `password_resets` flow for reset tickets. Update Firestore rules to permit registry_admin_logs access and keep logs immutable.

**Tech Stack:** Static HTML, Firebase client SDK (Firestore), existing StaffCore/staffCommand patterns, Vitest for helper tests, existing confirm/arm patterns in Director.

---

## File Map

- Modify: `/workspace/portal/staffs/specialist/index.html`
- Modify: `/workspace/portal/staffs/director/index.html`
- Modify: `/workspace/portal/firestore.rules`
- Create: `/workspace/portal/tests/registry-admin-logs.test.js`

---

### Task 1: Fix Specialist Assigned Track modal footer reachability

**Files:**
- Modify: `/workspace/portal/staffs/specialist/index.html`

- [ ] **Step 1: Make modal card scrollable and footer sticky**

Update the modal inner card wrapper to:
- `max-height: 90vh`
- `overflow-y: auto`

Update the footer button row (Cancel/Confirm) to:
- `position: sticky; bottom: 0`
- background blur (reuse existing glass classes)

- [ ] **Step 2: Verify Confirm is always reachable**

Manual check in browser mobile view (or narrow window) that:
- Selecting a radio enables Confirm
- Footer remains visible

- [ ] **Step 3: Commit**

```bash
cd /workspace/portal
git add staffs/specialist/index.html
git commit -m "fix(specialist): keep track confirm button visible"
```

---

### Task 2: Add Firestore rules for registry admin logs (TDD)

**Files:**
- Modify: `/workspace/portal/firestore.rules`
- Create: `/workspace/portal/tests/registry-admin-logs.test.js`

- [ ] **Step 1: Add a lint-style test to ensure rules contain registry_admin_logs match**

Create `/workspace/portal/tests/registry-admin-logs.test.js`:

```js
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

describe('firestore rules registry admin logs', () => {
  it('defines registry_admin_logs match', () => {
    const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
    expect(rules).toContain('match /registry_admin_logs/{id}');
  });
});
```

- [ ] **Step 2: Update rules**

Add:
- `match /registry_admin_logs/{id} { allow read: if isStaff(); allow create: if isStaff(); allow update, delete: if isDirector(); }`

Prefer immutable logs by denying update/delete unless Director explicitly needs delete.

- [ ] **Step 3: Run tests**

```bash
cd /workspace/portal
npm test
```

- [ ] **Step 4: Commit**

```bash
cd /workspace/portal
git add firestore.rules tests/registry-admin-logs.test.js
git commit -m "chore(rules): add registry admin logs access"
```

---

### Task 3: Director Registry Admin tab (trainees + staff)

**Files:**
- Modify: `/workspace/portal/staffs/director/index.html`

- [ ] **Step 1: Add nav items**

Add two new director tabs:
- `registry-admin`
- `registry-logs`

Wire to `showTab(...)`.

- [ ] **Step 2: Implement trainee list + edit/delete**

Use `onSnapshot(query(collection(db,'trainees'), orderBy('created_at','desc'), limit(200)))`.
Render a table with actions per row:
- Edit → opens modal with inputs for common fields and a JSON editor fallback
- Save → `updateDoc(doc(db,'trainees',uid), patch)`
- Delete → `deleteDoc(doc(db,'trainees',uid))` with arm confirm

For every save/delete, write:
- `audit_logs` entry: `REGISTRY_ADMIN_ACTION`
- `registry_admin_logs` entry with before/after snapshots

- [ ] **Step 3: Implement staff list + edit/delete/roles**

Use `onSnapshot(query(collection(db,'staffs'), orderBy('created_at','desc'), limit(200)))`.
Actions:
- Edit profile fields (name, email, phone, department, assignedTrack, etc.)
- Change roles/status (Director only; already allowed by rules)
- Delete staff (arm confirm)
- Create reset ticket (see Task 4)

Log each action to `registry_admin_logs`.

- [ ] **Step 4: Commit**

```bash
cd /workspace/portal
git add staffs/director/index.html
git commit -m "feat(director): add registry admin tools"
```

---

### Task 4: Director can generate reset tickets for any user

**Files:**
- Modify: `/workspace/portal/staffs/director/index.html`

- [ ] **Step 1: Add “Create Reset Ticket” action**

For trainee/staff rows, prompt for WhatsApp phone if missing and create:
- `password_resets` doc with `ticketCode`, `email`, `phone`, `accountType`, `status: requested`, `created_at`
- `audit_logs` entry `PASSWORD_RESET_TICKET_CREATED_BY_STAFF`
- `registry_admin_logs` entry `RESET_TICKET_CREATE`

Also show:
- ticket code
- Copy message button
- WhatsApp link to user phone or to support number (per existing helpers)

- [ ] **Step 2: Commit**

```bash
cd /workspace/portal
git add staffs/director/index.html
git commit -m "feat(director): generate reset tickets"
```

---

### Task 5: Director Registry Logs tab

**Files:**
- Modify: `/workspace/portal/staffs/director/index.html`

- [ ] **Step 1: Render registry_admin_logs**

`onSnapshot(query(collection(db,'registry_admin_logs'), orderBy('timestamp','desc'), limit(500)))`

Render:
- action, actor, target, timestamp
- expandable JSON details for before/after

- [ ] **Step 2: Commit**

```bash
cd /workspace/portal
git add staffs/director/index.html
git commit -m "feat(director): add registry logs"
```

---

### Task 6: Verification + Push

- [ ] **Step 1: Run audit + tests**

```bash
cd /workspace/portal
node scripts/audit-html-assets.js .
npm test
```

- [ ] **Step 2: Push**

```bash
cd /workspace/portal
git push origin main
```

