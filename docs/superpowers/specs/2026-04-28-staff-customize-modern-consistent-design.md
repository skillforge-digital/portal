# Staff Customize Modernization (Portal Only)

Date: 2026-04-28

## Objective

Make all Staff Customize pages:

- Match the Trainee Customize UI layout (modern, consistent)
- Behave consistently across roles (Director/HOD/Specialist/Marketing/Support)
- Fix broken/unreliable clicking on mobile/desktop
- Ensure selection state is visible (active border/selected state)
- Ensure premium fonts show accurate previews (Google Fonts only)
- Save and load a single canonical theme payload under `theme`

## Scope

In scope:

- `/staffs/director/customize/`
- `/staffs/hod/customize/`
- `/staffs/specialist/customize/`
- `/staffs/marketing/customize/`
- `/staffs/support/customize/`

Out of scope:

- Trainee Customize redesign (already the reference layout)
- Main website theming

## Current Issues

- UI inconsistencies: each staff role customize page diverges in layout and content.
- Selection feedback missing: `updatePreview()` clears `.active` but does not re-apply it to the selected item, making clicks appear broken.
- Click reliability issues on mobile: hover-scale + global `transition: all` + overlapping transforms can cause mis-taps and delayed interactions.
- Font list includes non-Google fonts that are not actually loaded, so previews are misleading.
- Theme persistence is fragmented: some parts saved inside `theme`, but runtime readers may expect top-level fields.

## Design

### 1) Single Shared UI Layout

All staff customize pages use the same visual structure as Trainee Customize:

- Header with “Design Studio” + tab switch (Colors / Wallpapers / Fonts)
- Left: selection grids
- Right: preview + controls + save

Only per-role differences:

- Label strings (e.g. “Director Forge”, “HOD Unit”)
- Optional accent color (may still use role accent, but layout stays identical)

### 2) Shared “Customize Engine”

Introduce a shared module used by all staff customize pages:

- Generates the grids (dual colors, gradients, wallpapers, fonts)
- Owns current state: `currentDesign`
- Renders selection + preview
- Implements Save/Restore/Upload wallpaper behavior

Each role’s `index.html` becomes a thin wrapper:

- Provides role metadata (collection + accent + label)
- Loads the shared module and passes config

### 3) Reliable Clicking + Visible Selection

Selection state:

- Each swatch/card stores its identity in `data-*` attributes.
- Clicking updates:
  - `currentDesign`
  - the preview
  - active classes:
    - `.active` on selected element
    - `aria-selected="true"` for accessibility

Event handling:

- Use event delegation (`grid.addEventListener('click', ...)`) rather than per-item `onclick` assignments.
- Ensure `touch-action: manipulation` on clickable items.

Animation safety:

- Remove global `* { transition: all }`.
- Restrict transitions to `transform`, `box-shadow`, and background-related properties.
- Apply hover animations only under `@media (hover: hover)`.

### 4) Fonts (Google Fonts Only) + Preview Samples

- Font catalog is restricted to Google Fonts that can be loaded reliably.
- Font cards show real typography preview:
  - “SkillForge Command Center”
  - “Aa Bb Cc — 0123456789”
  - “The quick brown fox jumps over the lazy dog.”

When a font is selected:

- Ensure it is loaded via Google Fonts stylesheet injection (once per font).
- Apply to preview and save to:
  - `theme.fontFamily`
  - `theme.fontName`

### 5) Canonical Theme Persistence

On Save, write the same payload shape everywhere:

- `theme.type`
- `theme.primary`, `theme.secondary`
- `theme.c1`, `theme.c2`
- `theme.wallpaper`
- `theme.fontFamily`, `theme.fontName`
- `theme.canvasActive`, `theme.canvasColors` (if present)

Load behavior:

- Initialize `currentDesign` from `data.theme` only (with defaults).

## Acceptance Criteria

- All staff customize pages look identical to trainee customize in layout and quality.
- Clicking any swatch/font/wallpaper visibly marks it selected and updates preview instantly.
- Mobile taps work consistently (no dead zones).
- Font previews match the real fonts (Google Fonts only).
- Saving persists the full theme and dashboards reflect it via ThemeManager.

