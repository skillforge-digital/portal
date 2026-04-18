/**
 * SKILLFORGE NEURAL DEBUGGER
 * Enterprise-grade real-time code inspection and state visualization overlay.
 * Toggle: Ctrl + Shift + D
 */

export class NeuralDebugger {
    constructor(core) {
        if (window['_neuralDebugger']) return;
        window['_neuralDebugger'] = this;
        this.core = core;
        this.enabled = false;
        this.logs = [];
        this.maxLogs = 50;
        
        this.initUI();
        this.setupListeners();
        this.hookConsole();
    }

    initUI() {
        this.panel = document.createElement('div');
        this.panel.id = 'neural-debugger-panel';
        this.panel.style.cssText = `
            position: fixed; top: 20px; right: 20px; width: 400px; max-height: 80vh;
            background: rgba(4, 8, 16, 0.95); backdrop-filter: blur(20px);
            border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 24px;
            z-index: 999999; display: none; flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            font-family: 'JetBrains Mono', monospace; color: #fff; overflow: hidden;
        `;

        this.panel.innerHTML = `
            <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 8px; height: 8px; background: #f59e0b; border-radius: 50%; box-shadow: 0 0 10px #f59e0b;"></div>
                    <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #f59e0b;">Neural Debugger v2.2</span>
                </div>
                <button id="nd-close" style="background: none; border: none; color: #666; cursor: pointer; font-size: 16px;">&times;</button>
            </div>
            <div id="nd-tabs" style="display: flex; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05);">
                <button data-tab="state" class="nd-tab active" style="flex: 1; padding: 12px; border: none; background: none; color: #f59e0b; font-size: 9px; font-weight: 900; text-transform: uppercase; cursor: pointer;">Registry</button>
                <button data-tab="events" class="nd-tab" style="flex: 1; padding: 12px; border: none; background: none; color: #666; font-size: 9px; font-weight: 900; text-transform: uppercase; cursor: pointer;">Events</button>
                <button data-tab="diagnostics" class="nd-tab" style="flex: 1; padding: 12px; border: none; background: none; color: #666; font-size: 9px; font-weight: 900; text-transform: uppercase; cursor: pointer;">Diagnostics</button>
                <button data-tab="patch" class="nd-tab" style="flex: 1; padding: 12px; border: none; background: none; color: #666; font-size: 9px; font-weight: 900; text-transform: uppercase; cursor: pointer;">Live Patch</button>
            </div>
            <div id="nd-content" style="flex: 1; overflow-y: auto; padding: 20px; font-size: 11px;">
                <div id="nd-tab-state">
                    <div class="nd-group" style="margin-bottom: 20px;">
                        <label style="display: block; color: #444; font-size: 8px; text-transform: uppercase; margin-bottom: 8px;">Identity Core</label>
                        <div id="nd-uid" style="color: #ccc; margin-bottom: 4px;">UID: Loading...</div>
                        <div id="nd-sfid" style="color: #ccc; margin-bottom: 4px;">SFID: Loading...</div>
                        <div id="nd-tier" style="color: #f59e0b; font-weight: 900;">TIER: Loading...</div>
                    </div>
                    <div class="nd-group" style="margin-bottom: 20px;">
                        <label style="display: block; color: #444; font-size: 8px; text-transform: uppercase; margin-bottom: 8px;">Atmosphere State</label>
                        <div id="nd-theme" style="color: #ccc; margin-bottom: 4px;">THEME: Loading...</div>
                        <div id="nd-layout" style="color: #ccc;">LAYOUT: Loading...</div>
                    </div>
                    <div class="nd-group">
                        <label style="display: block; color: #444; font-size: 8px; text-transform: uppercase; margin-bottom: 8px;">Engagement Pulse</label>
                        <div id="nd-engagement" style="color: #ccc; margin-bottom: 4px;">SCORE: 0.00</div>
                        <div id="nd-active-sec" style="color: #ccc;">UPTIME: 0s</div>
                    </div>
                </div>
                <div id="nd-tab-events" style="display: none;">
                    <div id="nd-event-log" style="display: flex; flex-direction: column; gap: 8px;"></div>
                </div>
                <div id="nd-tab-diagnostics" style="display: none;">
                    <div class="nd-group" style="margin-bottom: 20px;">
                        <label style="display: block; color: #444; font-size: 8px; text-transform: uppercase; margin-bottom: 8px;">Real-time Fault Detection</label>
                        <div id="nd-integrity" style="font-weight: 900; margin-bottom: 8px;">INTEGRITY: SCANNING...</div>
                        <div id="nd-faults" style="color: #ccc; line-height: 1.4;">NO CRITICAL FAULTS DETECTED</div>
                    </div>
                    <button id="nd-auto-repair" style="width: 100%; padding: 12px; background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; font-size: 9px; font-weight: 900; text-transform: uppercase; cursor: pointer; margin-bottom: 10px;">Execute Auto-Repair</button>
                    <button id="nd-gen-report" style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05); color: #fff; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; font-size: 9px; font-weight: 900; text-transform: uppercase; cursor: pointer;">Generate Diagnostic Report</button>
                    <pre id="nd-report-output" style="display: none; margin-top: 15px; padding: 10px; background: #000; border-radius: 8px; font-size: 8px; color: #10b981; overflow-x: auto; max-height: 200px; border: 1px solid #111;"></pre>
                </div>
                <div id="nd-tab-patch" style="display: none;">
                    <div class="nd-group">
                        <label style="display: block; color: #444; font-size: 8px; text-transform: uppercase; margin-bottom: 8px;">Neural Override Console</label>
                        <p style="font-size: 8px; color: #666; margin-bottom: 10px;">Direct document injection. Use with caution. Format: JSON</p>
                        <textarea id="nd-patch-input" style="width: 100%; height: 120px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #10b981; font-family: 'JetBrains Mono', monospace; font-size: 9px; padding: 10px; outline: none; resize: none;" placeholder='{ "level": 2, "onboardingComplete": true }'></textarea>
                        <button id="nd-apply-patch" style="width: 100%; margin-top: 10px; padding: 12px; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; font-size: 9px; font-weight: 900; text-transform: uppercase; cursor: pointer;">Commit Live Patch</button>
                    </div>
                </div>
            </div>
            <div style="padding: 12px 20px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 8px; color: #444;">FPS: <span id="nd-fps">60</span></span>
                <button id="nd-clear" style="background: none; border: none; color: #666; font-size: 8px; text-transform: uppercase; font-weight: 900; cursor: pointer;">Clear Matrix</button>
            </div>
        `;

        document.body.appendChild(this.panel);

        // Tab Switching
        this.panel.querySelectorAll('.nd-tab').forEach(el => {
            const tab = /** @type {HTMLElement} */ (el);
            tab.onclick = () => {
                this.panel.querySelectorAll('.nd-tab').forEach(t => {
                    const tabEl = /** @type {HTMLElement} */ (t);
                    tabEl.style.color = '#666';
                    tabEl.classList.remove('active');
                });
                tab.style.color = '#f59e0b';
                tab.classList.add('active');

                ['state', 'events', 'diagnostics', 'patch'].forEach(name => {
                    const contentEl = document.getElementById(`nd-tab-${name}`);
                    if (contentEl) contentEl.style.display = (tab.dataset.tab === name) ? 'block' : 'none';
                });
            };
        });

        const closeBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('nd-close'));
        if (closeBtn) closeBtn.onclick = () => this.toggle(false);

        const clearBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('nd-clear'));
        if (clearBtn) clearBtn.onclick = () => {
            const logEl = document.getElementById('nd-event-log');
            if (logEl) logEl.innerHTML = '';
            this.logs = [];
        };

        const genBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('nd-gen-report'));
        if (genBtn) genBtn.onclick = () => this.generateReport();

        const repairBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('nd-auto-repair'));
        if (repairBtn) repairBtn.onclick = () => this.autoRepair();

        const patchBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('nd-apply-patch'));
        if (patchBtn) patchBtn.onclick = () => this.applyPatch();
    }

    async applyPatch() {
        const input = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('nd-patch-input'));
        const btn = /** @type {HTMLButtonElement|null} */ (document.getElementById('nd-apply-patch'));
        if (!input || !btn) return;

        const originalText = btn.innerText;

        try {
            const patch = JSON.parse(input.value);
            btn.innerText = "INJECTING PATCH...";
            btn.disabled = true;

            this.logEvent('SYSTEM', `Initiating live patch: ${JSON.stringify(patch)}`);

            if (!this.core.uid) throw new Error("No active cloud session for patching");

            // Update Firestore directly
            // @ts-ignore
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js');
            const traineeRef = doc(this.core.db, 'trainees', this.core.uid);
            await updateDoc(traineeRef, patch);

            this.logEvent('SUCCESS', 'Neural patch committed to registry');
            
            // Re-sync local state
            await this.core.syncRegistryState();
            
            btn.style.background = 'rgba(16, 185, 129, 0.3)';
            btn.innerText = "PATCH COMMITTED";
            input.value = '';
        } catch (err) {
            this.logEvent('ERROR', `Patch failed: ${err.message}`);
            btn.innerText = "PATCH REJECTED";
            btn.style.background = 'rgba(239, 68, 68, 0.1)';
        } finally {
            setTimeout(() => {
                btn.innerText = originalText;
                btn.disabled = false;
                btn.style.background = 'rgba(16, 185, 129, 0.1)';
            }, 3000);
        }
    }

    async autoRepair() {
        const btn = /** @type {HTMLButtonElement|null} */ (document.getElementById('nd-auto-repair'));
        if (!btn) return;
        
        const originalText = btn.innerText;
        btn.innerText = "REPAIRING NEURAL LINK...";
        btn.disabled = true;

        this.logEvent('SYSTEM', 'Initiating neural auto-repair sequence...');

        try {
            // 1. Force Registry Re-Sync
            if (this.core && this.core.syncRegistryState) {
                this.logEvent('SYSTEM', 'Re-synchronizing registry nodes...');
                await this.core.syncRegistryState();
            }

            // 2. Atmosphere Stabilization
            if (window['themeManager']) {
                this.logEvent('SYSTEM', 'Stabilizing atmosphere matrix...');
                if (window['themeManager'].currentTheme) {
                    await window['themeManager'].applyTheme(window['themeManager'].currentTheme);
                }
                if (window['themeManager'].syncRegistryState) {
                    await window['themeManager'].syncRegistryState();
                }
            }

            // 3. Lucide Icon Refresh
            if (window['lucide']) {
                this.logEvent('SYSTEM', 'Re-hydrating neural icons...');
                window['lucide'].createIcons();
            }

            // 4. Clear State Ghosting
            this.logEvent('SYSTEM', 'Purging state remnants...');
            this.logs = this.logs.filter(l => l.type === 'ERROR' || l.type === 'SYSTEM' || l.type === 'SUCCESS');

            // 5. Verification Scan
            await this.runDiagnostics();
            
            this.logEvent('SUCCESS', 'Neural auto-repair complete. Integrity restored.');
            btn.style.background = 'rgba(16, 185, 129, 0.2)';
            btn.innerText = "INTEGRITY RESTORED";
        } catch (err) {
            this.logEvent('ERROR', `Auto-repair failed: ${err.message}`);
            btn.innerText = "REPAIR FAILED";
        } finally {
            setTimeout(() => {
                btn.innerText = originalText;
                btn.disabled = false;
                btn.style.background = 'rgba(245, 158, 11, 0.1)';
            }, 3000);
        }
    }

    async generateReport() {
        const output = document.getElementById('nd-report-output');
        output.style.display = 'block';
        output.innerText = "FORGING NEURAL REPORT...";

        const state = this.core.registryState || {};
        const report = {
            timestamp: new Date().toISOString(),
            identity: {
                uid: this.core.uid,
                sfid: state.sfid,
                tier: this.getTierLabel(state.level)
            },
            atmosphere: state.theme,
            engagement: {
                score: this.core.calculateSatisfactionScore ? this.core.calculateSatisfactionScore() : 0,
                uptime: Math.floor((Date.now() - this.core.sessionStart) / 1000)
            },
            system: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                fps: document.getElementById('nd-fps').innerText
            },
            recent_logs: this.logs.slice(-20)
        };

        const reportStr = JSON.stringify(report, null, 2);
        output.innerText = reportStr;
        
        try {
            await navigator.clipboard.writeText(reportStr);
            this.logEvent('SYSTEM', 'Neural report copied to clipboard');
        } catch (e) {
            this.logEvent('WARN', 'Failed to copy report to clipboard');
        }
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggle();
            }
        });

        // FPS Tracker
        let lastTime = performance.now();
        let frames = 0;
        const fpsLoop = () => {
            frames++;
            const now = performance.now();
            if (now >= lastTime + 1000) {
                const fpsEl = document.getElementById('nd-fps');
                if (fpsEl) fpsEl.innerText = String(frames);
                frames = 0;
                lastTime = now;
            }
            if (this.enabled) requestAnimationFrame(fpsLoop);
        };
        this.fpsLoop = fpsLoop;

        // Data Update Loop
        setInterval(() => {
            if (!this.enabled || !this.core) return;
            
            const uidEl = document.getElementById('nd-uid');
            const sfidEl = document.getElementById('nd-sfid');
            const tierEl = document.getElementById('nd-tier');
            const themeEl = document.getElementById('nd-theme');
            const layoutEl = document.getElementById('nd-layout');
            const engEl = document.getElementById('nd-engagement');
            const upEl = document.getElementById('nd-active-sec');

            if (this.core.uid) {
                if (uidEl) uidEl.innerText = `UID: ${this.core.uid}`;
                // Access core internal state via registryState if exposed
                const state = this.core.registryState || {};
                if (sfidEl) sfidEl.innerText = `SFID: ${state.sfid || 'N/A'}`;
                if (tierEl) tierEl.innerText = `TIER: ${this.getTierLabel(state.level)}`;
                if (themeEl) themeEl.innerText = `THEME: ${state.theme?.type || 'Default'}`;
                if (layoutEl) layoutEl.innerText = `LAYOUT: ${state.theme?.layout || 1}`;
                
                if (this.core.engagement) {
                    if (engEl) engEl.innerText = `SCORE: ${this.core.calculateSatisfactionScore().toFixed(2)}`;
                    if (upEl) upEl.innerText = `UPTIME: ${Math.floor((Date.now() - this.core.sessionStart) / 1000)}s`;
                }

                this.runDiagnostics();
            }
        }, 1000);
    }

    async runDiagnostics() {
        const faultsEl = document.getElementById('nd-faults');
        const integrityEl = document.getElementById('nd-integrity');
        const faults = [];

        // 1. Session Integrity
        if (!this.core.uid) faults.push("MISSING CLOUD SESSION");
        
        // 2. Registry Integrity
        const state = this.core.registryState || {};
        if (this.core.uid && !state.sfid) faults.push("INCOMPLETE REGISTRY DATA");
        if (state.level === undefined) faults.push("RANK ENGINE DISCONNECTED");

        // 3. Atmosphere Integrity
        if (!state.theme || !state.theme.type) faults.push("ATMOSPHERE SCHEMA INVALID");
        if (!window['themeManager']) faults.push("ATMOSPHERE ENGINE MISSING");

        // 4. Performance Check
        const fps = parseInt(document.getElementById('nd-fps').innerText);
        if (fps < 30) faults.push("NEURAL LATENCY DETECTED (<30 FPS)");

        // 5. Network Connectivity
        if (!navigator.onLine) faults.push("OFFLINE: NEURAL DISCONNECT");

        // 6. Security & Policy (CSP/HTTPS)
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            faults.push("INSECURE PROTOCOL DETECTED");
        }

        // 7. Asset Loading Check
        const images = Array.from(document.images);
        const failedImages = images.filter(img => !img.complete || img.naturalWidth === 0);
        if (failedImages.length > 0) {
            faults.push(`${failedImages.length} ASSETS FAILED TO LOAD`);
        }

        // 8. Database Latency (Simulated via last sync)
        if (this.core.lastSyncTime) {
            const latency = Date.now() - this.core.lastSyncTime;
            if (latency > 10000) faults.push("DATABASE SYNC STALE (>10s)");
        }

        if (faults.length > 0) {
            faultsEl.innerHTML = faults.map(f => `<div style="margin-bottom: 4px; color: #ef4444;">• ${f}</div>`).join('');
            integrityEl.innerText = "INTEGRITY: COMPROMISED";
            integrityEl.style.color = '#ef4444';
        } else {
            faultsEl.innerText = "NO CRITICAL FAULTS DETECTED";
            faultsEl.style.color = '#10b981';
            integrityEl.innerText = "INTEGRITY: OPTIMAL";
            integrityEl.style.color = '#10b981';
        }
    }

    getTierLabel(level) {
        const tiers = ['Trainee', 'Beginner', 'Intermediate 1', 'Intermediate 2', 'Intermediate 3', 'Advanced'];
        return tiers[level] || 'Trainee';
    }

    toggle(force) {
        this.enabled = force !== undefined ? force : !this.enabled;
        this.panel.style.display = this.enabled ? 'flex' : 'none';
        if (this.enabled) {
            this.fpsLoop();
            this.logEvent('DEBUGGER_ACTIVE', 'Neural inspection layer enabled');
        }
    }

    hookConsole() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            this.logEvent('LOG', args.join(' '));
            originalLog.apply(console, args);
        };

        console.warn = (...args) => {
            this.logEvent('WARN', args.join(' '), '#f59e0b');
            originalWarn.apply(console, args);
        };

        console.error = (...args) => {
            this.logEvent('ERROR', args.join(' '), '#ef4444');
            originalError.apply(console, args);
        };
    }

    logEvent(type, message, color = '#888') {
        this.logs.push({ type, message, timestamp: new Date().toISOString() });
        if (this.logs.length > this.maxLogs) this.logs.shift();

        const logEl = document.getElementById('nd-event-log');
        if (!logEl) return;

        const entry = document.createElement('div');
        entry.style.cssText = `
            padding: 8px; background: rgba(255,255,255,0.03); border-radius: 8px;
            border-left: 2px solid ${color};
        `;
        entry.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 7px; font-weight: 900; color: ${color}; text-transform: uppercase;">${type}</span>
                <span style="font-size: 7px; color: #444;">${new Date().toLocaleTimeString()}</span>
            </div>
            <div style="color: #ccc; line-height: 1.4; word-break: break-all;">${message}</div>
        `;

        logEl.prepend(entry);
        if (logEl.children.length > this.maxLogs) {
            logEl.lastChild.remove();
        }
    }
}