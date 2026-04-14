# SkillForge Digital Portal - Development Progress

## Last Updated: 2025

---

## Version 2.1.0 - RBAC & Season Management System

### Completed Features

#### 1. Role-Based Access Control (RBAC)
- **Staff Core Engine** (`assets/staff-core.js`)
  - Comprehensive permission middleware
  - Role hierarchy: Director > HOD > Specialist > Digital Marketing > Support Staff
  - Permission methods: `canEditAnnouncements()`, `canManageSeasons()`, `canWipeData()`, `canRestoreData()`
  - Audit logging for all administrative actions

#### 2. Director Dashboard (`staffs/director/index.html`)
- **Full Access Features:**
  - Global Overview with real-time trainee/staff counts
  - Trainee Registry management (view, delete)
  - Personnel Registry management
  - Global Announcement broadcasting (all scopes)
  - Season Management with archive/restore
  - ROLE Code generation for staff onboarding
  - Comprehensive Audit Logs viewer

- **Season Management:**
  - Initialize new seasons with validation (format: "2026 Season", "2026 Volume 2", "2026 Q1")
  - Automatic trainee data backup before wipe
  - Archive restoration capability
  - Double confirmation prompts for destructive actions

#### 3. HOD Dashboard (`staffs/hod/index.html`)
- **Scoped Access:**
  - Unit Overview with trainee/staff counts
  - Announcement posting (HOD Dashboard, Staff Dashboard, Global)
  - View-only trainee registry
  - Cannot initialize seasons or manage global settings

#### 4. Staff Portal Structure
- `/staffs/` - Main gateway
- `/staffs/login/` - Personnel authentication
- `/staffs/registration/` - ROLE code-based onboarding
- `/staffs/director/` - Director command hub
- `/staffs/hod/` - HOD unit hub
- `/staffs/specialist/` - Specialist hub (foundation)
- `/staffs/marketing/` - Digital Marketing hub (foundation)
- `/staffs/support/` - Support Staff hub (foundation)

#### 5. Season Reset System
- **New Track to Learn Banner** - Appears on registration page during new seasons
- Season initialization workflow with:
  - Validation of season naming conventions
  - Automatic data backup to `season_archives` collection
  - Complete trainee data wipe
  - Batch distribution tracking
  - Restoration procedures

#### 6. Security & Performance
- **Firestore Rules** - Comprehensive RBAC enforcement
- **Centralized Firebase Config** (`assets/firebase-config.js`)
- **Immediate UI Preparation** pattern - Prevents layout flashes
- **Zero-Refresh Navigation** (sf-turbo.js) - PJAX for smooth transitions

---

## Data Model

### Collections
| Collection | Purpose |
|------------|---------|
| `staffs` | Personnel registry with roles array and primaryRole |
| `role_codes` | Staff onboarding codes with role assignments |
| `season_archives` | Backup of trainee data before season wipes |
| `system` | Global config including currentSeason |
| `staff_audit_logs` | Administrative action audit trail |
| `announcements` | Broadcast messages with scope targeting |
| `trainees` | Trainee registry with XP, progress, credentials |
| `specialists` | Specialist legacy registry |
| `password_resets` | Trainee password reset requests |
| `mail` | Email dispatch queue |
| `academy_audit_logs` | Academy activity audit |
| `feedback` | Trainee feedback collection |

### Role Hierarchy
```
Director (Full Access)
  └── HOD (Scoped Announcements, View Trainees)
       └── Specialist (Path Management)
            ├── Digital Marketing (Marketing Hub)
            └── Support Staff (Support Hub)
```

---

## Testing Checklist

- [ ] Director login with `SFD-DIRECTOR-2026`
- [ ] Director can initialize new season (e.g., "2026 Volume 2")
- [ ] Season initialization creates archive backup
- [ ] Season initialization wipes trainee data
- [ ] Director can restore archived season
- [ ] HOD cannot initialize seasons
- [ ] HOD can post scoped announcements
- [ ] ROLE code generates valid staff access
- [ ] New Track banner appears after season reset
- [ ] Old trainees can re-register for new season
- [ ] Audit logs record all administrative actions

---

## Deployment

- **GitHub**: Main branch
- **Firebase Hosting**: https://skillfoge-ecosystem.web.app
- **Firebase Project**: skillfoge-ecosystem

---

## Next Steps / TODO

- [ ] Implement returning trainee flow (existing email detection)
- [ ] Add portal lock/unlock controls to Director master panel
- [ ] Build Specialist dashboard with track-specific trainee views
- [ ] Add community management features to Director sidebar
- [ ] Implement XP/progress reset for re-registered trainees
- [ ] Create automated backup schedules
- [ ] Add email notification for season transitions

---

## Architecture Notes

### Permission Enforcement
- Client-side: `staff-core.js` provides permission methods
- Server-side: Firestore rules enforce permission boundaries
- No client-side permission check can be trusted alone

### Season Naming Convention
Valid formats:
- `2026 Season`
- `2026 Volume 2`
- `2026 Q1`

Invalid formats (will be rejected):
- `2026 Volume to` (typo)
- `season 2026` (wrong order)
- `2026-volume-2` (wrong separator)

---

## Known Issues

- None currently identified

---

## Changelog

### v2.1.0 (Current)
- Implemented comprehensive RBAC system
- Director: Full access with season management
- HOD: Scoped announcements and view-only trainees
- ROLE code-based staff onboarding
- Season initialization with backup/restore
- "New Track to Learn" banner for season resets
- Audit logging for all administrative actions

### v2.0.0
- Centralized Firebase configuration
- Unified navigation (sf-turbo.js)
- Immediate UI preparation pattern
- Fixed dashboard rendering stalls
- Staff portal architecture

### v1.x
- Initial trainee portal development
- Firebase Auth/Firestore integration
- Basic role structure
