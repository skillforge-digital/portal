import { db, auth } from './firebase-config.js';
import { doc, updateDoc, onSnapshot, getDoc } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js';
import { DESIGN_STUDIO_FONTS } from './design-studio-presets.js';
import { scheduleBackgroundHydration } from './generated-image.js';

class ThemeManager {
    constructor() {
        if (/** @type {any} */(window)._sfThemeManager) return;
        /** @type {any} */(window)._sfThemeManager = this;
        
        this.uid = null;
        this.currentTheme = { type: 'solid-pair', primary: '#040810', secondary: '#f59e0b' };
        this.controls = {
            glow: false,
            light: false,
            performance: false
        };
        this.fonts = (Array.isArray(DESIGN_STUDIO_FONTS) ? DESIGN_STUDIO_FONTS : []).map((f) => ({
            name: f.name,
            family: f.family,
            google: true
        }));
        this.loadedGoogleFonts = new Set();
        this.activeUnsub = null;
        
        this.init();
        
        // Zero-Refresh Engine (PJAX) Integration
        window.addEventListener('sf:turbo-render', () => {
            void(`[ThemeManager] Registry Re-Sync: Performing Layout Hydration`);
            this.applyTheme(this.currentTheme);
            this.applyControls(this.controls);
        });

        // Event listener for theme updates from Customize page
        window.addEventListener('sf:theme_updated', (/** @type {any} */ e) => {
            if (!e.detail) return;
            const t = e.detail;
            this.currentTheme = t;
            this.applyTheme(t);
            if (t.fontFamily || t.fontName) this.applyFont(t.fontFamily || t.fontName);
            if (t.wallpaper !== undefined) this.applyWallpaper(t.wallpaper);
        });
    }

    async init() {
        this.applyTheme(this.currentTheme);
        this.applyControls(this.controls);

        onAuthStateChanged(auth, (/** @type {any} */ user) => {
            const isProtectedPage = window.location.pathname.includes('trainee-dashboard');
            const isAuthPage = window.location.pathname.includes('login') || window.location.pathname.includes('registration');

            // Cloud-First Session with Legacy Fallback
            this.uid = user ? user.uid : localStorage.getItem('skillforge_mock_uid');

            if (this.uid) {
                void('ThemeManager: Identity linked for:', this.uid);
                this.startSync();
            } else {
                if (isProtectedPage && !isAuthPage) {
                    void('ThemeManager: No identity found. Redirecting to cloud portal...');
                    const base = window.location.pathname.split('/trainee-dashboard')[0] || '';
                    window.location.href = `${base}/trainee-login/`;
                }
            }
        });
    }

    startSync() {
        if (!this.uid) return;
        
        void('ThemeManager: Syncing with registry using identity:', this.uid);
        
        const syncData = (data) => {
            const theme = data.theme || {};
            if (theme && Object.keys(theme).length) {
                void('ThemeManager: Applying remote theme:', theme.type || 'custom');
                this.currentTheme = theme;
                this.applyTheme(theme);
            } else {
                void('ThemeManager: No remote theme found, applying default.');
                this.applyTheme({});
            }
            
            const remoteFont = theme.fontFamily || data.fontFamily;
            if (remoteFont) {
                void('ThemeManager: Applying remote font:', remoteFont);
                this.applyFont(remoteFont);
            } else {
                this.applyFont("'Space Grotesk', sans-serif");
            }

            if (data.controls || data.isLightMode !== undefined) {
                this.controls = {
                    glow: !!data.controls?.glow,
                    light: !!data.isLightMode,
                    performance: !!data.performanceMode
                };
                this.applyControls(this.controls);
            }

            const remoteWallpaper = (data.settings && data.settings.wallpaper) ? data.settings.wallpaper : (theme.wallpaper || data.wallpaper);
            if (remoteWallpaper) {
                void('ThemeManager: Applying remote wallpaper');
                this.applyWallpaper(remoteWallpaper);
            } else {
                this.applyWallpaper('');
            }

            // Signal that theme sync is complete
            window.dispatchEvent(new CustomEvent('sf:theme_synced', { detail: data }));
            
            // Emergency loader hide if trapped
            if (typeof (/** @type {any} */(window)).hideLoading === 'function') {
                (/** @type {any} */(window)).hideLoading();
            }
        };

        const sources = [
            doc(db, 'staffs', this.uid),
            doc(db, 'directors', this.uid),
            doc(db, 'hods', this.uid),
            doc(db, 'specialists', this.uid),
            doc(db, 'trainees', this.uid)
        ];

        const start = async () => {
            if (this.activeUnsub) {
                this.activeUnsub();
                this.activeUnsub = null;
            }

            for (const ref of sources) {
                const snap = await getDoc(ref).catch(() => null);
                if (snap && snap.exists()) {
                    this.activeUnsub = onSnapshot(ref, (s) => {
                        if (s.exists()) syncData(s.data());
                    });
                    return;
                }
            }

            void('ThemeManager: Registry document missing for identity:', this.uid);
            if (window.location.pathname.includes('trainee-dashboard')) {
                window.location.href = '../trainee-login/?error=stale_session';
            }
        };

        void start();
    }

    ensureGoogleFontLoaded(fontFamily) {
        const match = this.fonts.find(f => f.family === fontFamily || f.name === fontFamily);
        if (!match || !match.google) return;
        if (this.loadedGoogleFonts.has(match.name)) return;
        this.loadedGoogleFonts.add(match.name);
        const family = encodeURIComponent(match.name).replace(/%20/g, '+');
        const href = `https://fonts.googleapis.com/css2?family=${family}:wght@300;400;500;600;700;800;900&display=swap`;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    applyFont(/** @type {any} */ fontFamily) {
        if (!fontFamily) return;
        this.ensureGoogleFontLoaded(fontFamily);
        document.documentElement.style.setProperty('--font-main', fontFamily);
    }

    applyTheme(/** @type {any} */ theme) {

        // Handle Daily Canvas globally
        if (theme.canvasActive !== undefined || theme.canvasColors !== undefined) {
            window.dispatchEvent(new CustomEvent('canvas-settings-changed', { 
                detail: { 
                    active: theme.canvasActive, 
                    colors: theme.canvasColors 
                } 
            }));
        }

        if (!theme || Object.keys(theme).length === 0) {
            theme = { type: 'solid-pair', primary: '#040810', secondary: '#f59e0b' };
        }
        
        const root = document.documentElement;
        const body = document.body;
        
        this.currentTheme = theme;

        const hexToRgb = (/** @type {any} */ hex) => {
            if (!hex || typeof hex !== 'string') return '245, 158, 11';
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '245, 158, 11';
        };
        const hexToLum = (/** @type {any} */ hex) => {
            if (!hex || typeof hex !== 'string') return 0.2;
            const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (!m) return 0.2;
            const srgb = [parseInt(m[1],16)/255, parseInt(m[2],16)/255, parseInt(m[3],16)/255].map(v => v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
            return 0.2126*srgb[0]+0.7152*srgb[1]+0.0722*srgb[2];
        };
        const autoContrast = (/** @type {any} */ bgHex) => {
            if (this.controls.light) return;
            const lum = hexToLum(bgHex);
            if (lum > 0.6) {
                body.classList.add('light');
                document.documentElement.style.setProperty('--text-main', '#040810');
                document.documentElement.style.setProperty('--text-muted', 'rgba(4, 8, 16, 0.6)');
            } else {
                body.classList.remove('light');
                document.documentElement.style.setProperty('--text-main', '#f1f5f9');
                document.documentElement.style.setProperty('--text-muted', 'rgba(241, 245, 249, 0.6)');
            }
        };
        
        if (theme.type === 'gradient') {
            const grad = `linear-gradient(135deg, ${theme.c1}, ${theme.c2})`;
            root.style.setProperty('--accent-gradient', grad);
            root.style.setProperty('--accent-color', theme.c1);
            root.style.setProperty('--accent-color-secondary', theme.c2);
            root.style.setProperty('--accent-color-rgb', hexToRgb(theme.c1));
            root.style.setProperty('--global-bg', grad);
            document.body.style.background = grad;
            document.body.style.backgroundAttachment = 'fixed';
            autoContrast(theme.c1);
            window.dispatchEvent(new CustomEvent('sf:bg_update', { detail: { colors: [theme.c1, theme.c2] } }));
        } else if (theme.type === 'premium-gradient') {
            const grad = `linear-gradient(135deg, ${theme.colors.join(', ')})`;
            root.style.setProperty('--accent-gradient', grad);
            root.style.setProperty('--accent-color', theme.colors[0]);
            root.style.setProperty('--accent-color-secondary', theme.colors[1]);
            root.style.setProperty('--accent-color-rgb', hexToRgb(theme.colors[0]));
            root.style.setProperty('--global-bg', grad);
            document.body.style.background = grad;
            document.body.style.backgroundAttachment = 'fixed';
            autoContrast(theme.colors[0]);
            window.dispatchEvent(new CustomEvent('sf:bg_update', { detail: { colors: theme.colors } }));
        } else if (theme.type === 'solid-pair' || theme.type === 'dual') {
            const primary = theme.primary || theme.color;
            const secondary = theme.secondary || primary;
            root.style.setProperty('--accent-color', primary);
            root.style.setProperty('--accent-color-secondary', secondary);
            root.style.setProperty('--accent-color-rgb', hexToRgb(primary));
            root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${primary}, ${secondary})`);
            root.style.setProperty('--global-bg', '#040810');
            document.body.style.background = '#040810';
            autoContrast(secondary);
            window.dispatchEvent(new CustomEvent('sf:bg_update', { detail: { colors: [primary, secondary] } }));
        } else if (theme.type === 'accent') {
            root.style.setProperty('--accent-color', theme.color);
            root.style.setProperty('--accent-color-rgb', hexToRgb(theme.color));
            root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${theme.color}, ${theme.color})`);
            root.style.setProperty('--global-bg', '#040810');
            document.body.style.background = '#040810';
            autoContrast(theme.color);
        }

        if (theme.layout && (window.location.pathname.endsWith('trainee-dashboard/') || window.location.pathname.endsWith('trainee-dashboard/index.html'))) {
            if (typeof (/** @type {any} */(window)).showLayout === 'function') {
                (/** @type {any} */(window)).showLayout(theme.layout);
            }
        }
    }

    applyControls(/** @type {any} */ controls) {
        const body = document.body;
        controls.glow ? body.classList.add('glow-mode') : body.classList.remove('glow-mode');
        controls.light ? body.classList.add('light') : body.classList.remove('light');
        controls.performance ? body.classList.add('perf-mode') : body.classList.remove('perf-mode');
    }

    applyWallpaper(/** @type {any} */ url) {
        if (!url) {
            document.body.style.backgroundImage = '';
            document.documentElement.style.removeProperty('--sf-wallpaper');
            return;
        }
        scheduleBackgroundHydration(document.body, url, { intervalMs: 1600, maxAttempts: 14 });
        document.documentElement.style.setProperty('--sf-wallpaper', `url("${String(url).replace(/"/g, '\\"')}")`);
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        const ua = String(navigator.userAgent || '');
        const isIOS = /iP(hone|od|ad)/i.test(ua);
        document.body.style.backgroundAttachment = isIOS ? 'scroll' : 'fixed';
        if (!this.controls.light) document.body.classList.remove('light');
    }

    async saveLayout(layoutNum) {
        if (!this.uid) return;
        try {
            const themeUpdate = { ...this.currentTheme, layout: layoutNum };
            
            const sources = [
                doc(db, 'staffs', this.uid),
                doc(db, 'directors', this.uid),
                doc(db, 'hods', this.uid),
                doc(db, 'specialists', this.uid),
                doc(db, 'trainees', this.uid)
            ];

            let userRef = null;
            for (const ref of sources) {
                const snap = await getDoc(ref).catch(() => null);
                if (snap && snap.exists()) {
                    userRef = ref;
                    break;
                }
            }
            if (!userRef) return false;

            await updateDoc(userRef, { theme: themeUpdate });
            this.currentTheme = themeUpdate;
            this.applyTheme(themeUpdate);
            return true;
        } catch (err) {
            void('Layout Save Failed:', err);
            if (window['sf_report_error']) {
                window['sf_report_error'](`Layout Engine Error: Layout Save Failed. ${err.message}`, err.stack, true);
            }
            return false;
        }
    }
}

export const themeManager = new ThemeManager();
if (!(window).showLayout) {
    (window).showLayout = (l) => themeManager.saveLayout(l);
}
