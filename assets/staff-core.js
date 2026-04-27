/**
 * SkillForge Staff Core (v2.0.0)
 * Comprehensive Role-Based Access Control (RBAC) Middleware
 */

// @ts-ignore
import { db, auth } from './firebase-config.js';
// @ts-ignore
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js';
// @ts-ignore
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';

class StaffCore {
    constructor() {
        this.db = db;
        this.auth = auth;
        this.user = null;
        this.profile = null;
        
        // Department/Unit hierarchy with tracks (Synced with Season 2026 Flyer)
        this.DEPARTMENTS = {
            'Trading Unit': {
                tracks: ['Forex Currency Pairs', 'Forex Synthetics Indices'],
                color: 'emerald'
            },
            'Development & Tech Unit': {
                tracks: ['Web Development', 'Discord Development', 'Cyber Security'],
                color: 'blue'
            },
            'Creative Media Unit': {
                tracks: ['Graphic Design', 'Mobile Cinematography', 'Photography & Editing'],
                color: 'pink'
            },
            'Digital Innovation Unit': {
                tracks: ['Digital Marketing', 'AI Content Creation'],
                color: 'orange'
            },
            'Support Team': {
                tracks: ['Global Support', 'Community Management'],
                color: 'slate'
            }
        };
        
        // Permission hierarchy
        this.ROLE_HIERARCHY = ['Director', 'HOD', 'Specialist', 'Digital Marketing', 'Support Staff'];
        this.SCOPE_HIERARCHY = {
            'Director': ['global', 'trainees', 'specialists', 'staffs', 'marketing', 'support', 'hod'],
            'HOD': ['hod', 'staffs', 'marketing', 'support'],
            'Specialist': ['specialists'],
            'Digital Marketing': ['marketing'],
            'Support Staff': ['support']
        };
        
        // Hide content until authorized
        document.documentElement.style.visibility = 'hidden';
    }

    static async start() {
        const core = new StaffCore();
        await core.init();
        return core;
    }

    async init() {
        return new Promise((resolve) => {
            /** @param {any} user */
            onAuthStateChanged(this.auth, async (user) => {
                if (user) {
                    this.user = user;
                    
                    // Check multiple possible collections for personnel data (Prioritize Unified 'staffs' collection)
                    const [staffDoc, directorDoc, specialistDoc, hodDoc] = await Promise.all([
                        getDoc(doc(this.db, 'staffs', user.uid)),
                        getDoc(doc(this.db, 'directors', user.uid)),
                        getDoc(doc(this.db, 'specialists', user.uid)),
                        getDoc(doc(this.db, 'hods', user.uid))
                    ]);
                    
                    if (staffDoc.exists()) {
                        this.profile = staffDoc.data();
                        this.profile.roles = this.profile.roles || [this.profile.primaryRole || 'Staff'];
                    } else if (directorDoc.exists()) {
                        this.profile = directorDoc.data();
                        this.profile.roles = this.profile.roles || ['Director'];
                        this.profile.primaryRole = this.profile.primaryRole || 'Director';
                    } else if (hodDoc.exists()) {
                        this.profile = hodDoc.data();
                        this.profile.roles = this.profile.roles || ['HOD'];
                    } else if (specialistDoc.exists()) {
                        this.profile = specialistDoc.data();
                        this.profile.roles = this.profile.roles || ['Specialist'];
                    }

                    if (this.profile) {
                        // Ensure roles is always an array
                        if (typeof this.profile.roles === 'string') {
                            this.profile.roles = [this.profile.roles];
                        }
                        
                        // Check if account is active
                        if (this.profile.status === 'pending') {
                            console.warn("[StaffCore] Account pending approval.");
                            alert("Access Denied: Your personnel application is still pending Director approval.");
                            await this.auth.signOut();
                            window.location.href = '/staffs/login/';
                            return;
                        }

                        this.verifyAccess();
                        this.revealContent();
                        resolve(undefined);
                    } else {
                        console.warn("[StaffCore] Identity not found in Personnel Registry.");
                        this.redirectLogin();
                    }
                } else {
                    console.warn("[StaffCore] No session detected.");
                    this.redirectLogin();
                }
            });
        });
    }

    verifyAccess() {
        const path = window.location.pathname;
        
        // Access map: path -> allowed roles
        /** @type {Object.<string, string[]>} */
        const accessMap = {
            '/admin/': ['Director'],
            '/staffs/hod/': ['Director', 'HOD'],
            '/staffs/specialist/': ['Director', 'HOD', 'Specialist'],
            '/staffs/marketing/': ['Director', 'HOD', 'Digital Marketing'],
            '/staffs/support/': ['Director', 'HOD', 'Support Staff']
        };

        const requiredRoles = Object.keys(accessMap).find(p => path.includes(p));
        
        if (requiredRoles) {
            const allowed = accessMap[requiredRoles];
            /** @param {any} r */
            const hasAccess = this.profile.roles.some((r) => allowed.includes(r));
            
            if (!hasAccess) {
                console.error("[StaffCore] Access Denied: Insufficient Clearances.");
                alert("Unauthorized: Your clearance level is insufficient for this system node.");
                window.location.href = '/staffs/login/';
            }
        }
    }

    revealContent() {
        document.documentElement.style.visibility = 'visible';
    }

    redirectLogin() {
        if (!window.location.pathname.includes('/staffs/login/') && 
            !window.location.pathname.includes('/staffs/registration/')) {
            window.location.href = '/staffs/login/';
        } else {
            this.revealContent();
        }
    }

    async logout() {
        await this.auth.signOut();
        window.location.href = '/staffs/login/';
    }

    // ==================== PERMISSION CHECKS ====================

    /**
     * Check if user can edit announcements for a specific scope
     * @param {string} scope - 'global', 'trainees', 'specialists', 'staffs', 'marketing', 'support', 'hod'
     */
    canEditAnnouncements(scope = 'global') {
        if (!this.profile) return false;
        
        const userScopes = this.SCOPE_HIERARCHY[this.profile.primaryRole] || [];
        
        // Directors can edit anything in their scope
        if (this.profile.primaryRole === 'Director') {
            return true; // Full global access
        }
        
        // HODs can only edit 'hod' and 'staffs' scopes
        if (this.profile.primaryRole === 'HOD') {
            return userScopes.includes(scope) && (scope === 'hod' || scope === 'staffs');
        }
        
        // Other roles cannot edit announcements
        return false;
    }

    /**
     * Check if user can manage seasons (initialize, archive, restore)
     */
    canManageSeasons() {
        if (!this.profile) return false;
        return this.profile.primaryRole === 'Director';
    }

    /**
     * Check if user can wipe/clear registration data
     */
    canWipeData() {
        if (!this.profile) return false;
        return this.profile.primaryRole === 'Director';
    }

    /**
     * Check if user can restore wiped data
     */
    canRestoreData() {
        if (!this.profile) return false;
        return this.profile.primaryRole === 'Director';
    }

    /**
     * Check if user can manage staff (add/remove roles)
     */
    canManageStaff() {
        if (!this.profile) return false;
        return this.profile.primaryRole === 'Director';
    }

    /**
     * Check if user can view trainee registry
     */
    canViewTrainees() {
        if (!this.profile) return false;
        return this.profile.roles.length > 0; // All staff can view trainees
    }

    /**
     * Check if user can edit trainee data
     */
    canEditTrainees() {
        if (!this.profile) return false;
        return ['Director', 'HOD', 'Specialist'].includes(this.profile.primaryRole);
    }

    /**
     * Check if user has access to specific dashboard scope
     * @param {string} dashboardType
     */
    hasDashboardAccess(dashboardType) {
        if (!this.profile) return false;
        
        /** @type {Object.<string, string[]>} */
        const accessMap = {
            'director': ['Director'],
            'hod': ['Director', 'HOD'],
            'specialist': ['Director', 'HOD', 'Specialist'],
            'marketing': ['Director', 'HOD', 'Digital Marketing'],
            'support': ['Director', 'HOD', 'Support Staff']
        };
        
        return accessMap[dashboardType]?.includes(this.profile.primaryRole) || false;
    }

    // ==================== AUDIT LOGGING ====================

    /**
     * Log an action to the audit trail
     * @param {string} action - The action performed
     * @param {object} details - Additional details about the action
     */
    async logAction(action, details = {}) {
        if (!this.user || !this.profile) return;
        
        try {
            await addDoc(collection(this.db, 'staff_audit_logs'), {
                uid: this.user.uid,
                name: this.profile.name,
                role: this.profile.primaryRole,
                action: action,
                details: details,
                timestamp: serverTimestamp(),
                ip: 'unknown' // Cannot get real IP client-side
            });
        } catch (err) {
            console.error('[StaffCore] Audit log failed:', err);
        }
    }

    /**
     * Log an announcement edit
     * @param {string} announcementId
     * @param {string} previousContent
     * @param {string} newContent
     * @param {string} scope
     */
    async logAnnouncementEdit(announcementId, previousContent, newContent, scope) {
        await this.logAction('ANNOUNCEMENT_EDIT', {
            announcementId,
            scope,
            previousContent: previousContent?.substring(0, 100),
            newContent: newContent?.substring(0, 100)
        });
    }

    /**
     * Log season initialization
     * @param {string} seasonName
     * @param {string} previousSeason
     */
    async logSeasonInit(seasonName, previousSeason) {
        await this.logAction('SEASON_INIT', {
            seasonName,
            previousSeason,
            type: 'REGISTRATION_WIPE'
        });
    }

    /**
     * Log data restoration
     * @param {string} seasonName
     * @param {number} recordCount
     */
    async logDataRestoration(seasonName, recordCount) {
        await this.logAction('DATA_RESTORATION', {
            seasonName,
            recordCount
        });
    }

    // ==================== SEASON MANAGEMENT ====================

    /**
     * Validate season name format
     * Valid formats: "2026 Season", "2026 Volume 2", "2027 Q1"
     * @param {string} name
     */
    validateSeasonName(name) {
        if (!name || name.length < 4) return { valid: false, error: 'Season name is too short' };
        
        // Pattern: Year followed by optional suffix
        const pattern = /^(\d{4})\s+(Season|Volume\s+\d+|Q[1-4])$/;
        const match = name.match(pattern);
        
        if (!match) {
            return { 
                valid: false, 
                error: 'Invalid format. Use: "2026 Season", "2026 Volume 2", or "2026 Q1"' 
            };
        }
        
        const year = parseInt(match[1]);
        if (year < 2020 || year > 2050) {
            return { valid: false, error: 'Year must be between 2020 and 2050' };
        }
        
        return { valid: true, year, suffix: match[2] };
    }

    /**
     * Get current active season
     */
    async getCurrentSeason() {
        try {
            const snap = await getDoc(doc(this.db, 'system', 'config'));
            if (snap.exists()) {
                return snap.data().currentSeason || '2026';
            }
            return null;
        } catch (err) {
            console.error('[StaffCore] Failed to get current season:', err);
            return null;
        }
    }

    /**
     * Get the HOD's assigned department
     */
    getHODDepartment() {
        if (!this.profile) return null;
        // HODs have a department field in their profile
        return this.profile.department || null;
    }

    /**
     * Get all departments
     */
    getDepartments() {
        return this.DEPARTMENTS;
    }

    /**
     * Check if a staff belongs to HOD's department
     * @param {object} staffData
     * @param {string} department
     */
    isStaffInDepartment(staffData, department) {
        if (!staffData || !department) return false;
        // Staff have a department field
        return staffData.department === department;
    }

    /**
     * Get track specialists for a given department
     * @param {string} department
     */
    getTrackSpecialists(department) {
        const dept = this.DEPARTMENTS[department];
        return dept ? dept.tracks : [];
    }

    /**
     * Check if user has Universal Track Clearance (UTC)
     * Marketing staff have UTC to bypass gate restrictions
     */
    hasUniversalTrackClearance() {
        if (!this.profile) return false;
        const role = this.profile.primaryRole;
        return role === 'Digital Marketing' || role === 'Director';
    }

    /**
     * Check if user can view trainee for a specific track
     * Specialists can only see trainees in their assigned tracks
     * @param {string} track
     */
    canViewTraineeTrack(track) {
        if (!this.profile) return false;
        
        // Directors and HODs can see all
        if (['Director', 'HOD'].includes(this.profile.primaryRole)) return true;
        
        // Marketing can see all (UTC)
        if (this.profile.primaryRole === 'Digital Marketing') return true;
        
        // Specialists can only see their specific tracks
        if (this.profile.primaryRole === 'Specialist') {
            const deptTracks = this.getTrackSpecialists(this.profile.department);
            return deptTracks.includes(track);
        }
        
        return false;
    }
}

// Initialize global engine with singleton guard
if (!window['staffCore']) {
    StaffCore.start().then((core) => {
        window['staffCore'] = core;
    });
}

export default StaffCore;
