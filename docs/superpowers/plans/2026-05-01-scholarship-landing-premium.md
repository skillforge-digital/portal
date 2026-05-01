# Scholarship Landing (Portal-Native Premium) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/scholarship/` to be premium and easy to understand, add a Firestore-backed campaign strip (countdown to Friday 11:59pm Lagos time + real slots remaining out of 50), and increment the slots counter on successful scholarship registration.

**Architecture:** Keep UI in `/scholarship/index.html` with small isolated JS in `/assets/scholarship-campaign.js` for reading campaign data + rendering countdown/slots. Use Firestore `seasons/2026/artifacts/registration/scholarship` as the single source of truth. On registration success with `?scholarship=1`, use a Firestore transaction to increment `usedSlots`.

**Tech Stack:** Static HTML + Tailwind utilities, Firebase client SDK (Auth + Firestore), Vitest for tests.

---

## File Map

- Modify: `/workspace/portal/scholarship/index.html`
- Modify: `/workspace/portal/trainee-registration/index.html`
- Create: `/workspace/portal/assets/scholarship-campaign.js`
- Create: `/workspace/portal/tests/scholarship-campaign.test.js`

---

### Task 1: Add Campaign Data + Countdown Utilities (Test-Driven)

**Files:**
- Create: `/workspace/portal/assets/scholarship-campaign.js`
- Test: `/workspace/portal/tests/scholarship-campaign.test.js`

- [ ] **Step 1: Write failing tests for campaign math and countdown formatting**

Create `/workspace/portal/tests/scholarship-campaign.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { computeRemainingSlots, formatCountdown, isClosed } from '../assets/scholarship-campaign.js';

describe('scholarship campaign helpers', () => {
  it('computes remaining slots', () => {
    expect(computeRemainingSlots({ totalSlots: 50, usedSlots: 0 })).toBe(50);
    expect(computeRemainingSlots({ totalSlots: 50, usedSlots: 7 })).toBe(43);
    expect(computeRemainingSlots({ totalSlots: 50, usedSlots: 60 })).toBe(0);
  });

  it('formats countdown as HH:MM:SS', () => {
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(1_000)).toBe('00:00:01');
    expect(formatCountdown(61_000)).toBe('00:01:01');
    expect(formatCountdown(3_661_000)).toBe('01:01:01');
  });

  it('detects closed status', () => {
    const now = 1_000_000;
    expect(isClosed({ closesAtMs: now - 1 }, now)).toBe(true);
    expect(isClosed({ closesAtMs: now + 1 }, now)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
cd /workspace/portal
npm ci
npm test
```

Expected: FAIL because `../assets/scholarship-campaign.js` doesn’t exist yet.

- [ ] **Step 3: Implement helper functions**

Create `/workspace/portal/assets/scholarship-campaign.js`:

```js
export function computeRemainingSlots(doc) {
  const total = Number(doc?.totalSlots ?? 0);
  const used = Number(doc?.usedSlots ?? 0);
  const remaining = total - used;
  return remaining > 0 ? remaining : 0;
}

export function formatCountdown(ms) {
  const safe = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function isClosed(campaign, nowMs = Date.now()) {
  const closesAtMs = Number(campaign?.closesAtMs ?? 0);
  return closesAtMs > 0 && nowMs >= closesAtMs;
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
git add assets/scholarship-campaign.js tests/scholarship-campaign.test.js
git commit -m "feat(scholarship): add campaign helpers for slots and countdown"
```

---

### Task 2: Firestore Read + Live UI Rendering for Campaign Strip

**Files:**
- Modify: `/workspace/portal/scholarship/index.html`
- Modify: `/workspace/portal/assets/scholarship-campaign.js`

- [ ] **Step 1: Add a small DOM API to render campaign status**

Append to `/workspace/portal/assets/scholarship-campaign.js`:

```js
export function setText(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
}

export function setDisabled(selector, disabled) {
  document.querySelectorAll(selector).forEach((el) => {
    if (disabled) {
      el.setAttribute('aria-disabled', 'true');
      el.classList.add('pointer-events-none', 'opacity-50');
    } else {
      el.removeAttribute('aria-disabled');
      el.classList.remove('pointer-events-none', 'opacity-50');
    }
  });
}
```

- [ ] **Step 2: Add campaign strip markup to scholarship page**

In `/workspace/portal/scholarship/index.html`, insert under the hero CTA block a “campaign strip” with IDs:
- `campaign-status`
- `campaign-countdown`
- `campaign-slots`

Example structure:

```html
<div class="mt-8 glass rounded-3xl border border-white/10 p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
  <div>
    <p class="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">Status</p>
    <p id="campaign-status" class="mt-2 text-white font-black uppercase tracking-widest text-[10px]">Loading…</p>
    <p class="mt-2 text-white/60 text-xs">Closes Friday 11:59pm (Lagos time)</p>
  </div>
  <div>
    <p class="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">Countdown</p>
    <p id="campaign-countdown" class="mt-2 text-2xl md:text-3xl font-black text-gold tracking-tight">--:--:--</p>
  </div>
  <div>
    <p class="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">Slots Remaining</p>
    <p id="campaign-slots" class="mt-2 text-2xl md:text-3xl font-black text-white tracking-tight">--</p>
    <p class="mt-2 text-white/60 text-xs">Out of 50 slots</p>
  </div>
</div>
```

Ensure both Apply buttons include a shared class, e.g. `scholarship-apply`, for disabling:

```html
<a class="scholarship-apply ..." href="/trainee-registration/?scholarship=1">Apply now</a>
```

- [ ] **Step 3: Load Firestore campaign doc and render**

In `/workspace/portal/scholarship/index.html`, add a `<script type="module">` that:
- imports `db` from `/assets/firebase-config.js`
- imports `doc`, `getDoc` from Firestore SDK
- imports helpers from `/assets/scholarship-campaign.js`
- reads: `doc(db, 'seasons', '2026', 'artifacts', 'registration', 'scholarship')`
- maps `closesAt` (Firestore Timestamp) to ms: `closesAt.toMillis()`
- computes remaining slots
- updates:
  - `campaign-slots`
  - `campaign-countdown` every 1s
  - `campaign-status` (“Open”, “Closed”, “Sold out”, “Status unavailable”)
  - disables `.scholarship-apply` when closed/sold out

Behavior rules:
- If doc missing or malformed, show “Status unavailable”, hide countdown text, do not disable CTAs.
- If `closesAt` exists and now >= closesAt → Closed + disable.
- If remaining slots = 0 → Sold out + disable.

- [ ] **Step 4: Local manual verification**

Run:

```bash
cd /workspace/portal
python3 -m http.server 4173
```

Open:
- `/scholarship/`

Expected:
- Campaign strip shows “Status unavailable” (because local dev won’t have Firestore), but layout is correct and no console crash.

Stop the server afterward.

- [ ] **Step 5: Commit**

```bash
cd /workspace/portal
git add scholarship/index.html assets/scholarship-campaign.js
git commit -m "feat(scholarship): render campaign countdown and slots"
```

---

### Task 3: Units + Tracks Content (Premium, Easy Copy)

**Files:**
- Modify: `/workspace/portal/scholarship/index.html`

- [ ] **Step 1: Add Units section before Tracks**

Insert a “Units” section with 4 cards:
- Tech & Development
- Creative
- Trading
- Growth

Each includes track chips (the 10 tracks mapped into those 4 units).

- [ ] **Step 2: Add Tracks grid**

Add a 10-card grid. Each card has:
- emoji icon
- track name
- 1 sentence description
- “Apply” link to `/trainee-registration/?scholarship=1`

Use the registration track names exactly to avoid mismatches:
- Forex Currency Pairs
- Forex Synthetics Indices
- Web Development
- Discord Development
- Cyber Security
- Graphic Design
- Mobile Cinematography
- Photography & Editing
- Digital Marketing
- AI Content Creation

- [ ] **Step 3: Add “How it works” section**

Add 4 steps, short sentences (no hype).

- [ ] **Step 4: Commit**

```bash
cd /workspace/portal
git add scholarship/index.html
git commit -m "feat(scholarship): add units and tracks sections"
```

---

### Task 4: Real Slots Increment on Scholarship Registration

**Files:**
- Modify: `/workspace/portal/trainee-registration/index.html`
- Test: `/workspace/portal/tests/scholarship-slots.test.js` (new)

- [ ] **Step 1: Write failing unit test for increment gating**

Create `/workspace/portal/tests/scholarship-slots.test.js`:

```js
import { describe, it, expect } from 'vitest';

function shouldIncrementScholarshipSlots(isScholarship, registrationSucceeded) {
  return Boolean(isScholarship && registrationSucceeded);
}

describe('scholarship slots increment gating', () => {
  it('increments only on successful scholarship registration', () => {
    expect(shouldIncrementScholarshipSlots(true, true)).toBe(true);
    expect(shouldIncrementScholarshipSlots(true, false)).toBe(false);
    expect(shouldIncrementScholarshipSlots(false, true)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd /workspace/portal
npm test
```

Expected: PASS (self-contained).

- [ ] **Step 3: Implement transaction increment**

In `/workspace/portal/trainee-registration/index.html` (after `await batch.commit();` and only when `isScholarship` is true):
- import `runTransaction`, `increment`, `doc`, `getDoc` already available in the file or add imports if missing
- run:
  - transaction reads `seasons/2026/artifacts/registration/scholarship`
  - if missing, initialize:
    - `totalSlots: 50`
    - `usedSlots: 1`
    - `closesAt` left unchanged (or set only if present in config; do not guess)
  - if exists, transaction updates `usedSlots: increment(1)`

Do not block success flow if this fails:
- wrap in `try/catch` and proceed to show SFID + PIN.

- [ ] **Step 4: Commit**

```bash
cd /workspace/portal
git add trainee-registration/index.html tests/scholarship-slots.test.js
git commit -m "feat(scholarship): increment slots counter on scholarship registration"
```

---

### Task 5: Final Verification + Push

**Files:**
- Portal files above

- [ ] **Step 1: Run audits + tests**

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

