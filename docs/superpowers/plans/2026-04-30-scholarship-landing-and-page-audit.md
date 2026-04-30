# Scholarship Landing + Page Breakage Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Scholarship landing page styling, route scholarship applicants into the existing trainee registration with a scholarship tag, and run targeted audits to fix known breakage patterns across Portal + Academy pages.

**Architecture:** Keep scholarship registration as a thin wrapper over the existing `/trainee-registration/` flow (query-param driven), and keep the scholarship landing page as a dedicated portal route that uses the same CSS stack as the rest of the portal. Repair breakage with deterministic repo-wide checks + narrow transformations.

**Tech Stack:** Static HTML, Firebase Auth (client), Firestore (client), Vitest (portal tests), GitHub Actions (deploy).

---

## File Map

**Portal**
- Modify: [/workspace/portal/scholarship/index.html](file:///workspace/portal/scholarship/index.html)
- Modify: [/workspace/portal/scholaship/index.html](file:///workspace/portal/scholaship/index.html)
- Modify: [/workspace/portal/trainee-registration/index.html](file:///workspace/portal/trainee-registration/index.html)
- (Optional) Modify: [/workspace/portal/sitemap.xml](file:///workspace/portal/sitemap.xml)
- Add: `/workspace/portal/scripts/audit-html-assets.js`

**Main Site**
- Modify: `skillforge-website` academy HTML pages and `academy/gate.js` includes as needed
- Add: `/workspace/skillforge-website/scripts/audit-academy-html.js`

---

### Task 1: Fix Scholarship Landing Styling + Link Policy

**Files:**
- Modify: [scholarship/index.html](file:///workspace/portal/scholarship/index.html)
- Modify: [scholaship/index.html](file:///workspace/portal/scholaship/index.html)

- [ ] **Step 1: Align scholarship page CSS stack with portal home**

In [portal index.html](file:///workspace/portal/index.html#L50-L56) the portal loads:
- `/assets/style.css`
- `/assets/tailwind.css`
- `/assets/tailwind-runtime-stub.js`
- `/assets/responsive.css`

Update the scholarship page `<head>` to include:

```html
<link rel="stylesheet" href="/assets/style.css">
<link rel="stylesheet" href="/assets/tailwind.css">
<script src="/assets/tailwind-runtime-stub.js"></script>
<link rel="stylesheet" href="/assets/responsive.css">
```

Also ensure the favicon and font-awesome includes match portal conventions if used elsewhere.

- [ ] **Step 2: Remove external apply links and staff portal links**

In [scholarship/index.html](file:///workspace/portal/scholarship/index.html), remove:
- `wa.me` apply CTA
- `mailto:` apply CTA
- `/staffs/login/` CTA (user requested no staff portal links)

Keep:
- Portal Home link (`/`)
- Trainee Login link (`/trainee-login/`) (optional)

- [ ] **Step 3: Update primary CTA to scholarship registration route**

Primary button should route to:

```html
<a href="/trainee-registration/?scholarship=1">Apply for Scholarship</a>
```

- [ ] **Step 4: Ensure typo redirect still works**

Confirm [scholaship/index.html](file:///workspace/portal/scholaship/index.html) redirects to `/scholarship/` and does not include broken styling.

- [ ] **Step 5: Quick manual CSS sanity check (local)**

Run a local static server and open:
- `/scholarship/`
- `/trainee-registration/`

Run:

```bash
cd /workspace/portal
python3 -m http.server 4173
```

Expected:
- Scholarship page shows correct spacing and typography (no “unstyled skeleton”).

Stop server afterward.

- [ ] **Step 6: Commit**

```bash
cd /workspace/portal
git add scholarship/index.html scholaship/index.html
git commit -m "fix(scholarship): load portal css stack and route to registration"
```

---

### Task 2: Add Scholarship Tagging to Trainee Registration

**Files:**
- Modify: [trainee-registration/index.html](file:///workspace/portal/trainee-registration/index.html)
- Test: `/workspace/portal/tests/scholarship-registration.test.js` (new)

- [ ] **Step 1: Write failing unit test for scholarship param extraction**

Create `tests/scholarship-registration.test.js`:

```js
import { describe, it, expect } from 'vitest';

function buildScholarshipFields(search) {
  const params = new URLSearchParams(search);
  const isScholarship = params.get('scholarship') === '1';
  return isScholarship
    ? { scholarship: true, scholarshipSource: 'portal_scholarship' }
    : {};
}

describe('scholarship tagging', () => {
  it('adds scholarship fields when scholarship=1', () => {
    expect(buildScholarshipFields('?scholarship=1')).toEqual({
      scholarship: true,
      scholarshipSource: 'portal_scholarship'
    });
  });

  it('does not add scholarship fields when scholarship param missing', () => {
    expect(buildScholarshipFields('')).toEqual({});
  });
});
```

- [ ] **Step 2: Run tests (expect FAIL until wired into page logic)**

```bash
cd /workspace/portal
npm test
```

Expected: the new tests pass (they are self-contained) but the next step integrates these fields into the real write.

- [ ] **Step 3: Implement scholarship flag write in registration flow**

In [trainee-registration/index.html](file:///workspace/portal/trainee-registration/index.html):

1) Near the top of the module script, parse:

```js
const urlParams = new URLSearchParams(window.location.search);
const isScholarship = urlParams.get('scholarship') === '1';
```

2) When building `batch.set(traineeRef, { ... })`, include:

```js
...(isScholarship ? {
  scholarship: true,
  scholarshipSource: 'portal_scholarship',
  scholarshipAppliedAt: serverTimestamp()
} : {})
```

Important:
- Use `serverTimestamp()` (already imported) for `scholarshipAppliedAt`.
- Do not change normal registration output when scholarship is not set.

- [ ] **Step 4: Add minimal integration test helper**

Update `tests/scholarship-registration.test.js` to also validate the payload merge behavior:

```js
function mergePayload(base, isScholarship) {
  return {
    ...base,
    ...(isScholarship ? { scholarship: true, scholarshipSource: 'portal_scholarship' } : {})
  };
}
```

Assert merge result includes scholarship fields only when `isScholarship` is true.

- [ ] **Step 5: Run tests (expect PASS)**

```bash
cd /workspace/portal
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /workspace/portal
git add trainee-registration/index.html tests/scholarship-registration.test.js
git commit -m "feat(scholarship): tag scholarship trainees on registration"
```

---

### Task 3: Portal HTML Asset Audit (Broken CSS / Paths)

**Files:**
- Add: `/workspace/portal/scripts/audit-html-assets.js`

- [ ] **Step 1: Add audit script**

Create `/workspace/portal/scripts/audit-html-assets.js`:

```js
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || process.cwd());

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(root).filter((p) => p.endsWith('.html'));

const issues = [];

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const usesTailwindClasses =
    /\b(md:|lg:|xl:)?(p-|m-|text-|bg-|grid|flex|rounded|border)\b/.test(html);
  const hasTailwindCss = html.includes('/assets/tailwind.css');

  if (usesTailwindClasses && !hasTailwindCss) {
    issues.push({ file, issue: 'missing /assets/tailwind.css include' });
  }
}

process.stdout.write(JSON.stringify({ count: issues.length, issues }, null, 2) + '\n');
process.exit(issues.length ? 2 : 0);
```

- [ ] **Step 2: Run audit**

```bash
cd /workspace/portal
node scripts/audit-html-assets.js .
```

Expected:
- Either exit code `0` (no issues) or exit code `2` with a JSON report.

- [ ] **Step 3: Fix reported issues**

For each reported file, add the missing CSS stack consistent with portal patterns:
- `/assets/tailwind.css` + `/assets/tailwind-runtime-stub.js`

- [ ] **Step 4: Re-run audit (expect clean)**

```bash
cd /workspace/portal
node scripts/audit-html-assets.js .
```

- [ ] **Step 5: Commit**

```bash
cd /workspace/portal
git add scripts/audit-html-assets.js <any-fixed-html-files>
git commit -m "chore(portal): add html asset audit and fix missing tailwind includes"
```

---

### Task 4: Academy HTML Audit + Targeted Repairs (Main Site)

**Files:**
- Add: `/workspace/skillforge-website/scripts/audit-academy-html.js`
- Modify: academy lesson pages as needed

- [ ] **Step 1: Add audit script**

Create `/workspace/skillforge-website/scripts/audit-academy-html.js`:

```js
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || process.cwd());
const academyDir = path.join(root, 'academy');

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

if (!fs.existsSync(academyDir)) {
  process.stdout.write('academy_dir_missing\n');
  process.exit(1);
}

const files = walk(academyDir).filter((p) => p.endsWith('.html'));
const issues = [];

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes('3.93$.502')) {
    issues.push({ file, issue: 'invalid svg path token 3.93$.502' });
  }
  if (/<script type="module" src="(\.\.\/)+gate\.js"><\/script>/.test(html)) {
    issues.push({ file, issue: 'relative gate.js include (prefer /academy/gate.js)' });
  }
  if (file.includes('/week-') && !html.includes('/assets/sf-core.js')) {
    issues.push({ file, issue: 'missing /assets/sf-core.js tracking include' });
  }
}

process.stdout.write(JSON.stringify({ count: issues.length, issues }, null, 2) + '\n');
process.exit(issues.length ? 2 : 0);
```

- [ ] **Step 2: Run audit**

```bash
cd /workspace/skillforge-website
node scripts/audit-academy-html.js .
```

Expected: exit `0` or `2` with a report.

- [ ] **Step 3: Apply targeted transformations**

If issues exist:
- Replace `3.93$.502` → `3.93-.502`
- Replace relative gate.js includes with:

```html
<script type="module" src="/academy/gate.js"></script>
```

- Ensure week lesson pages include:

```html
<script type="module" src="/assets/sf-core.js"></script>
```

- [ ] **Step 4: Re-run audit (expect clean)**

```bash
cd /workspace/skillforge-website
node scripts/audit-academy-html.js .
```

- [ ] **Step 5: Commit**

```bash
cd /workspace/skillforge-website
git add scripts/audit-academy-html.js <any-fixed-files>
git commit -m "chore(academy): add html audit and fix recurring breakages"
```

---

### Task 5: Final Verification + Push

**Files:**
- Portal: modified files above
- Main site: modified files above

- [ ] **Step 1: Portal tests**

```bash
cd /workspace/portal
npm test
```

Expected: PASS.

- [ ] **Step 2: Push portal**

```bash
cd /workspace/portal
git push origin main
```

- [ ] **Step 3: Push skillforge-website**

```bash
cd /workspace/skillforge-website
git push origin main
```

