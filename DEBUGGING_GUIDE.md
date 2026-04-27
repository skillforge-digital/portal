# SkillForge System Debugging & Testing Suite v2.2

This guide outlines the tools and protocols for maintaining the integrity of the SkillForge Digital ecosystem.

## 🛠 Command Center Tools

| Tool | Purpose | Command |
| :--- | :--- | :--- |
| **System Debugger** | Real-time Browser State Overlay | `Ctrl + Shift + D` |
| **Firestore CLI** | Database Operations & Indexing | `firebase firestore:...` |
| **Registry Audit** | User Session Integrity Logs | `/admin/audit-logs` |

## 🧠 System Debugger (Live Overlay)

The **System Debugger** is a floating inspection layer available on all authenticated pages.

### Key Features:
- **Registry State**: Real-time view of `traineeData` or `staffData`.
- **System Link Tab**: Visualizes WebSocket/Snapshot connection health.
- **Theme Matrix**: Live preview of CSS variables and font injection.
- **Action Logs**: Records every Firestore write and PJAX navigation event.

### Usage:
1. **Logs**: Open System Debugger (`Ctrl+Shift+D`) and check the Events tab for `ERROR` logs.
2. **Re-hydration**: Use the "Reset Registry" button to force a clean `onSnapshot` refresh without reloading the page.

---
© 2026 SkillForge Digital & Co. Ltd • System Intelligence Division