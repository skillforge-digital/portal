/**
 * SkillForge Digital - Presence & Birthday Engine (v1.3.0)
 * Designed for skillforgedigital.com.ng & portal
 * Tracks trainee activity by day and calculates precise study hours.
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

// Get UID from localStorage (set during login)
const uid = localStorage.getItem('skillforge_mock_uid');
if (uid) {
    initPresence({ uid: uid });
}

async function initPresence(user) {
    let userData = { type: 'trainee', name: 'Unknown', track: 'General' };
    
    // Check Trainee Collection
    const traineeSnap = await getDoc(doc(db, 'trainees', user.uid));
    if (traineeSnap.exists()) {
        const data = traineeSnap.data();
        userData = { type: 'trainee', name: data.name, track: data.track, dob: data.dob };
        checkBirthday(userData);
    } else {
        userData.name = user.displayName || 'Trainee';
    }

    userRef = doc(db, 'presence', user.uid);
    
    const todayDate = new Date().toISOString().split('T')[0]; // e.g. "2026-04-06"
    
    await setDoc(userRef, {
        uid: user.uid,
        ...userData,
        lastActive: Date.now(),
        loginCount: increment(1),
        server_lastActive: serverTimestamp(),
        [`dailyStats.${todayDate}.lastLogin`]: Date.now()
    }, { merge: true });

    startHeartbeat();
}

function checkBirthday(data) {
    if (!data.dob) return;
    const today = new Date();
    const [d, m] = data.dob.split('/').map(Number);
    if (today.getDate() === d && (today.getMonth() + 1) === m) {
        showBirthdayModal(data.name);
    }
}

function showBirthdayModal(name) {
    if (document.getElementById('birthday-modal')) return;
    const modalHtml = `
    <div id="birthday-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-navy/90 backdrop-blur-xl animate-fade-in">
        <div class="relative max-w-lg w-full bg-gradient-to-br from-gold/20 to-navy border border-gold/30 rounded-[40px] p-12 text-center shadow-2xl overflow-hidden">
            <div class="relative z-10">
                <div class="w-24 h-24 bg-gold rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-gold/20">
                    <svg class="w-12 h-12 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
                    </svg>
                </div>
                <h2 class="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Happy Birthday, <br><span class="text-gold">${name.split(' ')[0]}</span>!</h2>
                <p class="text-slate-300 text-sm font-medium mb-10 leading-relaxed uppercase tracking-widest">Today, we celebrate your journey in the SkillForge Ecosystem.</p>
                <button onclick="document.getElementById('birthday-modal').remove()" class="w-full py-6 bg-gold text-navy font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-white transition-all">Claim Gift</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function startHeartbeat() {
    if (presenceInterval) clearInterval(presenceInterval);
    presenceInterval = setInterval(async () => {
        if (!userRef) return;
        const now = Date.now();
        const elapsed = now - startTime;
        startTime = now;
        const todayDate = new Date().toISOString().split('T')[0];

        try {
            await updateDoc(userRef, {
                lastActive: now,
                totalTime: increment(elapsed),
                [`dailyStats.${todayDate}.timeSpent`]: increment(elapsed),
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

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        startTime = Date.now();
        startHeartbeat();
    } else {
        stopHeartbeat();
    }
});

console.log("SkillForge Presence v1.3.0 Active (Daily Tracking).");
