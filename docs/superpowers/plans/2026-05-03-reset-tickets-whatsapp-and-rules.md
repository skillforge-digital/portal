# Reset Tickets + WhatsApp Support + Rules Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Reset Ticket system (6-digit code + WhatsApp automation) to both trainee and staff forgot-password flows, provide Director/Support inbox UI to manage tickets, log lifecycle events, and update Firestore rules for consistent staff access.

**Architecture:** Forgot-password pages continue sending Firebase Auth reset email, then create a `password_resets` ticket. Director/Support dashboards read and update tickets. Audit logs record ticket creation and handling; reset completion is already recorded by existing reset pages.

**Tech Stack:** Static HTML, Firebase client SDK (Auth + Firestore), existing `registry-utils.js` helpers, Vitest.

---

## File Map

- Modify: `/workspace/portal/assets/registry-utils.js`
- Modify: `/workspace/portal/trainee-login/forgot-password.html`
- Modify: `/workspace/portal/staffs/login/forgot-password.html`
- Modify: `/workspace/portal/staffs/director/index.html`
- Modify: `/workspace/portal/staffs/support/index.html`
- Modify: `/workspace/portal/firestore.rules`
- Create: `/workspace/portal/tests/reset-tickets.test.js`

---

### Task 1: Ticket helpers (TDD)

**Files:**
- Modify: `/workspace/portal/assets/registry-utils.js`
- Create: `/workspace/portal/tests/reset-tickets.test.js`

- [ ] **Step 1: Write failing tests**

Create `/workspace/portal/tests/reset-tickets.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { buildResetTicketCode, buildResetWhatsappMessage } from '../assets/registry-utils.js';

describe('reset tickets', () => {
  it('buildResetTicketCode returns 6 digits', () => {
    const code = buildResetTicketCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('buildResetWhatsappMessage includes email + code', () => {
    const msg = buildResetWhatsappMessage({
      email: 'user@example.com',
      ticketCode: '123456',
      accountType: 'trainee'
    });
    expect(msg).toContain('123456');
    expect(msg.toLowerCase()).toContain('user@example.com');
  });
});
```

- [ ] **Step 2: Run tests and confirm failure**

```bash
cd /workspace/portal
npm test
```

- [ ] **Step 3: Implement helpers**

Modify `/workspace/portal/assets/registry-utils.js` and add:

```js
export function buildResetTicketCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function buildResetWhatsappMessage({ email, ticketCode, accountType }) {
  const safeEmail = String(email || '').trim().toLowerCase();
  const safeCode = String(ticketCode || '').trim();
  const kind = String(accountType || '').trim().toUpperCase();
  return [
    'SkillForge Password Reset Ticket',
    '',
    `Account Type: ${kind || 'UNKNOWN'}`,
    `Email: ${safeEmail || 'UNKNOWN'}`,
    `Ticket Code: ${safeCode || '------'}`,
    '',
    'If you already received the reset email, open it and reset your password.',
    'If you did not receive it, check spam/promotions then request again.',
    '',
    'Support: please confirm the email and advise the user to use the reset email link.'
  ].join('\\n');
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
git add assets/registry-utils.js tests/reset-tickets.test.js
git commit -m "feat(reset): add reset ticket helpers"
```

---

### Task 2: Trainee forgot-password creates Reset Ticket (email + phone required)

**Files:**
- Modify: `/workspace/portal/trainee-login/forgot-password.html`

- [ ] **Step 1: Add WhatsApp phone input**

Add required phone input field (tel) under email.

- [ ] **Step 2: Create ticket after sending reset email**

After `sendPasswordResetEmail(...)` succeeds, create:

```js
await addDoc(collection(db, 'password_resets'), {
  ticketCode,
  email,
  phone,
  accountType: 'trainee',
  status: 'requested',
  created_at: serverTimestamp()
});
```

Also write `audit_logs`:

```js
await addDoc(collection(db, 'audit_logs'), {
  type: 'PASSWORD_RESET_TICKET_REQUESTED',
  email,
  phone,
  accountType: 'trainee',
  ticketCode,
  timestamp: serverTimestamp()
});
```

- [ ] **Step 3: Show code + WhatsApp automation**

Update success UI to display:
- ticketCode
- copy button
- WhatsApp link to support number with prefilled text (use `buildWhatsappLink` and `buildResetWhatsappMessage`)

- [ ] **Step 4: Commit**

```bash
cd /workspace/portal
git add trainee-login/forgot-password.html
git commit -m "feat(trainee): create password reset ticket"
```

---

### Task 3: Staff forgot-password creates Reset Ticket (email + phone required)

**Files:**
- Modify: `/workspace/portal/staffs/login/forgot-password.html`

Repeat Task 2 with `accountType: 'staff'`.

- [ ] **Step 1: Add required phone input**
- [ ] **Step 2: Create password_resets doc + audit log**
- [ ] **Step 3: Show ticketCode + WhatsApp automation**
- [ ] **Step 4: Commit**

```bash
cd /workspace/portal
git add staffs/login/forgot-password.html
git commit -m "feat(staff): create password reset ticket"
```

---

### Task 4: Director Reset Tickets inbox

**Files:**
- Modify: `/workspace/portal/staffs/director/index.html`

- [ ] **Step 1: Add a new tab "Reset Tickets"**

Add a nav entry that calls `showTab('reset-tickets')`.

- [ ] **Step 2: Implement `renderResetTickets(container)`**

Use `onSnapshot(query(collection(db,'password_resets'), orderBy('created_at','desc'), limit(200)))`.

Render each ticket:
- email, phone, ticketCode, status, created_at
- buttons:
  - Copy code
  - Copy message
  - WhatsApp user (wa.me to `phone` with message)
  - Mark handled (updateDoc status + handled_at + handled_by)

Also write audit logs on handling:

```js
await addDoc(collection(db,'audit_logs'), {
  type: 'PASSWORD_RESET_TICKET_HANDLED',
  ticketId,
  ticketCode,
  email,
  handled_by: staffCommand.userData.uid,
  timestamp: serverTimestamp()
});
```

- [ ] **Step 3: Commit**

```bash
cd /workspace/portal
git add staffs/director/index.html
git commit -m "feat(director): add reset tickets inbox"
```

---

### Task 5: Support Reset Tickets inbox

**Files:**
- Modify: `/workspace/portal/staffs/support/index.html`

Add a nav entry + renderer similar to Director, but can be simpler (same fields + actions).

- [ ] **Step 1: Add a new nav item (Reset Tickets)**
- [ ] **Step 2: Implement `showTab('reset-tickets')` and `renderResetTickets`**
- [ ] **Step 3: Commit**

```bash
cd /workspace/portal
git add staffs/support/index.html
git commit -m "feat(support): add reset tickets inbox"
```

---

### Task 6: Firestore rules hardening for reset tickets + role alignment

**Files:**
- Modify: `/workspace/portal/firestore.rules`

- [ ] **Step 1: Tighten password_resets create shape**

Update `match /password_resets/{id}` create rule to require:
- required fields present
- `status == 'requested'`
- `ticketCode.size() == 6`

- [ ] **Step 2: Align isStaff roles**

Ensure `isStaff()` includes both `Support Staff` and `Support Team` (and existing roles), so intended staff can read tickets and audit logs.

- [ ] **Step 3: Commit**

```bash
cd /workspace/portal
git add firestore.rules
git commit -m "chore(rules): support reset tickets and staff roles"
```

---

### Task 7: Verification + Push

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

