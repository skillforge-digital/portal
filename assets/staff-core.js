/**
 * SkillForge Staff Core (v1.0.0)
 * Personnel Session Management & Role-Based Access Control
 */

import { db, auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';

class StaffCore {
    constructor() {
        this.db = db;
        this.auth = auth;
        this.user = null;
        this.profile = null;
        
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
        const role = this.profile.primaryRole;
        
        // Map paths to required roles
        const accessMap = {
            '/staffs/director/': ['Director'],
            '/staffs/hod/': ['Director', 'HOD'],
            '/staffs/specialist/': ['Director', 'HOD', 'Specialist'],
            '/staffs/marketing/': ['Director', 'HOD', 'Digital Marketing'],
            '/staffs/support/': ['Director', 'HOD', 'Support Staff']
        };

        // Find matching access rule
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
        // Prevent redirect loop if already on login/reg
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
}

// Initialize
StaffCore.start().then(core => {
    window.staffCore = core;
});

export default StaffCore;
