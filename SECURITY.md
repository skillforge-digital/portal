# SkillForge Firestore Security Architecture (v4.0)

This document outlines the security strategy, implementation details, and maintenance guidelines for the SkillForge Digital Academy Firestore environment.

## 🛡️ Design Philosophy

The SkillForge Security Shield is built on four pillars:
1. **Simple & Robust**: Uses centralized helper functions to minimize repetitive logic and human error.
2. **Backward Compatible**: Maintains support for legacy mock identities and multi-collection personnel registries during the migration phase.
3. **Unified RBAC**: Transitions the system to a single `staffs` registry with a `roles` array, allowing personnel to hold multiple titles (e.g., Director + Specialist) simultaneously.
4. **Graceful Persistence**: Ensures that critical flows like student registration, gate verification, and local development remain frictionless.

---

## 🏗️ Rule Structure

### 1. Core Helpers
We use global functions to standardize access checks:
- `isAuthenticated()`: Verifies the request has a valid Firebase Auth token.
- `hasAnyRole(['RoleName'])`: The primary RBAC engine. It checks the user's `roles` array in the unified `staffs` collection.
- `isOwner(userId)`: Ensures a user can only modify their own profile data.

### 2. Collection Access Matrix

| Collection | Read | Create | Update | Delete |
| :--- | :--- | :--- | :--- | :--- |
| `/trainees` | Public* | Public | Owner/Staff | Director |
| `/staffs` | Public* | Director | Owner/Director | Director |
| `/system` | Public | - | Director | - |
| `/seasons` | Public | Staff | Staff | Director |
| `/telemetry` | Public | Public | - | - |

*\*Public read is enabled for legacy identity reconciliation and registration lookups.*

---

## 🧪 Testing Procedures

### Local Environment
1. Start the Firestore Emulator: `firebase emulators:start --only firestore`
2. Run the validation suite: `node scripts/test-rules.js` (requires `@firebase/rules-unit-testing`)

### Manual Verification
- **As Trainee**: Attempt to edit another trainee's profile (Should fail).
- **As Specialist**: Attempt to create a new staff role code (Should succeed).
- **As Unauthenticated**: Attempt to read the `audit_logs` collection (Should fail).

---

## 🚀 Migration Strategy

If you are moving from a legacy rule set:
1. **Unified Staffing**: Ensure all personnel in `directors`, `hods`, and `specialists` have been mirrored into the `staffs` collection with their respective roles in the `roles: []` array.
2. **Deployment**: Run `firebase deploy --only firestore:rules`.
3. **Verification**: Monitor the `system_faults` collection for any `PERMISSION_DENIED` errors reported by the frontend engines.

---

## 🛠️ Future Modifications

- **Hardening**: As the legacy migration phase completes, the `match /{document=**}` catch-all should be changed from `allow read, write: if true` to `allow read, write: if false` to implement a true "deny-by-default" posture.
- **Granular Staffing**: For higher security, replace `allow read: if true` on the `staffs` collection with `allow read: if isAuthenticated()`.

---
*SkillForge Security Operations — 2026*
