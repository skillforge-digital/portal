# Stability + Polish Layer (Code-Only)

Date: 2026-04-28

## Objective

Ship code-only improvements that increase stability, reduce mobile jank, and improve user confidence across the Portal + Main site without requiring external console access.

## Scope

### Portal

- WebGL / Three.js fallback so low-end devices never crash or show disruptive errors.
- Reduce CLS by adding explicit image dimensions (starting with repeated logo images).
- Standardize auth + registration UX feedback (success + error presentation).

### Main Site

- Reduce CLS by adding explicit image dimensions for repeated logo images.

## Changes

### 1) WebGL fallback

Problem:
- Some devices fail WebGL context creation; current 3D background boot can throw and degrade UX.

Solution:
- Add `assets/webgl-guard.js` to set a global `window.__SF_WEBGL_OK` boolean.
- Update `assets/sf-atmosphere-3d.js` to:
  - early-exit if WebGL is unavailable
  - wrap initialization in try/catch
  - never throw globally
- Inject the guard script on pages that load `sf-atmosphere-3d.js`.

### 2) CLS reduction (images)

Problem:
- Repeated images (brand logo) are inserted without explicit `width`/`height`, causing layout shift on slower devices.

Solution:
- Add `width` and `height` attributes to the common logo image usages when a deterministic size exists (e.g. Tailwind `w-6 h-6`, `w-10 h-10`).
- Avoid changing responsive full-bleed images that rely on container sizing.

### 3) Auth + registration UX consistency

Problem:
- Users report “it fell back” when success feedback is unclear; errors can feel silent or abrupt.

Solution:
- Ensure key flows show an immediate “Saved/Success” confirmation state on completion (before optional onboarding steps).
- Ensure error containers are visible and announced consistently.

## Acceptance Criteria

- No WebGL-related runtime errors block page usage on unsupported devices.
- Common logo images no longer contribute to CLS on load.
- Registration/login flows clearly indicate success and do not “feel like” they reset.

