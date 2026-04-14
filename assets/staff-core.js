/**
 * SkillForge Staff Core (v2.0.0)
 * Comprehensive Role-Based Access Control (RBAC) Middleware
 */

import { db, auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';

class StaffCore {
    constructor() {
        this.db = db;
        this.auth = auth;
        this.user = null;
        this.profile = null;
        
        // Permission hierarchy
        this.ROLE_HIERARCHY = ['Director', 'HOD', 'Specialist', 'Digital Marketing', 'Support Staff'];
        this.SCOPE_HIERARCHY = {
            'Director': ['global', 'trainees', 'specialists', 'staffs', 'marketing', 'support', 'hod'],
            'HOD': ['hod', 'staffs', 'marketing', 'support'], // Can only edit release and staff dashboards
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
            onAuthStateChanged(this.auth, async (user) => {
                if (user) {
                    this.user = user;
                    const staffDoc = await getDoc(doc(this.db, 'staffs', user.uid));
                    
                    if (staffDoc.exists()) {
                        this.profile = staffDoc.data();
                        this.verifyAccess();
                        this.revealContent();
                        resolve();
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
        const accessMap = {
            '/staffs/director/': ['Director'],
            '/staffs/hod/': ['Director', 'HOD'],
            '/staffs/specialist/': ['Director', 'HOD', 'Specialist'],
            '/staffs/marketing/': ['Director', 'HOD', 'Digital Marketing'],
            '/staffs/support/': ['Director', 'HOD', 'Support Staff']
        };

        const requiredRoles = Object.keys(accessMap).find(p => path.includes(p));
        
        if (requiredRoles) {
            const allowed = accessMap[requiredRoles];
            const hasAccess = this.profile.roles.some(r => allowed.includes(r));
            
            if (!hasAccess) {
                console.error("[StaffCore] Access Denied: Insufficient Clearances.");
                alert("Unauthorized: Your clearance level is insufficient for this command node.");
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
     */
    hasDashboardAccess(dashboardType) {
        if (!this.profile) return false;
        
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
}

// Initialize
StaffCore.start().then(core => {
    window.staffCore = core;
});

export default StaffCore;
