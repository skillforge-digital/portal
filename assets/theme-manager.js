import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, serverTimestamp, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {"apiKey":"AIzaSyAKawPq6ggYmMIyfmaOg_wKklIunc3GyS0","authDomain":"skillforge-digital-portal.firebaseapp.com","projectId":"skillforge-digital-portal","storageBucket":"skillforge-digital-portal.firebasestorage.app","messagingSenderId":"425765825033","appId":"1:425765825033:web:9f75cb46fe58e28acde6d8","measurementId":"G-NFC9TNEK7E"};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class ThemeManager {
    constructor() {
        this.uid = localStorage.getItem('skillforge_mock_uid');
        if (!this.uid && !window.location.pathname.includes('login') && !window.location.pathname.includes('registration')) {
            window.location.href = '../trainee-login/index.html';
        }
        this.currentTheme = JSON.parse(localStorage.getItem('sf_global_theme') || '{}');
        this.controls = {
            glow: localStorage.getItem('sf_glow_mode') === 'true',
            light: localStorage.getItem('sf_light_mode') === 'true',
            performance: localStorage.getItem('sf_performance_mode') === 'true'
        };
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.applyControls(this.controls);

        onSnapshot(doc(db, 'trainees', this.uid), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data.theme) {
                    this.currentTheme = data.theme;
                    localStorage.setItem('sf_global_theme', JSON.stringify(data.theme));
                    this.applyTheme(data.theme);
                }
                if (data.controls || data.isLightMode !== undefined) {
                    this.controls = {
                        glow: !!data.controls?.glow,
                        light: !!data.isLightMode,
                        performance: !!data.performanceMode
                    };
                    localStorage.setItem('sf_glow_mode', this.controls.glow);
                    localStorage.setItem('sf_light_mode', this.controls.light);
                    localStorage.setItem('sf_performance_mode', this.controls.performance);
                    this.applyControls(this.controls);
                }
                if (data.wallpaper) {
                    this.applyWallpaper(data.wallpaper);
                }
            }
        });
    }

    applyTheme(theme) {
        if (!theme) return;
        const root = document.documentElement;

        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '245, 158, 11';
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
        } else if (theme.type === 'premium-gradient') {
            const grad = `linear-gradient(135deg, ${theme.colors.join(', ')})`;
            root.style.setProperty('--accent-gradient', grad);
            root.style.setProperty('--accent-color', theme.colors[0]);
            root.style.setProperty('--accent-color-secondary', theme.colors[1]);
            root.style.setProperty('--accent-color-rgb', hexToRgb(theme.colors[0]));
            root.style.setProperty('--global-bg', grad);
            document.body.style.background = grad;
            document.body.style.backgroundAttachment = 'fixed';
        } else if (theme.type === 'solid-pair' || theme.type === 'dual') {
            const primary = theme.primary || theme.color;
            const secondary = theme.secondary || primary;
            root.style.setProperty('--accent-color', primary);
            root.style.setProperty('--accent-color-secondary', secondary);
            root.style.setProperty('--accent-color-rgb', hexToRgb(primary));
            root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${primary}, ${secondary})`);
            root.style.setProperty('--global-bg', '#040810');
            document.body.style.background = '#040810';
        } else if (theme.type === 'accent') {
            root.style.setProperty('--accent-color', theme.color);
            root.style.setProperty('--accent-color-rgb', hexToRgb(theme.color));
            root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${theme.color}, ${theme.color})`);
            root.style.setProperty('--global-bg', '#040810');
            document.body.style.background = '#040810';
        }

        if (theme.layout && (window.location.pathname.endsWith('index.html') || window.location.pathname === '/')) {
            if (typeof window.showLayout === 'function') {
                window.showLayout(theme.layout);
            }
        }
    }

    applyControls(controls) {
        const body = document.body;
        controls.glow ? body.classList.add('glow-mode') : body.classList.remove('glow-mode');
        controls.light ? body.classList.add('light') : body.classList.remove('light');
        controls.performance ? body.classList.add('perf-mode') : body.classList.remove('perf-mode');
    }

    applyWallpaper(url) {
        if (!url) {
            document.body.style.backgroundImage = '';
            return;
        }
        document.body.style.backgroundImage = `url('${url}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
    }

    async saveLayout(layoutNum, source = 'LAYOUT_ENGINE') {
        try {
            const themeUpdate = { ...this.currentTheme, layout: layoutNum };
            await setDoc(doc(db, 'trainees', this.uid), { theme: themeUpdate }, { merge: true });
            await this.logChange('LAYOUT_UPDATE', { source, old: this.currentTheme.layout, new: layoutNum });
            this.currentTheme = themeUpdate;
            localStorage.setItem('sf_global_theme', JSON.stringify(themeUpdate));
            this.applyTheme(themeUpdate);
            return true;
        } catch (err) {
            console.error('Layout Save Failed:', err);
            return false;
        }
    }

    async saveTheme(theme, source = 'UNKNOWN') {
        try {
            await setDoc(doc(db, 'trainees', this.uid), { theme }, { merge: true });
            await this.logChange('THEME_UPDATE', { source, old: this.currentTheme, new: theme, type: theme.type });
            this.currentTheme = theme;
            localStorage.setItem('sf_global_theme', JSON.stringify(theme));
            this.applyTheme(theme);
            return true;
        } catch (err) {
            console.error('Theme Save Failed:', err);
            return false;
        }
    }

    async saveControls(controls, source = 'SETTINGS') {
        try {
            const update = { 'controls.glow': controls.glow, isLightMode: controls.light, performanceMode: controls.performance };
            await setDoc(doc(db, 'trainees', this.uid), update, { merge: true });
            await this.logChange('CONTROLS_UPDATE', { source, controls });
            this.controls = controls;
            this.applyControls(controls);
            return true;
        } catch (err) {
            console.error('Controls Save Failed:', err);
            return false;
        }
    }

    async saveWallpaper(url, source = 'CUSTOMIZE') {
        try {
            await setDoc(doc(db, 'trainees', this.uid), { wallpaper: url }, { merge: true });
            await this.logChange('WALLPAPER_UPDATE', { source, url });
            this.applyWallpaper(url);
            return true;
        } catch (err) {
            console.error('Wallpaper Save Failed:', err);
            return false;
        }
    }

    async logChange(action, modifications) {
        try {
            await addDoc(collection(db, 'audit_logs'), {
                userId: this.uid,
                action,
                modifications,
                timestamp: serverTimestamp(),
                userAgent: navigator.userAgent,
                page: window.location.pathname
            });
        } catch (err) {
            console.warn('Logging failed:', err);
        }
    }
}

export const themeManager = new ThemeManager();
window.themeManager = themeManager;
