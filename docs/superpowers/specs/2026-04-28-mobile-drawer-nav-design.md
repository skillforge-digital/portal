# Mobile Drawer Navigation (Staff + Trainee Dashboards)

Date: 2026-04-28

## Objective

Make the portal dashboards fully usable on mobile/tablet by adding a consistent hamburger-driven drawer navigation for:
- Staff dashboards: Director, HOD, Specialist, Marketing, Support
- Trainee dashboard pages (including subpages)

Keep desktop UI unchanged.

## UX Design

### Mobile Top Bar

On small screens:
- Show a sticky top bar containing:
  - Left: hamburger button
  - Center: page title (role/page name)
  - Right: key action(s) already present on the page (default: Logout)

### Drawer Behavior

On hamburger click:
- Open a left-side drawer with the existing navigation links.
- Background dims (overlay).
- Close drawer when:
  - user taps overlay
  - user taps a nav link
  - user presses Escape (desktop keyboards)

### Desktop Behavior

On medium/large screens:
- Existing sidebar stays visible as currently implemented.
- No layout changes required.

## Technical Design

### Shared Assets

- `/assets/mobile-drawer.css`
  - Off-canvas positioning for the sidebar on small screens only.
  - Overlay styling.
  - Safe-area insets for notch devices.
  - `prefers-reduced-motion` respected (no heavy animation).

- `/assets/mobile-drawer.js`
  - Adds hamburger button if not present.
  - Detects the sidebar container and toggles open/close classes.
  - Adds overlay element (single instance per page).
  - Adds accessibility attributes:
    - hamburger: `aria-label`, `aria-expanded`
    - drawer: `role="dialog"` and `aria-modal="true"` (lightweight)

### Page Integration

Include both assets on:
- `/staffs/*/index.html` and related staff dashboard subpages (customize/dmc where relevant)
- `/trainee-dashboard/**`
- `/specialist-dashboard/**` (legacy dashboard family; keep consistent)

Integration is done as a light HTML include:
- `<link rel="stylesheet" href="/assets/mobile-drawer.css">`
- `<script defer src="/assets/mobile-drawer.js"></script>`

## Acceptance Criteria

- On mobile, a hamburger is visible and usable on all specified pages.
- Drawer opens/closes correctly; no page content becomes unreachable.
- Tap targets are thumb-friendly (no dead zones).
- Desktop UI remains unchanged.

