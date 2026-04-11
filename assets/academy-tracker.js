/**
 * SkillForge Academy Tracker v1.0
 * Embed this script in skillforgedigital.com.ng to track trainee progress.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js';

const firebaseConfig = { 
  apiKey: "AIzaSyAODtfZDqeR8DH7YRaiDlRwPOBlxxMfFnY", 
  authDomain: "skillfoge-ecosystem.firebaseapp.com", 
  projectId: "skillfoge-ecosystem", 
  storageBucket: "skillfoge-ecosystem.firebasestorage.app", 
  messagingSenderId: "279055501952", 
  appId: "1:279055501952:web:e812364a6f8bcb5998f465", 
  measurementId: "G-L669WT5FZS" 
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

class AcademyTracker {
    constructor() {
        this.uid = localStorage.getItem('skillforge_mock_uid');
        this.sessionStart = Date.now();
        this.isTracking = false;
        this.init();
    }

    async init() {
        onAuthStateChanged(auth, async (user) => {
            if (user || this.uid) {
                this.uid = user ? user.uid : this.uid;
                this.startTracking();
                this.recordLogin();
            }
        });

        // Track tab visibility to pause timer when user leaves
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.stopTracking();
            else this.startTracking();
        });

        // Record time before user leaves page
        window.addEventListener('beforeunload', () => this.recordTimeSpent());
    }

    async recordLogin() {
        if (!this.uid) return;
        const today = new Date().toISOString().split('T')[0];
        const trackRef = doc(db, 'tracking', this.uid);
        const traineeRef = doc(db, 'trainees', this.uid);

        const snap = await getDoc(trackRef);
        const data = snap.exists() ? snap.data() : { lastLogin: '', loginDays: 0, loginCount: 0 };

        if (data.lastLogin !== today) {
            await setDoc(trackRef, {
                lastLogin: today,
                loginDays: increment(1),
                loginCount: increment(1),
                lastUpdated: serverTimestamp()
            }, { merge: true });

            // Reward 50 XP for a new daily login
            await updateDoc(traineeRef, {
                xp: increment(50),
                totalLogins: increment(1)
            });
            console.log('SkillForge: Daily login recorded. +50 XP');
        } else {
            await updateDoc(trackRef, { loginCount: increment(1) });
            await updateDoc(traineeRef, { totalLogins: increment(1) });
        }
    }

    startTracking() {
        if (this.isTracking) return;
        this.sessionStart = Date.now();
        this.isTracking = true;
        // Pulse every 1 minute
        this.pulseInterval = setInterval(() => this.recordTimeSpent(), 60000);
    }

    stopTracking() {
        if (!this.isTracking) return;
        this.recordTimeSpent();
        clearInterval(this.pulseInterval);
        this.isTracking = false;
    }

    async recordTimeSpent() {
        if (!this.uid || !this.isTracking) return;
        const now = Date.now();
        const durationMs = now - this.sessionStart;
        this.sessionStart = now; // Reset for next pulse

        const minutes = Math.floor(durationMs / 60000);
        if (minutes < 1) return;

        const traineeRef = doc(db, 'trainees', this.uid);
        const presenceRef = doc(db, 'presence', this.uid);

        // Update total time and XP (1 XP per minute)
        await updateDoc(traineeRef, {
            xp: increment(minutes),
            totalTimeSpent: increment(durationMs)
        });

        await setDoc(presenceRef, {
            totalTime: increment(durationMs),
            lastSeen: serverTimestamp()
        }, { merge: true });

        this.updateTier(traineeRef);
    }

    async updateTier(ref) {
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const xp = snap.data().xp || 0;
        let tier = 'Trainee';

        if (xp >= 5000) tier = 'Intermediate';
        else if (xp >= 2500) tier = 'Beginner';
        else if (xp >= 1000) tier = 'Starter';

        if (snap.data().tier !== tier) {
            await updateDoc(ref, { tier: tier });
            console.log(`SkillForge: Tier Upgraded to ${tier}!`);
        }
    }
}

window.SF_AcademyTracker = new AcademyTracker();
