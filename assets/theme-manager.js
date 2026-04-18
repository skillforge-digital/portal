import { db, auth } from './firebase-config.js';
import { doc, updateDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js';

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
        this.fonts = [
            { name: 'Space Grotesk', family: "'Space Grotesk', sans-serif" },
            { name: 'Instrument Serif', family: "'Instrument Serif', serif" },
            { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace" },
            { name: 'Unbounded', family: "'Unbounded', sans-serif" },
            { name: 'Caveat', family: "'Caveat', cursive" },
            { name: 'Inter', family: "'Inter', sans-serif" },
            { name: 'Playfair Display', family: "'Playfair Display', serif" },
            { name: 'Outfit', family: "'Outfit', sans-serif" },
            { name: 'Syne', family: "'Syne', sans-serif" },
            { name: 'Clash Display', family: "'Clash Display', sans-serif" },
            { name: 'Lexend', family: "'Lexend', sans-serif" },
            { name: 'Cabinet Grotesk', family: "'Cabinet Grotesk', sans-serif" },
            { name: 'Satoshi', family: "'Satoshi', sans-serif" },
            { name: 'General Sans', family: "'General Sans', sans-serif" },
            { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif" }
        ];
        
        this.init();
        
        // Zero-Refresh Engine (PJAX) Integration
        window.addEventListener('sf:turbo-render', () => {
            console.log(`[ThemeManager] Neural Re-Sync: Performing Layout Hydration`);
            this.applyTheme(this.currentTheme);
            this.applyControls(this.controls);
        });

        // Event listener for theme updates from Customize page
        window.addEventListener('sf:theme_updated', (/** @type {any} */ e) => {
            if (e.detail) {
                this.currentTheme = e.detail;
                this.applyTheme(e.detail);
            }
        });
    }

    async init() {
        this.applyTheme(this.currentTheme);
        this.applyControls(this.controls);

        onAuthStateChanged(auth, (/** @type {any} */ user) => {
            const isProtectedPage = window.location.pathname.includes('trainee-dashboard');
            const isAuthPage = window.location.pathname.includes('login') || window.location.pathname.includes('registration');

            // Cloud-First Session: Always use the permanent Firebase Auth UID
            this.uid = user ? user.uid : null;

            if (this.uid) {
                console.log('ThemeManager: Cloud session active for:', this.uid);
                this.startSync();
            } else {
                if (isProtectedPage && !isAuthPage) {
                    console.warn('ThemeManager: Protected page detected without auth. Redirecting to cloud portal...');
                    const base = window.location.pathname.split('/trainee-dashboard')[0] || '';
                    window.location.href = `${base}/trainee-login/`;
                }
            }
        });
    }

    startSync() {
        if (!this.uid) return;
        
        console.log('ThemeManager: Syncing with registry using identity:', this.uid);
        
        onSnapshot(doc(db, 'trainees', this.uid), (/** @type {any} */ docSnap) => {
            console.log('ThemeManager: Received registry snapshot update');
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.theme) {
                    console.log('ThemeManager: Applying remote theme:', data.theme.type);
                    this.currentTheme = data.theme;
                    this.applyTheme(data.theme);
                }
                if (data.fontFamily) {
                    console.log('ThemeManager: Applying remote font:', data.fontFamily);
                    this.applyFont(data.fontFamily);
                }
                if (data.controls || data.isLightMode !== undefined) {
                    this.controls = {
                        glow: !!data.controls?.glow,
                        light: !!data.isLightMode,
                        performance: !!data.performanceMode
                    };
                    this.applyControls(this.controls);
                }
                if (data.wallpaper) {
                    console.log('ThemeManager: Applying remote wallpaper');
                    this.applyWallpaper(data.wallpaper);
                }
            } else {
                console.warn('ThemeManager: Registry document missing for identity:', this.uid);
                // If on dashboard, trigger redirect to login
                if (window.location.pathname.includes('trainee-dashboard')) {
                    window.location.href = '../trainee-login/?error=stale_session';
                }
            }
        }, (/** @type {any} */ err) => {
            console.error('ThemeManager Snapshot failed:', err);
        });
    }

    applyFont(/** @type {any} */ fontFamily) {
        if (!fontFamily) return;
        document.documentElement.style.setProperty('--font-main', fontFamily);
    }

    applyTheme(/** @type {any} */ theme) {
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
            return;
        }
        document.body.style.backgroundImage = `url('${url}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        if (!this.controls.light) document.body.classList.remove('light');
    }

    async saveLayout(/** @type {any} */ layoutNum) {
        if (!this.uid) return;
        try {
            const themeUpdate = { ...this.currentTheme, layout: layoutNum };
            await updateDoc(doc(db, 'trainees', this.uid), { theme: themeUpdate });
            this.currentTheme = themeUpdate;
            this.applyTheme(themeUpdate);
            return true;
        } catch (/** @type {any} */ err) {
            console.error('Layout Save Failed:', err);
            return false;
        }
    }
}

export const themeManager = new ThemeManager();
/** @type {any} */(window).themeManager = themeManager;
/** @type {any} */(window).showLayout = (/** @type {any} */ l) => themeManager.saveLayout(l);
