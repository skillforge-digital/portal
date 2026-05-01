# Scholarship Landing (Portal-Native Premium) — Design

Date: 2026-05-01

## Goal

Create a scholarship landing page that feels premium (not template-y), is easy to understand, clearly presents the 4 units + all tracks before registration, and includes a fixed-deadline countdown and real slots remaining.

## Non-Goals

- No separate scholarship registration form page (reuse `/trainee-registration/?scholarship=1`).
- No new external “apply” channels (no WhatsApp/email CTAs on the landing).
- No new share/flyer image asset (keep `og:image` as the existing portal logo).

## UX Requirements

### Above the fold (Hero)

- Headline emphasizes scarcity and clarity (50 slots, what it is).
- Subhead explains the path in one sentence (choose unit → pick track → register → onboard).
- Primary CTA routes to `/trainee-registration/?scholarship=1`.
- Secondary CTA scrolls to Units/Tracks.

### Campaign Strip

Display:
- Countdown to a fixed deadline: **Friday 11:59pm Nigeria time** (drive via Firestore `closesAt`).
- Slots remaining: real value from Firestore (`totalSlots - usedSlots`), total slots fixed at **50**.

State rules:
- If `now >= closesAt` → show “Closed” status and disable Apply CTAs.
- If `remainingSlots <= 0` → show “Sold out” status and disable Apply CTAs.
- Otherwise “Open” and enable Apply CTAs.

### Units (4) + Tracks (10)

Show units as a clean section before the main Tracks grid. Each unit has:
- unit name
- 1–2 line description
- track chips/cards under it

Unit mapping:
- **Tech & Development**: Web Development, Discord Development, Cyber Security
- **Creative**: Graphic Design, Mobile Cinematography, Photography & Editing
- **Trading**: Forex Currency Pairs, Forex Synthetics Indices
- **Growth**: Digital Marketing, AI Content Creation

### Tracks Grid

Display all 10 tracks with:
- icon
- track name
- single-sentence description (reuse phrasing from `skillforge-website/tracks/` where suitable)
- a small CTA that routes to `/trainee-registration/?scholarship=1` (or scroll to hero CTA)

### How It Works

4-step explanation:
1) Pick a unit + track
2) Register on portal (scholarship tagged)
3) Onboard and complete milestones
4) Join supervised execution and earn based on delivery

### Repeat CTA

After Tracks + How-it-works, include an additional “Apply now” CTA so users don’t scroll back to the top.

## Technical Requirements

### Files

- Modify: `/workspace/portal/scholarship/index.html`
- Modify: `/workspace/portal/trainee-registration/index.html`
- Add (optional, recommended for code hygiene): `/workspace/portal/assets/scholarship-campaign.js` (countdown + slots fetch)

### Firestore Data Model

Document:
- `seasons/2026/artifacts/registration/scholarship`

Fields:
- `totalSlots: 50`
- `usedSlots: number`
- `closesAt: timestamp`

Notes:
- Existing rules allow read/write for `seasons/2026/artifacts/registration/{docId}` publicly, so no Firestore rule changes are required.

### Slots Increment Integration

On successful trainee registration when `scholarship=1`:
- increment `usedSlots` via `runTransaction` on `seasons/2026/artifacts/registration/scholarship`
- do not increment for non-scholarship registrations
- do not block registration if the counter update fails (registration success is higher priority); but the UI should surface a non-blocking log and proceed

### Countdown

- Read `closesAt` from the scholarship campaign doc
- Render “HH:MM:SS” countdown and a short “Closes Friday 11:59pm (Nigeria time)” label
- If `closesAt` missing, fallback to hiding the countdown and showing a neutral status label (“Status unavailable”)

### Share Preview

- Keep `og:image` as `/assets/brand-logo.jpg`
- Improve meta title/description to match the new copy

## Accessibility / Content Guidelines

- Buttons are real `<a>` links (not `onclick` divs).
- All icons have accessible text via adjacent text or appropriate `aria-label`.
- Copy avoids exaggerated claims and keeps the flow simple and factual.

## Acceptance Criteria

- Scholarship landing reads clearly and looks premium, not like a generic template.
- Units section appears before the tracks list and before the repeated CTA.
- Countdown and slots update live and reflect Firestore values.
- Apply buttons disable correctly for “Closed” or “Sold out”.
- Registration via `/trainee-registration/?scholarship=1` still works and results in scholarship tagging (already implemented).
- `npm test` passes.
