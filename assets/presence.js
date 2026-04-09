/**
 * SkillForge Digital - Presence Tracking Script (v1.1.0)
 * Designed for skillforgedigital.com.ng
 * This script tracks trainee activity and syncs with the Portal Analytics Matrix.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js';

const firebaseConfig = {"apiKey":"AIzaSyAKawPq6ggYmMIyfmaOg_wKklIunc3GyS0","authDomain":"skillforge-digital-portal.firebaseapp.com","projectId":"skillforge-digital-portal","storageBucket":"skillforge-digital-portal.firebasestorage.app","messagingSenderId":"425765825033","appId":"1:425765825033:web:9f75cb46fe58e28acde6d8","measurementId":"G-NFC9TNEK7E"};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let presenceInterval = null;
let startTime = Date.now();
let userRef = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Identify User & Get Metadata
        let userData = { type: 'trainee', name: 'Unknown', track: 'General' };
        
        // Check Trainee Collection
        const traineeSnap = await getDoc(doc(db, 'trainees', user.uid));
        if (traineeSnap.exists()) {
            const data = traineeSnap.data();
            userData = { type: 'trainee', name: data.name, track: data.track };
        } else {
            userData.name = user.displayName || 'Trainee';
        }

        userRef = doc(db, 'presence', user.uid);
        
        // Initial Login Presence Update
        await setDoc(userRef, {
            uid: user.uid,
            ...userData,
            lastActive: Date.now(),
            loginCount: increment(1),
            totalTime: increment(0),
            server_lastActive: serverTimestamp()
        }, { merge: true });

        // Start Heartbeat (Every 30s)
        startHeartbeat();
    } else {
        stopHeartbeat();
    }
});

function startHeartbeat() {
    if (presenceInterval) clearInterval(presenceInterval);
    
    presenceInterval = setInterval(async () => {
        if (!userRef) return;
        
        const now = Date.now();
        const elapsed = now - startTime;
        startTime = now;

        try {
            await updateDoc(userRef, {
                lastActive: now,
                totalTime: increment(elapsed),
                server_lastActive: serverTimestamp()
            });
        } catch (err) {
            console.error("Presence Sync Failed:", err);
        }
    }, 30000); // 30s Heartbeat
}

function stopHeartbeat() {
    if (presenceInterval) clearInterval(presenceInterval);
    presenceInterval = null;
    userRef = null;
}

// Handle Page Visibility
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        startTime = Date.now();
        startHeartbeat();
    } else {
        stopHeartbeat();
    }
});

console.log("SkillForge Presence Tracking Initialized (Trainee Focused).");
