# Scholarship Landing + Page Breakage Audit

Date: 2026-04-30

## Objective

- Ship a dedicated, polished Scholarship landing page that routes into the existing Trainee Registration flow while tagging scholarship trainees.
- Eliminate “broken CSS / skeleton UI” behavior on the Scholarship page and address known recurring breakage patterns across Portal + Academy pages.

## Scope

### Portal (`portal.skillforgedigital.com.ng`)

- Scholarship landing page under `/scholarship/` (and a typo-redirect `/scholaship/`).
- Scholarship CTA routes to the existing registration page: `/trainee-registration/?scholarship=1`.
- Trainee registration writes a scholarship tag into `trainees/{uid}` when `scholarship=1`.
- Remove scholarship landing links to staff portal and external WhatsApp/email CTAs.

### Main Academy Site (`skillforgedigital.com.ng`)

- Fix recurring client-side rendering errors that degrade UX:
  - invalid SVG path data injected into lesson pages
  - inconsistent gate script URL loading
  - missing tracking script on lesson pages (time spent / login-days)

## Design

### 1) Scholarship Landing Page (Portal)

Problem
- Scholarship page uses Tailwind utility classes but does not load the Tailwind CSS bundle used across the portal, which causes “unstyled” rendering that looks like a broken skeleton.

Solution
- Align Scholarship head includes with the portal’s CSS stack:
  - `/assets/style.css`
  - `/assets/tailwind.css`
  - `/assets/tailwind-runtime-stub.js`
  - `/assets/responsive.css`
- Layout/content goals:
  - strong hero section with a single primary CTA
  - “Purpose / what you get / how it works / eligibility” sections
  - optional secondary CTA to “Already registered? Login”
- Link policy:
  - Keep portal navigation (Portal Home)
  - Remove staff links and remove external WhatsApp/email CTAs

Acceptance Criteria
- Scholarship page renders with correct spacing/typography/colors on mobile and desktop.
- No staff portal links and no WhatsApp/email “apply” buttons exist on the scholarship page.

### 2) Scholarship Registration (Reuse Existing Trainee Registration)

Chosen Approach
- Route scholarship applicants into the existing registration flow with a query param:
  - `/trainee-registration/?scholarship=1`

Tagging Rules
- When `scholarship=1`, registration writes the following fields into `trainees/{uid}`:
  - `scholarship: true`
  - `scholarshipSource: "portal_scholarship"`
  - `scholarshipAppliedAt: serverTimestamp()`

No Firestore Rules Changes Needed
- Existing rules already allow:
  - `create` on `/trainees/{uid}` for the authenticated user
  - `create` on `/track_access/{pin}` for the authenticated user
- Scholarship tagging is just additional fields inside the same allowed write.

Acceptance Criteria
- `?scholarship=1` results in scholarship fields being present in the created `trainees/{uid}` document.
- Normal (non-scholarship) registration remains unchanged.

### 3) “Fix Every Broken Page” (Audit + Targeted Repairs)

Definition of “broken” (in scope)
- Pages that render without the expected CSS (missing required CSS bundle includes while using Tailwind classes).
- Known recurring runtime console errors that break/disable key UX:
  - invalid SVG path data (e.g. `3.93$.502` in SVG `d` attributes)
  - inconsistent relative path to `academy/gate.js` in deeply nested lesson pages
  - missing academy tracking script on lesson pages (time spent / login days not recorded)

Approach
- Run repo-wide checks on:
  - `portal/**/*.html`
  - `skillforge-website/**/*.html`
- Apply targeted transformations only for identified patterns, avoiding stylistic churn.

Acceptance Criteria
- Scholarship page no longer appears “unstyled”.
- Academy lesson pages no longer throw the SVG `Expected number` error.
- Academy lesson pages reliably load the gate script.
- Academy tracking runs on lesson pages when a valid gate session cookie exists.

