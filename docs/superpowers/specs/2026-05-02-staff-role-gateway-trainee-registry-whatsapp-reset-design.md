# Staff Role Gateway + Trainee Registry (WhatsApp Onboarding) + Reset Fallback — Design

Date: 2026-05-02

## Goal

1) Allow staff with multiple roles to access all their dashboards (not just the highest role).
2) Provide a shared Trainee Registry tool for staff with a track filter + search + contact visibility.
3) Replace “mass mail” onboarding with WhatsApp DM onboarding (prefilled message + Telegram link), requiring track selection first.
4) Improve password reset reliability within free constraints: keep Firebase Auth reset email, add UX guidance, and add WhatsApp support fallback.

## Constraints

- No paid email sending (no Cloud Functions mail worker; Firebase on Spark).
- No WhatsApp Business API / SMS OTP (paid). WhatsApp onboarding is manual send via `wa.me` deep link.
- Trainee contacts (email + WhatsApp) are visible to staff as requested.

## Staff Roles / Access

### Who can view trainee contacts

- All staff roles that qualify as staff in Firestore rules (staffs collection and legacy roles).

### Who can send WhatsApp onboarding from registry

- Director
- HOD
- Digital Marketing
- Support Staff

Reason: aligns with “support workflow” requirement while including management and marketing.

## Feature 1: Role Gateway (Multi-role staff)

### UX

- New page: `/staffs/role-gateway/`
- Displays the staff profile summary and a list of dashboards for every role in `profile.roles`.
- Each role card routes to the appropriate dashboard path:
  - Director → `/staffs/director/`
  - HOD → `/staffs/hod/`
  - Specialist → `/staffs/specialist/`
  - Digital Marketing → `/staffs/marketing/`
  - Support Staff → `/staffs/support/`
- Persist last-selected role in localStorage; default selection highlights last used role.

### Routing rule

- After successful login, if `roles.length > 1`, route to `/staffs/role-gateway/`.
- If `roles.length === 1`, route to that role’s dashboard as before.

### In-dashboard switching

- Add a small “Switch Role” link/button in staff dashboards that routes to `/staffs/role-gateway/`.

## Feature 2: Shared Trainee Registry (Staff)

### Location

- New page: `/staffs/registry/`
- Linked from:
  - Director dashboard
  - HOD dashboard
  - Marketing dashboard
  - Support dashboard (optional link, but role should be supported)

### Required controls

- Track filter is mandatory before loading the list:
  - Track dropdown includes the 10 official track values used during registration.
- Search bar filters within the loaded results:
  - Name / email / SFID match.

### Data shown (table)

- Name
- Track
- Email
- WhatsApp number (stored as digits-only including country code, e.g. `2349012345678`)
- SFID (if present)
- Created date (if present)

### Bulk tools (track-scoped)

- Export CSV for selected track:
  - name, email, phone, track, telegramLink, sfid
- Copy all WhatsApp numbers (track-scoped)

## Feature 3: WhatsApp DM onboarding

### UX

- “Send WhatsApp” button in each trainee row.
- Clicking opens WhatsApp DM using `https://wa.me/<phone>?text=<encodedMessage>`.
- Button only enabled after track filter selection (same rule as data load).

### Prefilled message

Message is short but complete and always ends with a contact-save line.

Template variables:
- `{name}`
- `{track}`
- `{telegramLink}`

Body:

Congratulations {name} — welcome to SkillForge Digital & Co. Ltd.
Your track: {track}.

Join your official track Telegram group now: {telegramLink}

Next step: introduce yourself (name + track) in the group and wait for onboarding tasks.
Please save this contact for further assistance.

### Telegram link source

- Reuse the same mapping as trainee registration (track → Telegram group link) to ensure consistency.

## Feature 4: Password reset improvements (free best-effort)

### Firebase Auth email reset

- Keep current reset pages and flows.
- Improve UX:
  - Clear “check spam/promotions” guidance
  - Resend button cooldown on forgot-password page (client-side)
  - Show the email address the user entered on success screen

### WhatsApp fallback

- Add “Contact Support on WhatsApp” button on:
  - forgot-password pages
  - reset-password pages (error state)
- This opens WhatsApp to a fixed support number with a prefilled message containing:
  - user email
  - user name if available
  - request type “Password Reset Help”

## Acceptance Criteria

- Staff with multiple roles can choose any role dashboard via Role Gateway.
- Trainee Registry supports:
  - mandatory track selection
  - search filtering
  - contact visibility to staff
  - WhatsApp DM onboarding with prefilled message and correct Telegram link
- Password reset UX is improved and includes a WhatsApp support fallback path.
- Existing portal tests pass.

