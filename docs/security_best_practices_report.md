# SkillForge Portal + Academy Global Audit (Auth, Registration, Operations, Rules, Indexes)

Date: 2026-04-29

## Executive Summary

The portal’s core flows (trainee registration/login, staff registration/login, academy gate SSO) are structurally sound, but there are **high-risk security exposures in Firestore rules** and a few **operational fragility points** that can cause “random” onboarding/login failures (especially with cached pages and legacy migration).

This report is split into:
- **Functional Flow Map**: what writes/reads happen during registration/login/operations.
- **Rules + Index Match**: where current rules allow/deny those operations.
- **Findings**: prioritized issues with direct code references and recommended fixes.

## Critical Immediate Action (Non-Code)

### C0 — Rotate the GitHub token you pasted in chat

The GitHub PAT was shared in plain text. Assume it is compromised.
- Revoke it in GitHub settings immediately.
- Create a new token only if needed and never paste it into chat/logs.

## Functional Flow Map

### A) Trainee Registration → SFID + Passcode + Gate Access

**Page**
- [trainee-registration/index.html](file:///workspace/portal/trainee-registration/index.html)

**Expected Writes**
- `trainees/{uid}`: `sfid`, `pin`, `track`, profile info (registration payload)
- `track_access/{pin}`: passcode lookup record
- `seasons/2026/artifacts/trainees/counters/tracks`: per-track counter

**Key code**
- Registration handler begins: [trainee-registration/index.html:L586](file:///workspace/portal/trainee-registration/index.html#L586)
- `sfid` + `pin` generation and writes: [trainee-registration/index.html:L631-L706](file:///workspace/portal/trainee-registration/index.html#L631-L706)

### B) Trainee Login → Identity Resolution + Legacy Migration

**Page**
- [trainee-login/index.html](file:///workspace/portal/trainee-login/index.html)

**Expected Reads/Writes**
- `signInWithEmailAndPassword` (Auth)
- If Auth user missing: query `trainees` by email, compare `legacyData.password`, then create Auth user + migrate Firestore doc

**Key code**
- Legacy migration password check (security risk): [trainee-login/index.html:L350-L378](file:///workspace/portal/trainee-login/index.html#L350-L378)
- Skeleton profile creation: [trainee-login/index.html:L427-L443](file:///workspace/portal/trainee-login/index.html#L427-L443)

### C) Staff Registration → Role Code + Pending Staff Profile + Track Access

**Page**
- [staffs/registration/index.html](file:///workspace/portal/staffs/registration/index.html)

**Expected Writes**
- `role_codes/{code}`: validate and mark used
- `staffs/{uid}`: create with `status: 'pending'`
- `track_access/{code}`: create staff passkey (pending)

**Key code**
- Verify role code / seed fallback: [registration/index.html:L317-L368](file:///workspace/portal/staffs/registration/index.html#L317-L368)
- Registration submit handler: [registration/index.html:L418-L558](file:///workspace/portal/staffs/registration/index.html#L418-L558)

### D) Staff Login → Pending Gate + Role Routing

**Page**
- [staffs/login/index.html](file:///workspace/portal/staffs/login/index.html)

**Expected Reads**
- `staffs/{uid}` and/or legacy collections via [staff-identity.js](file:///workspace/portal/assets/staff-identity.js)

### E) Director Operations → Approvals / Global Operations

**Page**
- [staffs/director/index.html](file:///workspace/portal/staffs/director/index.html)

**Key operations**
- Approve staff: updates `staffs/{uid}.status = active` and updates `role_codes/{code}` + `track_access/{code}` status
  - [director/index.html:L1222-L1240](file:///workspace/portal/staffs/director/index.html#L1222-L1240)

### F) Academy Gate → Passcode Verification (Main Site)

**Page**
- [skillforge-website/academy/gate.html](file:///workspace/skillforge-website/academy/gate.html)

**Expected Reads**
- `track_access/{pin}` to validate passcode (SSO + manual entry)

## Firestore Rules + Index Match

### Rules summary

**Primary rules file**
- [firestore.rules](file:///workspace/portal/firestore.rules)

Key rule decisions:
- `trainees` and `staffs` are **publicly readable** ([firestore.rules:L54-L73](file:///workspace/portal/firestore.rules#L54-L73))
- `track_access/{pin}` is **public read**, **public create**, but **update/delete restricted to staff** ([firestore.rules:L84-L90](file:///workspace/portal/firestore.rules#L84-L90))
- `role_codes/{code}` is **public read/write** ([firestore.rules:L92-L97](file:///workspace/portal/firestore.rules#L92-L97))
- `password_resets/{id}` is **public read/write** ([firestore.rules:L129-L132](file:///workspace/portal/firestore.rules#L129-L132))

### Indexes summary

Indexes exist for common queries:
- `trainees` by `track + xp` and `track + created_at` ([firestore.indexes.json](file:///workspace/portal/firestore.indexes.json))
- `staffs` by `status + created_at` and `roles contains + created_at`

Potential mismatch: there is an index for `track_access` on `pin + track`, but the app mostly reads `track_access/{pin}` by document id (no index needed). This is not harmful, just likely unused.

## Findings (Prioritized)

### CRITICAL (Security)

#### S1 — Plaintext-ish password storage and verification in Firestore

Impact: Anyone with read access to `trainees` (currently public) can harvest credentials and take over accounts.

- Trainee login compares `legacyData.password` from Firestore to entered password:  
  [trainee-login/index.html:L350-L378](file:///workspace/portal/trainee-login/index.html#L350-L378)
- Password reset writes `password: pass` back into trainees collection:  
  [staffs/login/reset-password.html:L177-L186](file:///workspace/portal/staffs/login/reset-password.html#L177-L186)

Recommended fix:
- Stop writing any password to Firestore.
- For “legacy migration”, replace the password comparison with a one-time migration token or force Auth password reset.
- Tighten rules so `trainees` is not publicly readable if it contains PII.

#### S2 — Public write access to `role_codes` enables self-escalation

Impact: Any user can create/modify role codes, set `used:false`, or add `roles:['Director']`, then self-register as staff.

- Rule: `allow write: if true;`  
  [firestore.rules:L92-L97](file:///workspace/portal/firestore.rules#L92-L97)
- Staff registration accepts seed fallback and writes role codes client-side:  
  [registration/index.html:L350-L365](file:///workspace/portal/staffs/registration/index.html#L350-L365)

Recommended fix:
- Restrict `role_codes` writes to `isDirector()` (or at least `isStaff()`), and move provisioning into a privileged staff-only tool.
- If self-provisioning must remain, restrict writes to “create if not exists” and lock `roles` to a known allowlist.

#### S3 — `track_access` public create enables PIN squatting + denial of onboarding

Impact: Anyone can pre-create `track_access/{123456}` to block that passcode assignment, or create many to pollute the namespace.

- Rule: `allow create: if true;`  
  [firestore.rules:L84-L90](file:///workspace/portal/firestore.rules#L84-L90)

Recommended fix:
- Move passcode creation to staff-only (or a Cloud Function) OR use random doc IDs and store the pin as a field.
- If keeping as-is, at least enforce schema constraints in rules and prevent overwrites by non-staff.

### HIGH (Reliability / Functional)

#### F1 — Service worker can serve stale registration/login pages after a deploy

Impact: users keep running old broken JS even after you fix code, causing “still not working” reports.

- Precache list includes auth + registration pages:  
  [sw.js:L6-L25](file:///workspace/portal/sw.js#L6-L25)

Recommended fix:
- Bump `CACHE_NAME` on each release and/or include a cache-busting version file.
- Consider disabling SW caching for auth/registration routes entirely.

#### F2 — Staff registration can still race on role code usage

Impact: two users can verify the same unused role code and attempt registration simultaneously.

Recommendation:
- Reserve/lock the code in a transaction at verify-time or immediately after Auth user creation.

### MEDIUM (Privacy / Operational)

#### P1 — `trainees` and `staffs` are publicly readable

Impact: leaks email, passcodes, SFIDs, and profile data if stored.

- Rule: `allow read, get, list: if true;` on both collections  
  [firestore.rules:L54-L73](file:///workspace/portal/firestore.rules#L54-L73)

Recommended fix:
- Restrict reads:
  - Public: allow only minimal “verify” fields via a separate public collection (or Cloud Function).
  - Authenticated owners: read their own doc.
  - Staff: read as needed.

#### P2 — Password reset collections are fully public

Impact: token farming/spam and possible account recovery abuse.

- Rule: `match /password_resets/{id} { allow read, write: if true; }`  
  [firestore.rules:L129-L132](file:///workspace/portal/firestore.rules#L129-L132)

Recommended fix:
- Restrict to `create: if true`, `read/update: if isStaff()` or require a hashed token and time-based constraints.

## Recommended Next Steps (Order)

1) **Security hardening** (highest priority)
   - Remove Firestore password storage and legacy password checks.
   - Tighten `role_codes` write rules.
   - Tighten `track_access` create rules (or move creation server-side).
2) **Operational stability**
   - Service worker cache/version strategy for auth pages.
3) **Rules/PII cleanup**
   - Restrict public reads of trainees/staffs; create a minimal `public_verify` collection if needed.

## Notes

This repo is front-end heavy and uses Firestore from the client directly. For stronger security, the long-term best practice is to move privileged operations (role code provisioning, approvals, passcode creation) to server-side functions.

