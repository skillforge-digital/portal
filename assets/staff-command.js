/**
 * SkillForge Staff Command Suite (v1.0.0)
 * The "God Mode" engine for Directors and authorized Personnel.
 * Handles RBAC, Season Lifecycle, and Global Command overrides.
 */

import { db, auth } from './firebase-config.js';
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, 
    addDoc, serverTimestamp, query, where, orderBy, limit,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';
import { SeasonEngine } from './season-engine.js';
import { ROLES, PERMISSIONS, hasPermission } from './rbac-config.js';
import { resolveStaffIdentity } from './staff-identity.js';

export class StaffCommandSuite {
    constructor() {
        this.uid = null;
        this.userData = null;
        this.seasonEngine = null;
        this.isInitialized = false;
    }

    async init(uid) {
        if (this.isInitialized) return;
        this.uid = uid;
        this.seasonEngine = new SeasonEngine(uid);

        const resolved = await resolveStaffIdentity(uid);
        if (!resolved.found || !resolved.profile) return false;

        this.userData = resolved.profile;
        this.isInitialized = true;
        void("🛠️ Staff Command Suite Initialized for:", this.userData.name);
        return true;
    }

    // --- SYSTEM CONTROL (GOD MODE) ---

    async toggleSystemFlag(flag, value) {
        if (!this.can(PERMISSIONS.MAINTENANCE_MODE)) return { success: false, error: "Unauthorized" };
        
        try {
            const configRef = doc(db, 'system', 'config');
            await setDoc(configRef, { [flag]: value }, { merge: true });
            await this.logAudit('SYSTEM_TOGGLE', `Flag ${flag} set to ${value}`);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async updateRegistrationDates(start, end) {
        if (!this.can(PERMISSIONS.EDIT_REGISTRATION_DATES)) return { success: false, error: "Unauthorized" };
        
        try {
            await this.seasonEngine.updateRegistrationDates(start, end);
            await this.logAudit('DATE_UPDATE', `Registration dates set: ${start} to ${end}`);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // --- ROLE MANAGEMENT (DISCORD STYLE) ---

    async assignRoleToUser(targetUid, roleName, collectionType = 'staffs') {
        if (!this.can(PERMISSIONS.CREATE_ROLES)) return { success: false, error: "Unauthorized" };
        
        try {
            const userRef = doc(db, collectionType, targetUid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) throw new Error("User document missing");

            const currentRoles = userSnap.data().roles || [];
            if (!currentRoles.includes(roleName)) {
                currentRoles.push(roleName);
                await updateDoc(userRef, { roles: currentRoles });
                await this.logAudit('ROLE_ASSIGN', `Role ${roleName} assigned to ${targetUid}`);
            }
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async removeRoleFromUser(targetUid, roleName, collectionType = 'staffs') {
        if (!this.can(PERMISSIONS.CREATE_ROLES)) return { success: false, error: "Unauthorized" };
        
        try {
            const userRef = doc(db, collectionType, targetUid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) throw new Error("User document missing");

            let currentRoles = userSnap.data().roles || [];
            currentRoles = currentRoles.filter(r => r !== roleName);
            await updateDoc(userRef, { roles: currentRoles });
            await this.logAudit('ROLE_REMOVE', `Role ${roleName} removed from ${targetUid}`);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // --- ANNOUNCEMENT SYSTEM ---

    async broadcastAnnouncement(title, content, target = 'Global') {
        if (!this.can(PERMISSIONS.GLOBAL_ANNOUNCEMENT)) return { success: false, error: "Unauthorized" };

        try {
            // CEO Priority Check (Emmanuel Umoh or specific UID)
            const isCEO = this.uid === '32NOc1lUm2XEUZy4HJQBXlFngm13' || this.userData.name?.includes('EMMANUEL');
            
            await addDoc(collection(db, 'announcements'), {
                title: title.toUpperCase(),
                content: content,
                target: target,
                author: this.userData.name,
                authorUid: this.uid,
                priority: isCEO ? 100 : 1,
                timestamp: serverTimestamp()
            });
            
            await this.logAudit('ANNOUNCEMENT', `Broadcast: ${title} to ${target}`);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // --- AUDIT & UTILS ---

    async logAudit(action, details) {
        try {
            await addDoc(collection(db, 'audit_logs'), {
                action,
                details,
                performedBy: this.userData.name,
                performerUid: this.uid,
                timestamp: serverTimestamp()
            });
        } catch (e) {
            void("Audit log failed:", e);
        }
    }

    can(permission) {
        if (!this.userData) return false;
        return hasPermission(this.userData.roles, permission);
    }
}

export const staffCommand = new StaffCommandSuite();
