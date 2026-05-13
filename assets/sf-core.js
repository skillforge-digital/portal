/**
 * SkillForge Core Engine (v2.1.0)
 * Unified Tracking, Identity, and Registry Sync
 * Optimized for Security, Performance, and Multi-tab Synchronization
 */

// @ts-ignore
import { db, auth } from './firebase-config.js';
// @ts-ignore
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js';
// @ts-ignore
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, addDoc, collection } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';
import { SystemDebugger } from './system-debugger.js';

export function buildPresencePatch({ registryState, engagementScore, durationSeconds }) {
    const track = registryState?.track ? String(registryState.track).trim() : '';
    const name = registryState?.name ? String(registryState.name).trim() : '';

    const patch = {
        lastSeen: serverTimestamp()
    };

    if (typeof engagementScore === 'number' && Number.isFinite(engagementScore)) {
        patch.engagementScore = engagementScore;
    }

    if (typeof durationSeconds === 'number' && Number.isFinite(durationSeconds) && durationSeconds > 0) {
        patch.totalActiveSeconds = increment(durationSeconds);
    }

    if (track) patch.track = track;
    if (name) patch.name = name;

    return patch;
}

class SkillForgeCore {
    constructor() {
        if (/** @type {any} */(window)._sfCore) return;
        /** @type {any} */(window)._sfCore = this;

        this.db = db;
        this.auth = auth;
        this.uid = null;
        this.sessionStart = Date.now(); // Track session start for diagnostics
        this.registryState = {}; // Exposed for debugging
        this.isTracking = false;
        this.lastPulse = Date.now();
        this.isMasterTab = false;
        this.escalatedCodes = new Set();
        this.originalDisplay = 'block';
        this.engagement = { mouseMoves: 0, keystrokes: 0, startTime: Date.now() };
        this.faults = [];
        this.pulseInterval = null;
        this.detectorInterval = null;
        
        // Master Tab Logic via BroadcastChannel
        this.channel = new BroadcastChannel('sf_system_link');
        this.setupMasterTabLogic();

        // Content Protection: Hide content until authorized
        this.protectContent();
        this.debugger = new SystemDebugger(this);
        this.injectGlobalSupportHub();
    }

    injectGlobalSupportHub() {
        if (document.getElementById('sf-global-support')) return;
        
        const hub = document.createElement('div');
        hub.id = 'sf-global-support';
        hub.className = 'fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-3 no-print';
        hub.innerHTML = `
            <div id="sf-support-menu" class="hidden flex flex-col gap-2 mb-2 animate-slide-up">
                <a href="https://wa.me/2349015185711" target="_blank" class="flex items-center gap-3 px-5 py-3 bg-[#25D366] text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                    <i class="fa-brands fa-whatsapp text-lg"></i> WhatsApp Support
                </a>
                <a href="https://discord.gg/zVCDMNAh8E" target="_blank" class="flex items-center gap-3 px-5 py-3 bg-[#5865F2] text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                    <i class="fa-brands fa-discord text-lg"></i> Discord Hub
                </a>
                <a href="https://t.me/skillforgeorg" target="_blank" class="flex items-center gap-3 px-5 py-3 bg-[#229ED9] text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                    <i class="fa-brands fa-telegram text-lg"></i> Telegram Group
                </a>
            </div>
            <button onclick="document.getElementById('sf-support-menu').classList.toggle('hidden')" class="w-14 h-14 bg-gold rounded-full flex items-center justify-center text-navy shadow-2xl hover:scale-110 active:scale-95 transition-all group">
                <i class="fa-solid fa-headset text-xl group-hover:rotate-12 transition-transform"></i>
            </button>
        `;
        document.body.appendChild(hub);
    }

    /**
     * Static Factory Method to ensure async initialization
     */
    static async start() {
        const core = new SkillForgeCore();
        await core.init();
        return core;
    }

    /**
     * @param {any} user
     * @param {Function} resolve
     */
    async onAuthChange(user, resolve) {
        this.uid = user ? user.uid : null;

        try {
            if (this.uid) {
                void(`[RegistryCore] Cloud Session Verified: ${this.uid}`);
                await this.syncRegistryState();
                await this.initRankEngine(); // Initialize Rank Engine
                this.setupEngagementTracking(); // Initialize Analytics
                this.startFaultDetector(); // Initialize Intelligent Fault Detection
            } else {
                void("[RegistryCore] Access Denied: No active cloud session.");
            }
        } catch (err) {
            void("[RegistryCore] Error during initialization:", err);
            if (window['sf_report_error']) window['sf_report_error']("RegistryCore Init Failed", err.stack);
        } finally {
            this.revealContent();
            resolve();
        }
    }

    async init() {
        return new Promise((resolve) => {
            onAuthStateChanged(this.auth, (/** @type {any} */ user) => {
                if (user) {
                    this.onAuthChange(user, resolve);
                } else {
                    // Fallback to Legacy Mock UID for desynced users
                    const mockUid = localStorage.getItem('skillforge_mock_uid');
                    if (mockUid) {
                        void("[PortalCore] Cloud session missing. Using Legacy Mock Identity:", mockUid);
                        this.onAuthChange({ uid: mockUid, isMock: true }, resolve);
                    } else {
                        this.onAuthChange(null, resolve);
                    }
                }
            });

            // Visibility Pulse
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) this.stopEngagementPulse();
                else this.startEngagementPulse();
            });

            window.addEventListener('beforeunload', () => {
                this.pulse();
                this.channel.postMessage({ type: 'TAB_CLOSING' });
                this.channel.close();
                if (this.uid && this.sessionStart) {
                    const durationMs = Date.now() - this.sessionStart;
                    const path = window.location.pathname;
                    const isAcademy = path.includes('/academy/') && !path.endsWith('/academy/') && !path.includes('gate.html');
                    if (isAcademy && durationMs > 30000) {
                        const { trackId } = this.getPathContext();
                        try {
                            addDoc(collection(this.db, 'academy_sessions'), {
                                uid: this.uid,
                                trackId,
                                path,
                                startedAt: new Date(this.sessionStart).toISOString(),
                                endedAt: new Date().toISOString(),
                                durationMs,
                                durationMinutes: Math.floor(durationMs / 60000),
                                timestamp: serverTimestamp()
                            });
                        } catch(e) { /* best-effort on unload */ }
                    }
                }
            });
        });
    }

    /**
     * RANK ENGINE: Deterministic 6-Tier Progression
     */
    async initRankEngine() {
        if (!this.uid) return;
        
        const traineeRef = doc(this.db, 'trainees', this.uid);
        const trackingRef = doc(this.db, 'tracking', this.uid);
        
        const [traineeSnap, trackingSnap] = await Promise.all([
            getDoc(traineeRef),
            getDoc(trackingRef)
        ]);

        if (!traineeSnap.exists()) return;

        const traineeData = traineeSnap.data();
        const trackingData = trackingSnap.exists() ? trackingSnap.data() : { academyLoginDays: 0 };
        
        const currentLevel = traineeData.level || 0;
        let newLevel = currentLevel;

        // TIER GATES LOGIC
        const loginDays = trackingData.academyLoginDays || 0;
        const examScores = traineeData.examScores || {}; // Placeholder for real exam system
        const avgScore = traineeData.averageScore || 0;

        // Tier 1: Beginner (checklist + cooldown)
        if (currentLevel === 0 && traineeData.onboardingComplete && loginDays >= 1) {
            newLevel = 1;
        }
        // Tier 2: Intermediate 1 (Exam >= 70%)
        else if (currentLevel === 1 && (examScores.module1 || 0) >= 70) {
            newLevel = 2;
        }
        // Tier 3: Intermediate 2 (Avg >= 80% + 7 days)
        else if (currentLevel === 2 && avgScore >= 80 && loginDays >= 7) {
            newLevel = 3;
        }
        // Tier 4: Intermediate 3 (Avg >= 90% + 30 days)
        else if (currentLevel === 3 && avgScore >= 90 && loginDays >= 30) {
            newLevel = 4;
        }
        // Tier 5: Advanced (Avg >= 95% + 90 days)
        else if (currentLevel === 4 && avgScore >= 95 && loginDays >= 90) {
            newLevel = 5;
        }

        if (newLevel > currentLevel) {
            void(`[RankEngine] Promotion Eligibility Detected: Tier ${currentLevel} -> ${newLevel}`);
            await this.promoteUser(currentLevel, newLevel);
        }
    }

    /**
     * @param {any} oldTier
     * @param {any} newLevel
     */
    async promoteUser(oldTier, newLevel) {
        const traineeRef = doc(this.db, 'trainees', this.uid);
        const ledgerRef = collection(this.db, 'audit_logs');

        try {
            // 1. Update Trainee Document
            await updateDoc(traineeRef, {
                level: newLevel,
                lastPromotionAt: serverTimestamp()
            });

            // 2. Write Immutable Ledger Entry
            await addDoc(ledgerRef, {
                userId: this.uid,
                old_tier: oldTier,
                new_tier: newLevel,
                action: 'RANK_PROMOTION',
                trigger: 'AUTOMATIC_ENGINE',
                timestamp: serverTimestamp()
            });

            void(`[RankEngine] Promotion Ledger Committed: Tier ${newLevel}`);
            
            // Dispatch event for UI update
            window.dispatchEvent(new CustomEvent('sf:promotion', { detail: { level: newLevel } }));
        } catch (err) {
            void("[RankEngine] Promotion Failed:", err);
        }
    }

    /**
     * ANALYTICS: Micro-engagement Tracking
     */
    setupEngagementTracking() {
        // Reset counters for the new tracking session
        this.engagement.mouseMoves = 0;
        this.engagement.keystrokes = 0;
        this.engagement.startTime = Date.now();

        // Track micro-interactions
        window.addEventListener('mousemove', () => this.engagement.mouseMoves++);
        window.addEventListener('keydown', () => this.engagement.keystrokes++);
        
        this.startEngagementPulse();
    }

    startEngagementPulse() {
        this.pulseInterval = setInterval(() => this.pulseEngagement(), 60000); // Pulse every 1 min
    }

    stopEngagementPulse() {
        if (this.pulseInterval) clearInterval(this.pulseInterval);
    }

    async pulseEngagement() {
        if (!this.uid) return;
        
        const duration = Math.floor((Date.now() - this.engagement.startTime) / 1000);
        const score = this.calculateSatisfactionScore();

        const metricsRef = doc(this.db, 'presence', this.uid);
        await setDoc(metricsRef, buildPresencePatch({
            registryState: this.registryState,
            engagementScore: score,
            durationSeconds: duration
        }), { merge: true });

        // Reset local counters for next window
        this.engagement.startTime = Date.now();
    }

    calculateSatisfactionScore() {
        // Simple heuristic: f(activity density)
        const density = (this.engagement.mouseMoves + this.engagement.keystrokes) / 60;
        return Math.min(density / 10, 1.0); // Cap at 1.0
    }

    /**
     * INTELLIGENT FAULT DETECTION
     */
    startFaultDetector() {
        if (this.detectorInterval) clearInterval(this.detectorInterval);
        this.faults = [];
        this.detectorInterval = setInterval(() => this.runFaultScan(), 300000); // Scan every 5 min
        this.runFaultScan(); // Immediate initial scan
    }

    async runFaultScan() {
        if (!this.uid) return;
        const newFaults = [];

        try {
            // 1. Registry Data Consistency
            const traineeRef = doc(this.db, 'trainees', this.uid);
            const traineeSnap = await getDoc(traineeRef);
            
            if (!traineeSnap.exists()) {
                newFaults.push({ type: 'CRITICAL', msg: 'Portal profile missing from registry', code: 'REG_MISSING' });
            } else {
                const data = traineeSnap.data();
                if (!data.sfid) newFaults.push({ type: 'WARNING', msg: 'Permanent SFID not yet assigned', code: 'SFID_PENDING' });
                if (data.email !== this.auth.currentUser.email) newFaults.push({ type: 'CRITICAL', msg: 'Email mismatch between Auth and Registry', code: 'EMAIL_MISMATCH' });
            }

            // 2. Track Access Verification
            const pin = traineeSnap.exists() ? traineeSnap.data().pin : null;
            if (pin) {
                const accessSnap = await getDoc(doc(this.db, 'track_access', pin));
                if (!accessSnap.exists()) newFaults.push({ type: 'WARNING', msg: 'Track Access Key invalid or purged', code: 'ACCESS_KEY_VOID' });
            }

            // 3. Escalation Path
            const criticalFaults = newFaults.filter(f => f.type === 'CRITICAL');
            if (criticalFaults.length > 0) {
                await this.escalateFaults(criticalFaults);
            }

            this.faults = newFaults;
            void(`[FaultDetector] Scan complete. ${newFaults.length} issues identified.`);
        } catch (err) {
            void("[FaultDetector] System scan interrupted:", err);
            if (window['sf_report_error']) {
                window['sf_report_error']("Fault Scan Interrupted", err.stack || err.message);
            }
        }
    }

    /**
     * @param {any} faults
     */
    async escalateFaults(faults) {
        const faultsRef = collection(this.db, 'system_faults');
        try {
            for (const fault of faults) {
                if (this.escalatedCodes.has(fault.code)) continue;

                await addDoc(faultsRef, {
                    uid: this.uid,
                    userName: this.registryState?.name || 'Unknown',
                    fault: fault.msg,
                    code: fault.code,
                    timestamp: serverTimestamp(),
                    status: 'reported',
                    context: {
                        url: window.location.href,
                        userAgent: navigator.userAgent
                    }
                });
                
                this.escalatedCodes.add(fault.code);
            }
            if (faults.length > 0) void(`[FaultDetector] ${faults.length} critical faults escalated to Command Center.`);
        } catch (err) {
            void("[FaultDetector] Escalation Failed:", err);
            if (window['sf_report_error']) {
                window['sf_report_error']("Fault Escalation Failed", err.stack || err.message);
            }
        }
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
        
    }

    setupMasterTabLogic() {
        this.channel.onmessage = (event) => {
            if (event.data.type === 'PULSE_HEARTBEAT') {
                // Another tab is already pulsing
                if (this.isMasterTab) {
                    void("[PortalCore] Relinquishing Master Status to newer tab.");
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

        // Fetch basic registry state for debugging and global access
        const traineeSnap = await getDoc(doc(this.db, 'trainees', this.uid));
        if (traineeSnap.exists()) {
            this.registryState = traineeSnap.data();

    // Update My Track link if it exists
    const myTrackLink = document.getElementById('my-track-link');
    if (myTrackLink && this.registryState && this.registryState.track) {
      const trackIdMap = {
        'Forex Synthetics Indices': 'forex-synthetics',
        'Forex Synthetic Indices': 'forex-synthetics',
        'Forex Currency Pairs': 'forex-currency',
        'AI Content Creation': 'ai-content-creation',
        'Photography & Editing': 'photography-and-editing',
        'Graphic Design': 'graphic-design',
        'Digital Marketing': 'digital-marketing',
        'Mobile Cinematography': 'mobile-cinematography',
        'Discord Development': 'discord-development',
        'Web Development': 'web-development',
        'Cyber Security': 'cyber-security'
      };
      const rawTrack = String(this.registryState.track || '').trim();
      const trackId = trackIdMap[rawTrack] || rawTrack.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const passkey = this.registryState.pin || this.registryState.roleCode || '';
      myTrackLink.href = `https://skillforgedigital.com.ng/academy/gate.html?track=${encodeURIComponent(trackId)}${passkey ? '&passkey=' + encodeURIComponent(String(passkey)) : ''}`;
      myTrackLink.classList.remove('opacity-30', 'pointer-events-none');
    }

        } else {
            // Check staffs collection as well just in case
            const staffSnap = await getDoc(doc(this.db, 'staffs', this.uid));
            if (staffSnap.exists()) {
                this.registryState = staffSnap.data();
            } else {
                console.warn("[PortalCore] Profile missing from Registry. Forcing re-authentication.");
                // Strictly delete the fake mock uid if it's invalid so they can't get stuck in a loop
                if (localStorage.getItem('skillforge_mock_uid') === this.uid) {
                    localStorage.removeItem('skillforge_mock_uid');
                }
                
                // Force eject them if they are anywhere in the dashboard
                if (window.location.pathname.includes('/dashboard/') || window.location.pathname.includes('/staffs/')) {
                    window.location.href = '../../trainee-login/?error=profile_missing';
                    return;
                }
            }
        }

        const path = window.location.pathname;
        const isAcademyTrack = path.includes('/academy/') && 
                              !path.endsWith('/academy/') && 
                              !path.endsWith('/academy/index.html') &&
                              !path.includes('gate.html');

        if (isAcademyTrack) {
            const { trackId, lessonId } = this.getPathContext();
            const hasPasscodeSession = this.verifyPasscodeSession(trackId);

            if (hasPasscodeSession) {
                void(`[PortalCore] Academy Access Confirmed: ${trackId}. Activating Trackers.`);
                this.startPortalSync();
                this.handleAcademyActivity();
                this.trackCurrentLesson(trackId, lessonId);
            }
        } else {
            void("[PortalCore] Outside Academy Scope. System trackers in standby.");
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

    /**
     * @param {any} trackId
     */
    verifyPasscodeSession(trackId) {
        if (!trackId) return false;
        const name = `sf_gate_session_${trackId}`;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            const token = parts.pop().split(';').shift();
            try {
                const [, timestamp] = atob(token).split('|');
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
                lastUpdated: serverTimestamp(),
                lastLoginAt: serverTimestamp()
            }, { merge: true });

            await updateDoc(traineeRef, {
                totalLogins: increment(1),
                lastLoginAt: serverTimestamp()
            });
        }
    }

    /**
     * @param {any} track
     * @param {any} lesson
     */
    async trackCurrentLesson(track, lesson) {
        if (!this.uid || !lesson || lesson === track) return;

        void(`[RegistryCore] Tracking: ${track} > ${lesson}`);
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
        } catch (err) { console.error("[RegistryCore] Track Error:", err); }
    }

    async startRegistrySync() {
        if (this.isTracking) return;
        this.isTracking = true;
        this.lastPulse = Date.now();
        
        this.startPulseInterval();
        
        const snap = await getDoc(doc(this.db, 'trainees', this.uid));
        if (snap.exists()) {
            this.checkBirthday(snap.data());
            await this.checkTierUpgrade(doc(this.db, 'trainees', this.uid));
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
        this.startRegistrySync();
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
        const pastDaysOfYear = (now_date.getTime() - startOfYear.getTime()) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        const weekKey = `${now_date.getFullYear()}-W${weekNumber}`;

        const { trackId } = this.getPathContext();
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

            await setDoc(presenceRef, {
                ...batch,
                ...buildPresencePatch({ registryState: this.registryState })
            }, { merge: true });

            if (minutes >= 1) {
                const snap = await getDoc(presenceRef);
                if (snap.exists()) {
                    const todayTime = snap.data().dailyStats?.[todayDate]?.timeSpent || 0;
                    const lastCertUpdate = snap.data().lastCertUpdate || "";
                    if (todayTime >= 1800000 && lastCertUpdate !== todayDate) {
                        await updateDoc(presenceRef, { certDays: increment(1), lastCertUpdate: todayDate });
                    }
                }
                try {
                    await updateDoc(doc(this.db, 'trainees', this.uid), {
                        xp: increment(minutes),
                        lastXpAwardedAt: serverTimestamp()
                    });
                } catch (xpErr) {
                    console.error('[RegistryCore] XP award failed:', xpErr);
                }
            }
        } catch (err) {
            console.error("[RegistryCore] Pulse Failed:", err);
        }
    }

    /**
     * @param {any} ref
     */
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

    /**
     * @param {any} level
     * @param {any} tier
     */
    showMilestoneModal(level, tier) {
        if (document.getElementById('milestone-modal')) return;
        const modalHtml = `
        <div id="milestone-modal" class="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-navy/95 backdrop-blur-2xl">
            <div class="relative max-w-xl w-full bg-navy border border-gold/30 rounded-[50px] p-12 text-center shadow-2xl overflow-hidden">
                <div class="relative z-10">
                    <div class="w-28 h-28 bg-gradient-to-br from-gold to-orange-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <i class="fa-solid fa-bolt-lightning text-5xl text-navy"></i>
                    </div>
                    <p class="text-gold font-black uppercase tracking-[0.5em] text-[10px] mb-4">Advancement Detected</p>
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

    /**
     * @param {any} data
     */
    checkBirthday(data) {
        if (!data.dob) return;
        const today = new Date();
        const [d, m] = data.dob.split('/').map(Number);
        if (today.getDate() === d && (today.getMonth() + 1) === m) {
            this.showBirthdayModal(data.name);
        }
    }

    /**
     * @param {any} name
     */
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
                <button onclick="document.getElementById('birthday-modal').remove()" class="w-full py-6 bg-gold text-navy font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-white transition-all">Claim Gift</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
}

// Initialize via static factory method
SkillForgeCore.start().then(core => {
    /** @type {any} */(window).sfCore = core;
});

export default SkillForgeCore;
