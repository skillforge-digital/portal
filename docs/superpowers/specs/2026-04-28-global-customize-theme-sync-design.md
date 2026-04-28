# Global Customize Theme Sync (Portal Only)

Date: 2026-04-28

## Objective

Make all Portal dashboards (Staff + Trainee) consistently:

- Listen to all Customize components (colors, gradients, wallpapers, fonts, canvas settings)
- Apply updates immediately after a commit/save
- Persist the same data shape so any dashboard can render the saved result
- Provide accurate premium font previews (Google Fonts only)

## Problems Observed

- Multiple Customize implementations save to different collections (`directors`, `hods`, `specialists`, `staffs`, `trainees`).
- Theme data is partially stored/read (some pages read `theme`, others use top-level `fontFamily` or `wallpaper`).
- Dashboards do not always “hear” committed changes from Customize because they do not listen to the same registry doc.
- Some “premium fonts” are not actually loaded, so previews are misleading and saved fonts won’t render reliably.

## Scope

In scope:

- Portal pages only:
  - `/trainee-dashboard/**`
  - `/staffs/**`
  - `/specialist-dashboard/**`
- All Customize pages:
  - `/trainee-dashboard/customize/`
  - `/staffs/*/customize/`
  - `/specialist-dashboard/customize/`
- Theme payload standardization and global listening
- Font preview and font loading (Google Fonts only)

Out of scope:

- Main website theme integration
- Firestore rules changes or data migration beyond reading existing collections
- Removal of legacy collections (directors/hods/specialists) from the backend

## Data Model

### Canonical Theme Payload

All customization is saved as a single payload under the field `theme`:

- `theme.type`: `solid-pair | gradient | wallpaper | premium-gradient`
- `theme.primary`: hex string
- `theme.secondary`: hex string
- `theme.c1`: hex string
- `theme.c2`: hex string
- `theme.wallpaper`: URL string
- `theme.fontFamily`: CSS font-family string
- `theme.fontName`: display name
- `theme.canvasActive`: boolean
- `theme.canvasColors`: array of hex colors (optional)

Normalization rules:

- Always write `primary/secondary` and `c1/c2` so both old and new UI code paths can use it.
- If `type` is `wallpaper`, ensure `wallpaper` is a URL string and fallback colors still exist.

## Theme Resolution Order

All dashboards and Customize pages resolve the active registry document in this order:

1. `staffs/{uid}`
2. `directors/{uid}`
3. `hods/{uid}`
4. `specialists/{uid}`
5. `trainees/{uid}`

Notes:

- The first existing document becomes the “source of truth” doc for writes.
- If none exist, the page should avoid crashing and show a stable error state.

## Runtime Behavior

### Global Listening

The Theme Manager:

- Subscribes to the resolved doc with a single active listener.
- Applies the entire `theme` payload whenever it changes.
- Dispatches:
  - `sf:theme_synced` with the raw user data
  - `sf:theme_updated` when changes are committed locally (optimistic UI)

### Apply All Components

When a theme is applied:

- Background:
  - `solid-pair`: sets accent variables + background
  - `gradient`: sets background gradient + accent variables
  - `premium-gradient`: uses `theme.colors` or mapped to `c1/c2` where needed
- Wallpaper:
  - If `theme.wallpaper` exists and `type === wallpaper`, set body background-image
- Font:
  - Apply `theme.fontFamily` to `--font-main`
  - Ensure the font is loaded (Google Fonts only) before display if required
- Canvas:
  - Emit a `canvas-settings-changed` event with active/colors settings

## Customize Page Behavior

### Commit / Save

On Save:

- Create the canonical theme payload from current UI state.
- Resolve the correct registry doc using the same resolution order.
- Write `theme: <payload>` to the resolved doc.
- Dispatch `sf:theme_updated` immediately so the current UI updates without reload.

### “Listen to all components”

Customize must bind all UI components to `currentDesign` and preview:

- Color pair selection → update theme payload fields
- Gradient selection → update theme payload fields
- Wallpaper selection/upload → set `type=wallpaper` + wallpaper URL
- Font selection → set font family/name and update preview typography
- Canvas toggle/settings → write into theme payload (canvasActive/colors)

## Premium Fonts (Google Fonts Only)

- The available font list must be restricted to Google Fonts that can be loaded reliably.
- Each font card shows a real preview sample:
  - Display name
  - Brand sample line: “SkillForge Command Center”
  - Sample characters: “Aa Bb Cc — 0123456789”
  - Short sentence for spacing: “The quick brown fox jumps over the lazy dog.”
- When a font is selected:
  - load it via Google Fonts stylesheet injection once per font
  - apply it to preview immediately
  - save it inside `theme.fontFamily` / `theme.fontName`

## Acceptance Criteria

- Any theme committed in any Customize page is reflected across all dashboards without requiring a manual refresh.
- Staff dashboards never accidentally consume Trainee theme data due to fallback logic.
- All Customize components are persisted under the canonical `theme` payload.
- Premium font previews match the actual rendered fonts (Google Fonts only).
- Offline/unstable network does not crash Customize or login flows; UI displays a stable error message.

