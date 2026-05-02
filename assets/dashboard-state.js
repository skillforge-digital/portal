/**
 * SkillForge Dashboard State Management (v1.0.0)
 * Handles RBAC, Customization, and Real-time Sync.
 */

import { ROLES, getCumulativePermissions, hasPermission } from './rbac-config.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';

export class DashboardState {
    constructor(uid, db) {
        this.uid = uid;
        this.db = db;
        this.userData = null;
        this.permissions = [];
        this.listeners = new Set();
        this.isInitialized = false;
    }

    /**
     * Subscribes a callback to state changes.
     * @param {Function} callback 
     */
    subscribe(callback) {
        this.listeners.add(callback);
        if (this.isInitialized) callback(this.userData, this.permissions);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notifies all subscribers of a change.
     */
    notify() {
        this.listeners.forEach(callback => callback(this.userData, this.permissions));
    }

    /**
     * Initializes the state by syncing with Firestore.
     * @param {Object} data Initial user data from Firestore 
     */
    update(data) {
        this.userData = data;
        this.permissions = getCumulativePermissions(data.roles || [ROLES.TRAINEE]);
        this.isInitialized = true;
        this.notify();
    }

    /**
     * Checks if the user has a specific permission.
     * @param {string} permission 
     */
    can(permission) {
        return hasPermission(this.userData?.roles || [], permission);
    }

    /**
     * Updates user preferences in Firestore.
     * @param {Object} prefs 
     */
    async updatePreferences(prefs) {
        if (!this.uid) return;
        const userRef = doc(this.db, 'trainees', this.uid);
        await setDoc(userRef, { preferences: prefs ?? {} }, { merge: true });
    }
}
