# SkillForge Mastery Hub (Portal)

Official Trainee Mastery Registry for SkillForge Academy 2026 Academic Session. A secure, human-centric environment for skill-track assignment, XP-based gamification, and registry management.

## 🎨 Architectural Vision
The Mastery Hub is built on a **True Multi-Page Architecture (MPA)** using vanilla HTML5, CSS3 (Tailwind CDN), and ES Modules. It prioritizes performance, security, and extreme customizability.

### Key Features:
- **10 Multi-Layout Engines**: Switch between Bento, Dock, Orbit, Console, and more in real-time.
- **Mastery XP System**: Real-time study-time tracking with 1:10 minute-to-XP conversion.
- **Environment Designer**: 40+ Colors, 12+ Premium Gradients, and 5 Typography modes.
- **Global Hall of Fame**: Live rankings with unit-specific filtering.
- **The Vault**: Persistent career repository for badges and certificates.
- **Registry Export**: High-res PNG and JSON data snapshot generation.

## 🛠️ Technical Stack
- **UI**: Tailwind CSS (CDN), Lucide Icons, Glassmorphism.
- **Auth**: Firebase Auth (Real Identity Management).
- **Database**: Firestore (Primary Source of Truth).
- **State**: 100% Cloud-First Real-time Sync (No LocalStorage caching).
- **Security**: Granular Director-Level clearance rules.
- **Export**: html2canvas for 4K visual card generation.

### 🛡️ Security & Access Control

1. **Director Hub**: Accessed via `director/` using real identity verification. Only accounts in `directors`, `specialists` (level Director), or `staffs` (role Director) collections are authorized.
2. **Access Codes**: Consistent 6-digit numeric PINs used for Academy gate verification.
3. **Registry Sync**: All trainee settings (Theme, Layout, Canvas, Fonts) are stored in Firestore and synced real-time.

## 📋 Component APIs (JSDoc)
Interactive functions are globally bound to `window` within their respective module scripts:
- `window.toggleGlow()`: Toggles the atmospheric ambient aura.
- `window.toggleTheme()`: Switches between Deep Navy and High-Contrast Light mode.
- `window.showTemplate(num)`: Hot-swaps the interface between the 10 layout engines.
- `window.saveTheme(theme)`: Persists accent colors or gradients to the trainee's registry.

---
© 2026 SkillForge Academy • Mastery Registry v1.5.0
