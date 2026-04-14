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

#### 2. Department/Unit Structure
- **Departments with Tracks:**
  - **Trading Academy**: Forex, CPS Currency Pairs, Forex Synthetics
  - **Digital & Intelligence**: Cyber Security, Digital Marketing, AI Content Creation, Development & Technology
  - **Technology**: Web Development, Discord Development
  - **Creative Academy**: Graphics Design, Photography & Editing, Mobile Cinematography
  - **Marketing**: Universal (all tracks)

#### 3. Director Dashboard (`staffs/director/index.html`)
- **Full Access Features:**
  - Global Overview with real-time trainee/staff counts
  - Trainee Registry management (view, delete)
  - Personnel Registry management with department assignments
  - Global Announcement broadcasting (all scopes)
  - Season Management with archive/restore
  - ROLE Code generation for staff onboarding
  - Comprehensive Audit Logs viewer

- **Season Management:**
  - Initialize new seasons with validation (format: "2026 Season", "2026 Volume 2", "2026 Q1")
  - Automatic trainee data backup before wipe
  - Archive restoration capability
  - Double confirmation prompts for destructive actions

#### 4. HOD Dashboard (`staffs/hod/index.html`)
- **Scoped Access:**
  - Unit Overview with department-filtered trainee/staff counts
  - Announcement posting (HOD Dashboard, Staff Dashboard, Global)
  - Staff Registry filtered by department
  - Cannot initialize seasons or manage global settings

#### 5. Staff Portal Structure
- `/staffs/` - Main gateway
- `/staffs/login/` - Personnel authentication
- `/staffs/registration/` - ROLE code-based onboarding with department assignment
- `/staffs/director/` - Director command hub
- `/staffs/hod/` - HOD unit hub
- `/staffs/specialist/` - Specialist hub (foundation)
- `/staffs/marketing/` - Digital Marketing hub (foundation)
- `/staffs/support/` - Support Staff hub (foundation)

#### 6. Role-Based Permissions

| Role | Trainee Visibility | Announcement Scope | Season Mgmt | Department Access |
|------|-------------------|-------------------|-------------|------------------|
| Director | All | Global | Full | All |
| HOD | All | HOD, Staff, Global | View Only | Own Department |
| Specialist | Domain-Only | None | None | Own Tracks |
| Digital Marketing | All (UTC) | Marketing | None | Marketing Only |
| Support Staff | All (UTC) | None | None | Support Only |

#### 7. Season Reset System
- **New Track to Learn Banner** - Appears on registration page during new seasons
- Season initialization workflow with:
  - Validation of season naming conventions
  - Automatic data backup to `season_archives` collection
  - Complete trainee data wipe
  - Batch distribution tracking
  - Restoration procedures

#### 8. Universal Track Clearance (UTC)
- Marketing staff have UTC to bypass gate restrictions
- Can review any track for content creation purposes
- Portal tracks time spent via Neural Sync without affecting trainee XP

#### 9. Security & Performance
- **Firestore Rules** - Comprehensive RBAC enforcement
- **Centralized Firebase Config** (`assets/firebase-config.js`)
- **Immediate UI Preparation** pattern - Prevents layout flashes
- **Zero-Refresh Navigation** (sf-turbo.js) - PJAX for smooth transitions

---

## Data Model

### Collections
| Collection | Purpose |
|------------|---------|
| `staffs` | Personnel registry with roles array, primaryRole, and department |
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
| `badge_requests` | Badge verification requests |

### Role Hierarchy
```
Director (Full Access)
  └── HOD (Scoped Announcements, Department View)
       └── Specialist (Track-isolated Visibility)
            ├── Digital Marketing (UTC, All Tracks)
            └── Support Staff (UTC, Support Hub)
```

### Department/Unit Mapping
| Department | Tracks |
|------------|--------|
| Trading Academy | Forex, CPS Currency Pairs, Forex Synthetics |
| Digital & Intelligence | Cyber Security, Digital Marketing, AI Content Creation, Development & Technology |
| Technology | Web Development, Discord Development |
| Creative Academy | Graphics Design, Photography & Editing, Mobile Cinematography |
| Marketing | Universal (all tracks) |

---

## Testing Checklist

- [ ] Director login with `SFD-DIRECTOR-2026`
- [ ] Director can initialize new season (e.g., "2026 Volume 2")
- [ ] Season initialization creates archive backup
- [ ] Season initialization wipes trainee data
- [ ] Director can restore archived season
- [ ] HOD cannot initialize seasons
- [ ] HOD can post scoped announcements
- [ ] HOD can only see staff in their department
- [ ] ROLE code generates valid staff access with department
- [ ] New Track banner appears after season reset
- [ ] Old trainees can re-register for new season
- [ ] Audit logs record all administrative actions
- [ ] Marketing staff can access all tracks (UTC)
- [ ] Specialists can only see trainees in their tracks

---

## Deployment

- **GitHub**: Main branch
- **Firebase Hosting**: https://skillfoge-ecosystem.web.app
- **Firebase Project**: skillfoge-ecosystem

---

## Next Steps / TODO

- [ ] Specialist dashboard with track-specific trainee filtering
- [ ] Marketing dashboard with social media deployment hub
- [ ] Support Staff dashboard with ticket management
- [ ] Social media account metrics integration
- [ ] Badge verification workflow for Specialists
- [ ] Feedback module for Specialist-to-Trainee communication
- [ ] Neural Sync passive monitoring for Marketing staff

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

### Universal Track Clearance (UTC)
Marketing staff and Directors have UTC which:
- Bypasses the `STRICT_SINGLE_ENROLLMENT` policy
- Allows cross-track content review
- Logs presence without affecting trainee XP

---

## Known Issues

- None currently identified

---

## Changelog

### v2.1.0 (Current)
- Implemented comprehensive RBAC system
- Director: Full access with season management
- HOD: Scoped announcements, department-filtered staff view
- ROLE code-based staff onboarding with department assignment
- Season initialization with backup/restore
- "New Track to Learn" banner for season resets
- Audit logging for all administrative actions
- Department/unit structure with track assignments
- Universal Track Clearance (UTC) for Marketing

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
