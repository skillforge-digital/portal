/**
 * SkillForge Core Engine (v2.1.0)
 * Unified Tracking, Identity, and Neural Sync
 * Optimized for Security, Performance, and Multi-tab Synchronization
 */

import { db, auth } from './firebase-config.js';
import { onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, addDoc, collection } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';

class SkillForgeCore {
    constructor() {
        this.db = db;
        this.auth = auth;
        
        this.uid = null;
        this.sessionStart = Date.now();
        this.isTracking = false;
        this.lastPulse = Date.now();
        this.isMasterTab = false;
        
        // Master Tab Logic via BroadcastChannel
        this.channel = new BroadcastChannel('sf_neural_sync');
        this.setupMasterTabLogic();

        // Content Protection: Hide content until authorized
        this.protectContent();
    }

    /**
     * Static Factory Method to ensure async initialization
     */
    static async start() {
        const core = new SkillForgeCore();
        await core.init();
        return core;
    }

    async init() {
        return new Promise((resolve) => {
            onAuthStateChanged(this.auth, async (user) => {
                if (user) {
                    this.uid = user.uid;
                    console.log(`[NeuralCore] Session verified for: ${this.uid}`);
                    await this.syncRegistryState();
                    this.revealContent();
                    resolve();
                } else {
                    console.warn("[NeuralCore] No session detected. Initializing anonymous connection...");
                    signInAnonymously(this.auth).catch(err => {
                        console.error("[NeuralCore] Auth failed:", err);
                    });
                }
            });

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) this.stopPulse();
                else this.startPulse();
            });

            window.addEventListener('beforeunload', () => {
                this.pulse();
                this.channel.postMessage({ type: 'TAB_CLOSING' });
                this.channel.close();
            });
        });
    }

    protectContent() {
        // Only protect academy tracks
        if (window.location.pathname.includes('/academy/')) {
            const mainContent = document.querySelector('main') || document.body;
            if (mainContent) {
                this.originalDisplay = mainContent.style.display;
                mainContent.style.display = 'none';
            }
        }
    }

    revealContent() {
        const mainContent = document.querySelector('main') || document.body;
        if (mainContent) {
            mainContent.style.display = this.originalDisplay || 'block';
        }
        document.documentElement.style.visibility = 'visible';
    }

    setupMasterTabLogic() {
        this.channel.onmessage = (event) => {
            if (event.data.type === 'PULSE_HEARTBEAT') {
                // Another tab is already pulsing
                if (this.isMasterTab) {
                    console.log("[NeuralCore] Relinquishing Master Status to newer tab.");
                    this.isMasterTab = false;
                    this.stopPulseInterval();
                }
            }
        };

        // Claim master status if no heartbeat detected
        this.isMasterTab = true;
    }

    async syncRegistryState() {
        if (!this.uid) return;

        const path = window.location.pathname;
        const isAcademyTrack = path.includes('/academy/') && 
                              !path.endsWith('/academy/') && 
                              !path.endsWith('/academy/index.html') &&
                              !path.includes('gate.html');

        if (isAcademyTrack) {
            const { trackId, lessonId } = this.getPathContext();
            const hasPasscodeSession = this.verifyPasscodeSession(trackId);

            if (hasPasscodeSession) {
                console.log(`[NeuralCore] Academy Access Confirmed: ${trackId}. Activating Trackers.`);
                this.startNeuralSync();
                this.handleAcademyActivity();
                this.trackCurrentLesson(trackId, lessonId);
            } else {
                console.log("[NeuralCore] Academy track detected but no active passcode session. Tracking suspended.");
                // Optional: Redirect to gate if session missing
                // window.location.href = '/academy/gate.html';
            }
        } else {
            console.log("[NeuralCore] Outside Academy Scope. Neural trackers in standby.");
            this.stopPulse();
        }
    }

    getPathContext() {
        // Use data attributes if available, otherwise fallback to robust path parsing
        const body = document.body;
        const trackId = body.getAttribute('data-track-id') || this.getCurrentTrack();
        const lessonId = body.getAttribute('data-lesson-id') || window.location.pathname.split('/').filter(p => p).pop();
        
        return { trackId, lessonId };
    }

    getCurrentTrack() {
        const parts = window.location.pathname.split('/').filter(p => p);
        const academyIdx = parts.indexOf('academy');
        return (academyIdx !== -1 && parts.length > academyIdx + 1) ? parts[academyIdx + 1] : null;
    }

    verifyPasscodeSession(trackId) {
        if (!trackId) return false;
        const name = `sf_gate_session_${trackId}`;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            const token = parts.pop().split(';').shift();
            try {
                const [fingerprint, timestamp] = atob(token).split('|');
                return (Date.now() - parseInt(timestamp)) < 24 * 60 * 60 * 1000;
            } catch (e) { return false; }
        }
        return false;
    }

    async handleAcademyActivity() {
        if (!this.uid) return;
        const today = new Date().toISOString().split('T')[0];
        const trackRef = doc(this.db, 'tracking', this.uid);
        const traineeRef = doc(this.db, 'trainees', this.uid);

        const snap = await getDoc(trackRef);
        const data = snap.exists() ? snap.data() : { lastAcademyAccess: '', academyLoginDays: 0 };

        if (data.lastAcademyAccess !== today) {
            await setDoc(trackRef, {
                lastAcademyAccess: today,
                academyLoginDays: increment(1),
                lastUpdated: serverTimestamp()
            }, { merge: true });

            await updateDoc(traineeRef, {
                totalLogins: increment(1)
            });
        }
    }

    async trackCurrentLesson(track, lesson) {
        if (!this.uid || !lesson || lesson === track) return;

        console.log(`[NeuralCore] Tracking: ${track} > ${lesson}`);
        const traineeRef = doc(this.db, 'trainees', this.uid);
        try {
            const snap = await getDoc(traineeRef);
            if (snap.exists()) {
                const data = snap.data();
                const completed = data.completedLessons || [];
                const lessonKey = `${track}:${lesson}`;
                
                if (!completed.includes(lessonKey)) {
                    await updateDoc(traineeRef, {
                        completedLessons: [...completed, lessonKey],
                        lastLesson: { track, lesson, timestamp: Date.now() }
                    });
                } else {
                    await updateDoc(traineeRef, {
                        lastLesson: { track, lesson, timestamp: Date.now() }
                    });
                }
            }
        } catch (err) { console.error("[NeuralCore] Track Error:", err); }
    }

    async startNeuralSync() {
        if (this.isTracking) return;
        this.isTracking = true;
        this.lastPulse = Date.now();
        
        this.startPulseInterval();
        
        const snap = await getDoc(doc(this.db, 'trainees', this.uid));
        if (snap.exists()) {
            this.checkBirthday(snap.data());
        }
    }

    startPulseInterval() {
        this.stopPulseInterval();
        // Pulse every 60 seconds
        this.pulseInterval = setInterval(() => this.pulse(), 60000);
    }

    stopPulseInterval() {
        if (this.pulseInterval) clearInterval(this.pulseInterval);
    }

    stopPulse() {
        if (!this.isTracking) return;
        this.pulse();
        this.stopPulseInterval();
        this.isTracking = false;
    }

    startPulse() {
        if (this.isTracking) return;
        this.lastPulse = Date.now();
        this.startNeuralSync();
    }

    async pulse() {
        if (!this.uid || !this.isTracking || !this.isMasterTab) return;
        
        const path = window.location.pathname;
        const isAcademyLesson = path.includes('/academy/') && 
                                !path.endsWith('/academy/') && 
                                !path.endsWith('/academy/index.html');
        
        if (!isAcademyLesson) return;

        const now = Date.now();
        const elapsed = now - this.lastPulse;
        this.lastPulse = now;
        
        const minutes = Math.floor(elapsed / 60000);
        if (minutes < 1 && elapsed < 30000) return; 

        // Broadcast heartbeat to other tabs
        this.channel.postMessage({ type: 'PULSE_HEARTBEAT', timestamp: now });

        const now_date = new Date();
        const todayDate = now_date.toISOString().split('T')[0];
        const dayName = now_date.toLocaleDateString('en-US', { weekday: 'long' });
        const monthName = now_date.toLocaleDateString('en-US', { month: 'long' });
        const currentHour = now_date.getHours();
        
        const startOfYear = new Date(now_date.getFullYear(), 0, 1);
        const pastDaysOfYear = (now_date - startOfYear) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        const weekKey = `${now_date.getFullYear()}-W${weekNumber}`;

        const { trackId } = this.getPathContext();
        const traineeRef = doc(this.db, 'trainees', this.uid);
        const presenceRef = doc(this.db, 'presence', this.uid);

        try {
            await addDoc(collection(this.db, "academy_audit_logs"), {
                uid: this.uid,
                path: path,
                trackId: trackId,
                timestamp: serverTimestamp(),
                elapsed: elapsed,
                type: 'ACADEMY_PULSE'
            });

            const batch = {
                lastActive: now,
                totalTime: increment(elapsed),
                [`dailyStats.${todayDate}.timeSpent`]: increment(elapsed),
                [`dailyStats.${todayDate}.day`]: dayName,
                [`dailyStats.${todayDate}.month`]: monthName,
                [`dailyStats.${todayDate}.tracks.${trackId}`]: increment(elapsed),
                [`weeklyStats.${weekKey}`]: increment(elapsed),
                [`hourlyStats.${currentHour}`]: increment(elapsed),
                server_lastActive: serverTimestamp()
            };

            await setDoc(presenceRef, batch, { merge: true });

            if (minutes >= 1) {
                const updateData = {
                    xp: increment(minutes),
                    totalTimeSpent: increment(elapsed)
                };

                const snap = await getDoc(presenceRef);
                if (snap.exists()) {
                    const todayTime = snap.data().dailyStats?.[todayDate]?.timeSpent || 0;
                    const lastCertUpdate = snap.data().lastCertUpdate || "";
                    if (todayTime >= 1800000 && lastCertUpdate !== todayDate) {
                        updateData.certDays = increment(1);
                        await updateDoc(presenceRef, { lastCertUpdate: todayDate });
                    }
                }

                await updateDoc(traineeRef, updateData);
                this.checkTierUpgrade(traineeRef);
            }
        } catch (err) {
            console.error("[NeuralCore] Pulse Failed:", err);
        }
    }

    async checkTierUpgrade(ref) {
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const data = snap.data();
        const xp = data.xp || 0;
        const currentLevel = Math.floor(xp / 1000) + 1;
        const lastLevel = data.lastNotifiedLevel || 1;

        let tier = 'Novice';
        if (xp >= 5000) tier = 'Intermediate';
        else if (xp >= 2500) tier = 'Beginner';
        else if (xp >= 1000) tier = 'Starter';

        if (data.tier !== tier) {
            await updateDoc(ref, { tier: tier });
        }

        if (currentLevel > lastLevel) {
            await updateDoc(ref, { lastNotifiedLevel: currentLevel });
            this.showMilestoneModal(currentLevel, tier);
        }
    }

    showMilestoneModal(level, tier) {
        if (document.getElementById('milestone-modal')) return;
        const modalHtml = `
        <div id="milestone-modal" class="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-navy/95 backdrop-blur-2xl">
            <div class="relative max-w-xl w-full bg-navy border border-gold/30 rounded-[50px] p-12 text-center shadow-2xl overflow-hidden">
                <div class="relative z-10">
                    <div class="w-28 h-28 bg-gradient-to-br from-gold to-orange-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <i class="fa-solid fa-bolt-lightning text-5xl text-navy"></i>
                    </div>
                    <p class="text-gold font-black uppercase tracking-[0.5em] text-[10px] mb-4">Neural Advancement Detected</p>
                    <h2 class="text-5xl font-black text-white mb-6 uppercase tracking-tighter">Level ${level} <br><span class="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">Reached</span></h2>
                    <div class="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-gold/10 border border-gold/20 mb-10">
                        <span class="text-gold text-[10px] font-black uppercase tracking-widest">${tier} Status Confirmed</span>
                    </div>
                    <button onclick="document.getElementById('milestone-modal').remove()" class="w-full py-6 bg-white text-navy font-black rounded-3xl uppercase text-xs tracking-[0.3em] shadow-xl hover:bg-gold transition-all transform hover:scale-105 active:scale-95">Acknowledge Evolution</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    checkBirthday(data) {
        if (!data.dob) return;
        const today = new Date();
        const [d, m] = data.dob.split('/').map(Number);
        if (today.getDate() === d && (today.getMonth() + 1) === m) {
            this.showBirthdayModal(data.name);
        }
    }

    showBirthdayModal(name) {
        if (document.getElementById('birthday-modal')) return;
        const modalHtml = `
        <div id="birthday-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-navy/90 backdrop-blur-xl">
            <div class="relative max-w-lg w-full bg-gradient-to-br from-gold/20 to-navy border border-gold/30 rounded-[40px] p-12 text-center shadow-2xl overflow-hidden">
                <div class="w-24 h-24 bg-gold rounded-full flex items-center justify-center mx-auto mb-8">
                    <i class="fa-solid fa-gift text-4xl text-navy"></i>
                </div>
                <h2 class="text-4xl font-black text-white mb-4 uppercase tracking-tighter">Happy Birthday, <br><span class="text-gold">${name.split(' ')[0]}</span>!</h2>
                <p class="text-slate-300 text-sm font-medium mb-10 uppercase tracking-widest">A gift from the SkillForge Command Center awaits you.</p>
                <button onclick="document.getElementById('birthday-modal').remove()" class="w-full py-6 bg-gold text-navy font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-white transition-all">Claim Neural Gift</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
}

// Initialize via static factory method
SkillForgeCore.start().then(core => {
    window.sfCore = core;
});

export default SkillForgeCore;
