# Staff Role Gateway + Trainee Registry (WhatsApp Onboarding) + Reset Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a staff role gateway for multi-role accounts, a shared staff trainee registry with required track filter + search + contact visibility, WhatsApp DM onboarding with Telegram link, and password-reset UX improvements with WhatsApp support fallback.

**Architecture:** Keep UI as static HTML pages under `/staffs/`. Reuse existing staff identity resolution (`assets/staff-identity.js`) and staff auth bootstrap patterns (`assets/staff-core.js`) for access. Implement registry data access directly from Firestore in the browser; gate capabilities by roles. For WhatsApp onboarding, generate a `wa.me` deep-link with a URL-encoded message that includes the correct Telegram group for the trainee’s track.

**Tech Stack:** Static HTML + Tailwind utilities, Firebase client SDK (Auth + Firestore), Vitest tests.

---

## File Map

- Create: `/workspace/portal/staffs/role-gateway/index.html`
- Create: `/workspace/portal/staffs/registry/index.html`
- Create: `/workspace/portal/assets/registry-utils.js`
- Modify: `/workspace/portal/assets/staff-identity.js`
- Modify: `/workspace/portal/staffs/login/index.html`
- Modify: `/workspace/portal/staffs/director/index.html`
- Modify: `/workspace/portal/staffs/hod/index.html`
- Modify: `/workspace/portal/staffs/marketing/index.html`
- Modify: `/workspace/portal/staffs/support/index.html`
- Modify: `/workspace/portal/trainee-login/forgot-password.html`
- Modify: `/workspace/portal/staffs/login/forgot-password.html`
- Modify: `/workspace/portal/trainee-login/reset-password.html`
- Modify: `/workspace/portal/staffs/login/reset-password.html`
- Test: `/workspace/portal/tests/staff-role-gateway.test.js`
- Test: `/workspace/portal/tests/registry-utils.test.js`

---

### Task 1: Add Registry/WhatsApp Utilities (TDD)

**Files:**
- Create: `/workspace/portal/assets/registry-utils.js`
- Test: `/workspace/portal/tests/registry-utils.test.js`

- [ ] **Step 1: Write failing tests for WhatsApp link and message building**

Create `/workspace/portal/tests/registry-utils.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { buildWhatsappMessage, buildWhatsappLink, normalizePhone, getTelegramLinkForTrack } from '../assets/registry-utils.js';

describe('registry utils', () => {
  it('normalizes nigeria phone digits-only', () => {
    expect(normalizePhone('2349012345678')).toBe('2349012345678');
    expect(normalizePhone('+2349012345678')).toBe('2349012345678');
    expect(normalizePhone(' 234 901 234 5678 ')).toBe('2349012345678');
  });

  it('telegram link resolves by track', () => {
    expect(getTelegramLinkForTrack('Web Development')).toMatch(/^https:\/\/t\.me\//);
    expect(getTelegramLinkForTrack('Unknown Track')).toBe('https://t.me/skillforgeorg');
  });

  it('builds a short onboarding message', () => {
    const msg = buildWhatsappMessage({
      name: 'Ada',
      track: 'Web Development',
      telegramLink: 'https://t.me/example'
    });
    expect(msg).toContain('Congratulations Ada');
    expect(msg).toContain('Your track: Web Development');
    expect(msg).toContain('https://t.me/example');
    expect(msg).toContain('Please save this contact for further assistance.');
  });

  it('builds a wa.me link with encoded text', () => {
    const url = buildWhatsappLink({ phone: '2349012345678', text: 'Hello world' });
    expect(url).toBe('https://wa.me/2349012345678?text=Hello%20world');
  });
});
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
cd /workspace/portal
npm ci
npm test
```

Expected: FAIL because `assets/registry-utils.js` doesn’t exist yet.

- [ ] **Step 3: Implement registry utils**

Create `/workspace/portal/assets/registry-utils.js`:

```js
export const TRACK_TELEGRAM_NODES = {
  'Forex Synthetics Indices': 'https://t.me/+KWyN-sKQNMExZjg8',
  'Forex Currency Pairs': 'https://t.me/+9cAdAp2Pw_FjNmJk',
  'AI Content Creation': 'https://t.me/+I5vUYuIuaMw4N2Rk',
  'Photography & Editing': 'https://t.me/+mkRAltkqJd41YTE0',
  'Graphic Design': 'https://t.me/+PTJq2zoyz0M3ZDZk',
  'Digital Marketing': 'https://t.me/+uIkOfw5x2MpmNjI0',
  'Mobile Cinematography': 'https://t.me/+un1weOJ0HcsyZDdk',
  'Discord Development': 'https://t.me/+Y5wcP_PIQf1kMzlk',
  'Web Development': 'https://t.me/+vEJTv3fBRl43Yjlk',
  'Cyber Security': 'https://t.me/+M4ZYMfz5tiYzZWVk'
};

export function getTelegramLinkForTrack(track) {
  return TRACK_TELEGRAM_NODES[String(track || '')] || 'https://t.me/skillforgeorg';
}

export function normalizePhone(input) {
  const raw = String(input || '').trim();
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('0')) return `234${digits.slice(1)}`;
  if (digits.startsWith('234')) return digits;
  return digits;
}

export function buildWhatsappMessage({ name, track, telegramLink }) {
  const safeName = String(name || 'Trainee').trim();
  const safeTrack = String(track || '').trim();
  const tg = String(telegramLink || '').trim();
  return [
    `Congratulations ${safeName} — welcome to SkillForge Digital & Co. Ltd.`,
    `Your track: ${safeTrack}.`,
    '',
    `Join your official track Telegram group now: ${tg}`,
    '',
    'Next step: introduce yourself (name + track) in the group and wait for onboarding tasks.',
    'Please save this contact for further assistance.'
  ].join('\n');
}

export function buildWhatsappLink({ phone, text }) {
  const p = normalizePhone(phone);
  const t = encodeURIComponent(String(text || ''));
  return `https://wa.me/${p}?text=${t}`;
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
git add assets/registry-utils.js tests/registry-utils.test.js
git commit -m "feat(registry): add whatsapp and telegram helpers"
```

---

### Task 2: Staff Role Gateway Page + Multi-role Redirect

**Files:**
- Create: `/workspace/portal/staffs/role-gateway/index.html`
- Modify: `/workspace/portal/assets/staff-identity.js`
- Modify: `/workspace/portal/staffs/login/index.html`
- Test: `/workspace/portal/tests/staff-role-gateway.test.js`

- [ ] **Step 1: Add helper to map each role to a dashboard path**

Modify `/workspace/portal/assets/staff-identity.js` to export a new function:

```js
export function getAllStaffDashboardPaths(profile) {
  const roles = Array.isArray(profile?.roles) ? profile.roles : [];
  const map = {
    Director: '/staffs/director/',
    HOD: '/staffs/hod/',
    Specialist: '/staffs/specialist/',
    'Digital Marketing': '/staffs/marketing/',
    'Support Staff': '/staffs/support/'
  };
  return roles
    .filter(Boolean)
    .map((r) => ({ role: r, path: map[r] }))
    .filter((x) => Boolean(x.path));
}
```

- [ ] **Step 2: Add role gateway page**

Create `/workspace/portal/staffs/role-gateway/index.html` following portal staff styling:
- Uses `/assets/style.css`, `/assets/tailwind.css`, `/assets/responsive.css`, lucide
- On load:
  - reads current Firebase Auth user
  - resolves staff identity via `resolveStaffIdentity(uid)`
  - builds a role list using `getAllStaffDashboardPaths(profile)`
  - renders cards; clicking a card sets `sf_last_staff_role` and routes to that path

- [ ] **Step 3: Update staff login redirect**

In `/workspace/portal/staffs/login/index.html`, after successful login and identity resolution:
- If `profile.roles.length > 1`, redirect to `/staffs/role-gateway/`
- Else redirect to `getStaffDashboardPath(profile)` (existing behavior)

- [ ] **Step 4: Write a small unit test for dashboard mapping**

Create `/workspace/portal/tests/staff-role-gateway.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { getAllStaffDashboardPaths } from '../assets/staff-identity.js';

describe('staff role gateway', () => {
  it('maps multiple roles to multiple dashboards', () => {
    const out = getAllStaffDashboardPaths({ roles: ['Director', 'Specialist'] });
    const paths = out.map((x) => x.path);
    expect(paths).toContain('/staffs/director/');
    expect(paths).toContain('/staffs/specialist/');
  });
});
```

- [ ] **Step 5: Run tests**

```bash
cd /workspace/portal
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /workspace/portal
git add assets/staff-identity.js staffs/role-gateway/index.html tests/staff-role-gateway.test.js staffs/login/index.html
git commit -m "feat(staff): add role gateway for multi-role accounts"
```

---

### Task 3: Shared Trainee Registry Page (/staffs/registry/)

**Files:**
- Create: `/workspace/portal/staffs/registry/index.html`
- Modify: `/workspace/portal/firestore.rules` (only if required; prefer no change)
- Modify: `/workspace/portal/staffs/director/index.html`
- Modify: `/workspace/portal/staffs/hod/index.html`
- Modify: `/workspace/portal/staffs/marketing/index.html`
- Modify: `/workspace/portal/staffs/support/index.html`

- [ ] **Step 1: Create registry page skeleton**

Create `/workspace/portal/staffs/registry/index.html`:
- Header with track selector (required)
- Search input (filters client-side)
- Table container (empty until track chosen)
- Uses:
  - `resolveStaffIdentity` to confirm logged-in staff
  - hides “send whatsapp” controls unless staff role is in {Director, HOD, Digital Marketing, Support Staff}

- [ ] **Step 2: Implement Firestore query by track**

In `/staffs/registry/index.html`:
- query: `collection(db,'trainees')` with `where('track','==',selectedTrack)`, `orderBy('created_at','desc')`, `limit(200)`
- render rows with:
  - name, track, email, whatsapp, sfid

- [ ] **Step 3: Add WhatsApp DM onboarding per row**

Use `registry-utils.js`:
- `telegramLink = getTelegramLinkForTrack(trainee.track)`
- `message = buildWhatsappMessage({ name: trainee.name, track: trainee.track, telegramLink })`
- `url = buildWhatsappLink({ phone: trainee.phone || trainee.whatsapp || trainee.whatsApp, text: message })`
- `window.open(url, '_blank')`

- [ ] **Step 4: Add bulk export**

Add buttons:
- Export CSV (current track results)
- Copy all numbers (current track results)

- [ ] **Step 5: Link from dashboards**

Add a sidebar/nav link “Trainee Registry” → `/staffs/registry/` in:
- Director
- HOD
- Marketing
- Support

- [ ] **Step 6: Commit**

```bash
cd /workspace/portal
git add staffs/registry/index.html staffs/director/index.html staffs/hod/index.html staffs/marketing/index.html staffs/support/index.html
git commit -m "feat(staff): add shared trainee registry with whatsapp onboarding"
```

---

### Task 4: Password Reset UX improvements + WhatsApp Support Fallback

**Files:**
- Modify: `/workspace/portal/trainee-login/forgot-password.html`
- Modify: `/workspace/portal/staffs/login/forgot-password.html`
- Modify: `/workspace/portal/trainee-login/reset-password.html`
- Modify: `/workspace/portal/staffs/login/reset-password.html`

- [ ] **Step 1: Add WhatsApp support button**

On forgot-password pages:
- Add a button linking to `https://wa.me/2349015185711?text=<encoded>` with a message like:
  - “Password Reset Help — Email: {email}”

On reset-password error state:
- Add the same support link.

- [ ] **Step 2: Improve “email sent” UX**

On forgot-password pages:
- Normalize email to lowercase before submit
- On success, show:
  - “Reset email sent to: {email}”
  - “Check Spam/Promotions”
  - “Resend in 60s” cooldown timer (client-side)

- [ ] **Step 3: Ensure reset link routes back to portal**

On forgot-password pages using `sendPasswordResetEmail(auth, email)`:
- Pass `actionCodeSettings` with URL set to the portal reset page:
  - Trainee: `https://portal.skillforgedigital.com.ng/trainee-login/reset-password.html`
  - Staff: `https://portal.skillforgedigital.com.ng/staffs/login/reset-password.html`

- [ ] **Step 4: Commit**

```bash
cd /workspace/portal
git add trainee-login/forgot-password.html trainee-login/reset-password.html staffs/login/forgot-password.html staffs/login/reset-password.html
git commit -m "fix(reset): add whatsapp support fallback and action url settings"
```

---

### Task 5: Final Verification + Push

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

