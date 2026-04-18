# SkillForge Neural Debugging & Testing Suite v2.2

Enterprise-grade environment for real-time inspection, automated regression, and deterministic state verification.

## 🛠️ Integrated Toolchain

| Tool | Purpose | Command |
| :--- | :--- | :--- |
| **Vitest** | Deterministic Unit & Logic Testing | `npm test` |
| **ESLint** | Static Code Analysis & Linting | `npm run lint` |
| **Neural Debugger** | Real-time Browser State Overlay | `Ctrl + Shift + D` |
| **Coverage V8** | Code Path Saturation Reporting | `npm run test:coverage` |
| **NPM Audit** | Security Vulnerability Scanning | `npm run audit:security` |

## 🧠 Neural Debugger (Live Overlay)

The **Neural Debugger** is a floating inspection layer available on all authenticated pages.

- **Toggle**: Press `Ctrl + Shift + D` to toggle the visibility.
- **Features**:
  - **Registry Tab**: Live view of current UID, SFID, Tier, Theme, and Layout.
  - **Events Tab**: Intercepts `console.log`, `warn`, and `error` into a scrollable, timestamped buffer.
  - **Neural Link Tab**: Visualizes WebSocket/Snapshot connection health.
  - **Metrics**: Real-time FPS and Engagement Score calculation.

## 🧪 Automated Testing

We use **Vitest** for fast, deterministic testing of business logic.

### Running Tests
- `npm test`: Runs all unit tests.
- `npm run test:coverage`: Generates an HTML coverage report in `./coverage`.

### Test Locations
- `tests/pass-code-engine.test.js`: Validates 6-digit PIN generation and verification.
- `tests/rank-engine.test.js`: Tests the 6-tier progression state machine gates.

## 🛡️ Security & Quality Gates

1. **Linting**: Run `npm run lint` before committing to catch undefined variables or redundant code.
2. **Security**: Run `npm run audit:security` weekly to check for dependency vulnerabilities.
3. **Deployment**: Always run `npm run rules:deploy` after modifying `firestore.rules` to push security changes to the cloud.

## 🚑 Escalation Path

If a promotion state becomes "stuck" or the renderer fails:
1. **Logs**: Open Neural Debugger (`Ctrl+Shift+D`) and check the Events tab for `ERROR` logs.
2. **Registry**: Verify the trainee document in Firestore matches the expected Tier requirements.
3. **Manual Override**: Directors can use the **Director Command Center** to manually adjust tiers with mandatory audit comments.

---
© 2026 SkillForge Digital & Co. Ltd • Neural Intelligence Division